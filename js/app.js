/**
 * Impossible Chess - Main Application Controller
 */

import { pieceSymbols, pieceValues } from './config.js';
import { sound } from './audio.js';
import { ChessSearchEngine } from './engine/search.js';
import {
  getPlayerNickname,
  setPlayerNickname,
  getStoredVictories,
  getWinStreak,
  saveVictory,
  updateVictoryNickname,
  purgeOnLoss
} from './storage/permadeath.js';
import { updateEvalBar } from './ui/evalbar.js';
import { ReplayController } from './ui/replay.js';
import { BoardRenderer } from './ui/board.js';
import { gameAnalysisView } from './ui/analysis_view.js';
import { globalTicker } from './ui/ticker.js';

// 1. App State
const chess = new Chess();
const searchEngine = new ChessSearchEngine(chess);

let selectedSquare = null;
let legalMovesForSelected = [];
let lastMove = null;
let isAiThinking = false;
let playerColor = 'w';
let isBoardFlipped = false;
let aiDifficulty = 4;
let pendingPromotion = null;

let timerBaseSeconds = 0;
let whiteTime = 0;
let blackTime = 0;
let timerInterval = null;

let currentHofTab = 'local';

// 2. Instantiate UI Controllers
const replayController = new ReplayController(chess, () => {
  renderGame();
});

const boardRenderer = new BoardRenderer(
  document.getElementById('board'),
  (squareName) => handleSquareClick(squareName)
);

// 3. Main Render Function
export function renderGame() {
  const displayChess = replayController.getDisplayChess();
  boardRenderer.render(displayChess, isBoardFlipped, selectedSquare, legalMovesForSelected, lastMove);
  updateStatusDisplay(displayChess);
  updateCapturedPieces(displayChess);
  updateEvalBar(displayChess, isBoardFlipped);
  replayController.renderMoveLog(document.getElementById('moves-log'));
  replayController.updateBanner(
    document.getElementById('replay-banner'),
    document.getElementById('replay-banner-text')
  );
}

// 4. Square Click & Move Handlers
function handleSquareClick(square) {
  if (replayController.isReviewing()) {
    replayController.goToLast();
  }

  if (chess.game_over() || chess.turn() !== playerColor || isAiThinking) {
    return;
  }

  const piece = chess.get(square);

  if (piece && piece.color === playerColor) {
    selectedSquare = square;
    legalMovesForSelected = chess.moves({ square: square, verbose: true });
    renderGame();
    return;
  }

  if (selectedSquare) {
    const legalMove = legalMovesForSelected.find(m => m.to === square);

    if (!legalMove) {
      selectedSquare = null;
      legalMovesForSelected = [];
      renderGame();
      return;
    }

    if (legalMove.promotion) {
      pendingPromotion = { from: selectedSquare, to: square };
      boardRenderer.showPromotionModal(playerColor, (chosenPromo) => {
        executePlayerMove({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: chosenPromo });
        pendingPromotion = null;
      });
      return;
    }

    executePlayerMove({ from: selectedSquare, to: square });
  }
}

function executePlayerMove(moveObj) {
  const isCapture = chess.get(moveObj.to) !== null ||
    (chess.get(moveObj.from) && chess.get(moveObj.from).type === 'p' && moveObj.from[0] !== moveObj.to[0]);
  const res = chess.move(moveObj);

  if (res) {
    lastMove = { from: moveObj.from, to: moveObj.to };
    selectedSquare = null;
    legalMovesForSelected = [];
    replayController.reset();

    if (chess.in_checkmate()) {
      sound.playGameOver();
    } else if (chess.in_check()) {
      sound.playCheck();
    } else if (isCapture) {
      sound.playCapture();
    } else {
      sound.playMove();
    }

    renderGame();

    if (chess.game_over()) {
      handleGameOver();
      return;
    }

    triggerAiTurn();
  }
}

function triggerAiTurn() {
  if (chess.game_over() || chess.turn() === playerColor) return;

  isAiThinking = true;
  updateStatusDisplay();

  setTimeout(() => {
    makeAiMove();
  }, 40);
}

function makeAiMove() {
  if (chess.game_over() || chess.turn() === playerColor) {
    isAiThinking = false;
    return;
  }

  const clock = (playerColor === 'w') ? blackTime : whiteTime;
  const result = searchEngine.findBestMove(aiDifficulty, playerColor, clock);

  if (!result || !result.move) {
    isAiThinking = false;
    return;
  }

  const isCapture = result.move.captured !== undefined;
  chess.move(result.move);
  lastMove = { from: result.move.from, to: result.move.to };
  replayController.reset();

  if (chess.in_checkmate()) {
    sound.playGameOver();
  } else if (chess.in_check()) {
    sound.playCheck();
  } else if (isCapture) {
    sound.playCapture();
  } else {
    sound.playMove();
  }

  isAiThinking = false;
  renderGame();

  if (chess.game_over()) {
    handleGameOver();
  }
}

// 5. Game Over & Permadeath Handlers
let lastVictoryRecord = null;

function handleGameOver() {
  stopTimer();
  if (chess.in_checkmate()) {
    const winnerColor = chess.turn() === 'w' ? 'b' : 'w';
    if (winnerColor === playerColor) {
      lastVictoryRecord = saveVictory(chess, aiDifficulty);
      updateHofBadges();
      setTimeout(() => openVictoryModal(lastVictoryRecord), 600);
    } else {
      const { hadPreviousRecords } = purgeOnLoss(getPlayerNickname());
      updateHofBadges();
      if (hadPreviousRecords) {
        setTimeout(() => {
          document.getElementById('permadeath-modal').style.display = 'flex';
        }, 600);
      }
    }
  }
}

export function openVictoryModal(record) {
  const modal = document.getElementById('victory-modal');
  if (!modal) return;

  const nick = record ? record.nickname : getPlayerNickname();
  const streak = record ? record.streak : getWinStreak();
  const moves = record ? record.movesCount : chess.history().length;
  const diff = record ? record.difficulty : (aiDifficulty === 4 ? "Impossible" : "Regular");

  const elNick = document.getElementById('vic-stat-nick');
  const elStreak = document.getElementById('vic-stat-streak');
  const elMoves = document.getElementById('vic-stat-moves');
  const elDiff = document.getElementById('vic-stat-diff');
  const inputNick = document.getElementById('vic-nickname-input');
  const msgNick = document.getElementById('vic-name-saved-msg');

  if (elNick) elNick.innerText = nick;
  if (elStreak) elStreak.innerText = `${streak} Win${streak > 1 ? 's' : ''}`;
  if (elMoves) elMoves.innerText = `${moves} Moves`;
  if (elDiff) elDiff.innerText = diff;
  if (inputNick) {
    inputNick.value = nick;
    inputNick.onkeydown = (e) => {
      if (e.key === 'Enter') saveVictoryNicknameDirect();
    };
  }
  if (msgNick) msgNick.style.display = 'none';

  modal.style.display = 'flex';
}

export function saveVictoryNicknameDirect() {
  const inputEl = document.getElementById('vic-nickname-input');
  const msgEl = document.getElementById('vic-name-saved-msg');
  const statNickEl = document.getElementById('vic-stat-nick');
  if (!inputEl) return;

  const newName = inputEl.value.trim();
  if (newName === '') {
    alert("Please enter a valid nickname.");
    return;
  }

  const updatedRecord = updateVictoryNickname(lastVictoryRecord ? lastVictoryRecord.id : null, newName);
  if (updatedRecord) {
    lastVictoryRecord = updatedRecord;
  }

  if (statNickEl) statNickEl.innerText = newName;
  updateHofBadges();

  if (msgEl) {
    msgEl.style.display = 'block';
    setTimeout(() => {
      if (msgEl) msgEl.style.display = 'none';
    }, 2500);
  }
}

export function getVictoryShareText() {
  const streak = getWinStreak();
  const moves = chess.history().length;
  const url = "https://impossible-chess.pages.dev";
  return `I defeated the Grandmaster Engine on Impossible Chess in ${moves} moves. Win Streak: ${streak}. Can you beat it? Play here: ${url} (Built by Sharrif Fajar)`;
}

export function shareToWhatsApp() {
  const text = encodeURIComponent(getVictoryShareText());
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

export function shareToTwitter() {
  const text = encodeURIComponent(getVictoryShareText());
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}

export function shareVictoryDirect() {
  const shareText = getVictoryShareText();
  if (navigator.share) {
    navigator.share({
      title: 'Impossible Chess Victory',
      text: shareText,
      url: 'https://impossible-chess.pages.dev'
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(shareText).then(() => {
      alert("Victory link and score copied to clipboard! Share it with your friends.");
    });
  }
}

// 6. UI Status & Captured Display
function updateStatusDisplay(targetChess = null) {
  const active = targetChess || chess;
  const statusEl = document.getElementById('game-status');
  if (!statusEl) return;

  if (isAiThinking) {
    statusEl.innerHTML = `<span class="status-badge" style="color: var(--accent-gold);">AI is thinking...</span>`;
    return;
  }

  if (active.in_checkmate()) {
    const winner = active.turn() === 'w' ? "Black (AI)" : "White (You)";
    statusEl.innerHTML = `<span class="status-badge status-mate">CHECKMATE! ${winner} Wins!</span>`;
  } else if (active.in_draw()) {
    statusEl.innerHTML = `<span class="status-badge status-draw">Draw / Stalemate</span>`;
  } else if (active.in_check()) {
    const side = active.turn() === 'w' ? "White's Turn" : "Black's Turn";
    statusEl.innerHTML = `<span class="status-badge status-check">CHECK! ${side}</span>`;
  } else {
    const side = active.turn() === 'w' ? "White's Turn" : "Black's Turn";
    const isPlayer = active.turn() === playerColor ? " (You)" : " (AI)";
    statusEl.innerHTML = `<span class="status-badge status-active">${side}${isPlayer}</span>`;
  }

  updateTimerStyles();
}

function updateCapturedPieces(targetChess = null) {
  const active = targetChess || chess;
  const counts = { p: 0, n: 0, b: 0, r: 0, q: 0, P: 0, N: 0, B: 0, R: 0, Q: 0 };
  const board = active.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type !== 'k') {
        const key = p.color === 'w' ? p.type.toUpperCase() : p.type;
        counts[key]++;
      }
    }
  }

  const initial = { p: 8, n: 2, b: 2, r: 2, q: 1, P: 8, N: 2, B: 2, R: 2, Q: 1 };
  let capturedByWhite = '';
  let capturedByBlack = '';
  let whiteMaterialLoss = 0;
  let blackMaterialLoss = 0;

  ['q', 'r', 'b', 'n', 'p'].forEach(t => {
    const missing = initial[t] - (counts[t] || 0);
    if (missing > 0) {
      capturedByWhite += pieceSymbols[t].repeat(missing);
      blackMaterialLoss += missing * pieceValues[t];
    }
  });

  ['Q', 'R', 'B', 'N', 'P'].forEach(t => {
    const missing = initial[t] - (counts[t] || 0);
    if (missing > 0) {
      capturedByBlack += pieceSymbols[t].repeat(missing);
      whiteMaterialLoss += missing * pieceValues[t.toLowerCase()];
    }
  });

  const diff = blackMaterialLoss - whiteMaterialLoss;
  const isTopWhite = isBoardFlipped ? (playerColor === 'w') : (playerColor === 'b');

  const topCapturedBox = document.getElementById('top-captured');
  const bottomCapturedBox = document.getElementById('bottom-captured');
  const topAdvantage = document.getElementById('top-advantage');
  const bottomAdvantage = document.getElementById('bottom-advantage');

  if (isTopWhite) {
    if (topCapturedBox) topCapturedBox.innerText = capturedByWhite;
    if (bottomCapturedBox) bottomCapturedBox.innerText = capturedByBlack;
    if (topAdvantage) {
      topAdvantage.style.display = diff > 0 ? 'inline-block' : 'none';
      topAdvantage.innerText = `+${Math.floor(diff / 100)}`;
    }
    if (bottomAdvantage) {
      bottomAdvantage.style.display = diff < 0 ? 'inline-block' : 'none';
      bottomAdvantage.innerText = `+${Math.floor(-diff / 100)}`;
    }
  } else {
    if (topCapturedBox) topCapturedBox.innerText = capturedByBlack;
    if (bottomCapturedBox) bottomCapturedBox.innerText = capturedByWhite;
    if (topAdvantage) {
      topAdvantage.style.display = diff < 0 ? 'inline-block' : 'none';
      topAdvantage.innerText = `+${Math.floor(-diff / 100)}`;
    }
    if (bottomAdvantage) {
      bottomAdvantage.style.display = diff > 0 ? 'inline-block' : 'none';
      bottomAdvantage.innerText = `+${Math.floor(diff / 100)}`;
    }
  }
}

// 7. Timers
function formatTime(sec) {
  if (sec <= 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
  const topTimerEl = document.getElementById('top-timer');
  const bottomTimerEl = document.getElementById('bottom-timer');
  if (!topTimerEl || !bottomTimerEl) return;

  if (timerBaseSeconds === 0) {
    topTimerEl.innerText = '--:--';
    bottomTimerEl.innerText = '--:--';
    return;
  }

  const isTopWhite = isBoardFlipped ? (playerColor === 'w') : (playerColor === 'b');
  topTimerEl.innerText = formatTime(isTopWhite ? whiteTime : blackTime);
  bottomTimerEl.innerText = formatTime(isTopWhite ? blackTime : whiteTime);
}

function updateTimerStyles() {
  const topTimerEl = document.getElementById('top-timer');
  const bottomTimerEl = document.getElementById('bottom-timer');
  if (!topTimerEl || !bottomTimerEl) return;

  topTimerEl.classList.remove('timer-active');
  bottomTimerEl.classList.remove('timer-active');

  if (timerBaseSeconds === 0 || chess.game_over()) return;

  const currentTurn = chess.turn();
  const isTopTurn = isBoardFlipped
    ? (currentTurn === 'w' ? playerColor === 'w' : playerColor === 'b')
    : (currentTurn === 'w' ? playerColor === 'b' : playerColor === 'w');

  if (isTopTurn) topTimerEl.classList.add('timer-active');
  else bottomTimerEl.classList.add('timer-active');
}

function startTimer() {
  stopTimer();
  if (timerBaseSeconds === 0) return;

  timerInterval = setInterval(() => {
    if (chess.game_over()) {
      stopTimer();
      return;
    }

    if (chess.turn() === 'w') {
      whiteTime--;
      if (whiteTime <= 0) {
        whiteTime = 0;
        stopTimer();
        if (playerColor === 'w') {
          purgeOnLoss(getPlayerNickname());
          updateHofBadges();
          document.getElementById('permadeath-modal').style.display = 'flex';
        } else {
          saveVictory(chess, aiDifficulty);
          updateHofBadges();
          openHallOfFame();
        }
        alert("White's time expired!");
      }
    } else {
      blackTime--;
      if (blackTime <= 0) {
        blackTime = 0;
        stopTimer();
        if (playerColor === 'b') {
          purgeOnLoss(getPlayerNickname());
          updateHofBadges();
          document.getElementById('permadeath-modal').style.display = 'flex';
        } else {
          saveVictory(chess, aiDifficulty);
          updateHofBadges();
          openHallOfFame();
        }
        alert("Black's time expired!");
      }
    }
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// 8. Player Labels & Settings
function updatePlayerLabels() {
  const topName = document.getElementById('top-player-name');
  const bottomName = document.getElementById('bottom-player-name');
  const topBadge = document.getElementById('top-player-badge');
  const bottomBadge = document.getElementById('bottom-player-badge');
  const nick = getPlayerNickname();
  const streak = getWinStreak();

  if (isBoardFlipped) {
    if (playerColor === 'w') {
      if (topName) topName.innerText = `You (White) Streak: ${streak}`;
      if (bottomName) bottomName.innerText = 'Grandmaster AI (Black)';
      if (topBadge) topBadge.className = 'player-badge badge-white';
      if (bottomBadge) bottomBadge.className = 'player-badge badge-black';
    } else {
      if (topName) topName.innerText = `You (Black) Streak: ${streak}`;
      if (bottomName) bottomName.innerText = 'Grandmaster AI (White)';
      if (topBadge) topBadge.className = 'player-badge badge-black';
      if (bottomBadge) bottomBadge.className = 'player-badge badge-white';
    }
  } else {
    if (playerColor === 'w') {
      if (topName) topName.innerText = 'Grandmaster AI (Black)';
      if (bottomName) bottomName.innerText = `You (White) Streak: ${streak}`;
      if (topBadge) topBadge.className = 'player-badge badge-black';
      if (bottomBadge) bottomBadge.className = 'player-badge badge-white';
    } else {
      if (topName) topName.innerText = 'Grandmaster AI (White)';
      if (bottomName) bottomName.innerText = `You (Black) Streak: ${streak}`;
      if (topBadge) topBadge.className = 'player-badge badge-white';
      if (bottomBadge) bottomBadge.className = 'player-badge badge-black';
    }
  }
}

// 9. Game Control Actions
export function newGame() {
  chess.reset();
  selectedSquare = null;
  legalMovesForSelected = [];
  lastMove = null;
  isAiThinking = false;
  replayController.reset();

  whiteTime = timerBaseSeconds;
  blackTime = timerBaseSeconds;
  updateTimerDisplay();
  stopTimer();

  updatePlayerLabels();
  renderGame();

  if (timerBaseSeconds > 0) {
    startTimer();
  }

  if (playerColor === 'b') {
    triggerAiTurn();
  }
}

export function undoMove() {
  if (isAiThinking || chess.history().length === 0) return;
  replayController.reset();

  if (chess.turn() === playerColor) {
    chess.undo();
    if (chess.history().length > 0) chess.undo();
  } else {
    chess.undo();
  }

  selectedSquare = null;
  legalMovesForSelected = [];
  const history = chess.history({ verbose: true });
  if (history.length > 0) {
    const last = history[history.length - 1];
    lastMove = { from: last.from, to: last.to };
  } else {
    lastMove = null;
  }

  renderGame();
}

export function flipBoard() {
  isBoardFlipped = !isBoardFlipped;
  updatePlayerLabels();
  renderGame();
}

export function copyPGN() {
  const pgn = chess.pgn();
  navigator.clipboard.writeText(pgn).then(() => {
    alert("Game PGN copied to clipboard!");
  });
}

export function changeDifficulty() {
  const el = document.getElementById('select-difficulty') || document.getElementById('ai-difficulty');
  if (!el) return;
  aiDifficulty = parseInt(el.value, 10);
  const badge = document.getElementById('mode-badge');
  if (badge) {
    badge.innerText = aiDifficulty === 4 ? "Impossible Mode" : "Regular Mode";
  }
}

export function changePlayerSide() {
  const el = document.getElementById('select-side') || document.getElementById('player-side');
  if (!el) return;
  playerColor = el.value;
  isBoardFlipped = (playerColor === 'b');
  newGame();
}

export function changeTimerSetting() {
  const el = document.getElementById('select-timer') || document.getElementById('game-timer-select');
  if (!el) return;
  const val = parseInt(el.value, 10);
  timerBaseSeconds = val;
  whiteTime = val;
  blackTime = val;
  updateTimerDisplay();

  if (val > 0 && !chess.game_over() && chess.history().length > 0) {
    startTimer();
  } else {
    stopTimer();
  }
}

export function toggleSound() {
  sound.enabled = !sound.enabled;
  const btn = document.getElementById('sound-toggle');
  if (btn) {
    btn.innerText = sound.enabled ? "Audio: On" : "Audio: Off";
  }
}

export function loadScenario(type) {
  chess.reset();
  replayController.reset();
  stopTimer();

  if (type === 'mate1') {
    chess.load('r1bqkb1r/pppp1ppp/2n5/4p2Q/2B1n3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4');
    alert("Tactical Puzzle: White to move and Checkmate in 1 ply!");
  } else if (type === 'fork') {
    chess.load('r1bqkb1r/pppp1ppp/2n5/4p3/4n3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 4');
    alert("Tactical Puzzle: Knight Fork scenario!");
  } else if (type === 'endgame') {
    chess.load('8/8/8/4k3/8/8/4K3/4R3 w - - 0 1');
    alert("Endgame: Rook & King confinement practice!");
  }

  playerColor = 'w';
  document.getElementById('player-side').value = 'w';
  isBoardFlipped = false;
  updatePlayerLabels();
  renderGame();
}

// 10. Hall of Fame Dialog
export function openHallOfFame() {
  const modal = document.getElementById('hof-modal');
  switchHofTab(currentHofTab);
  modal.style.display = 'flex';
}

export function closeHallOfFame() {
  document.getElementById('hof-modal').style.display = 'none';
}

export function editNickname() {
  const current = getPlayerNickname();
  const newName = prompt("Enter your nickname for the Leaderboard / Hall of Fame:", current);
  if (newName && newName.trim() !== '') {
    setPlayerNickname(newName);
    updateHofBadges();
    updatePlayerLabels();
  }
}

export function updateHofBadges() {
  const nick = getPlayerNickname();
  const streak = getWinStreak();
  const victories = getStoredVictories();

  const btnNick = document.getElementById('btn-nickname');
  if (btnNick) btnNick.innerText = nick;

  const countBadge = document.getElementById('hof-count-badge');
  if (countBadge) countBadge.innerText = victories.length;

  updatePlayerLabels();
}

export async function switchHofTab(tab) {
  currentHofTab = tab;
  const btnLocal = document.getElementById('tab-btn-local');
  const btnGlobal = document.getElementById('tab-btn-global');
  if (btnLocal && btnGlobal) {
    btnLocal.className = tab === 'local' ? 'hof-tab-btn active' : 'hof-tab-btn';
    btnGlobal.className = tab === 'global' ? 'hof-tab-btn active' : 'hof-tab-btn';
  }

  if (tab === 'local') {
    renderLocalHof();
  } else {
    await loadGlobalLeaderboard();
  }
}

function renderLocalHof() {
  const listEl = document.getElementById('hof-list');
  const victories = getStoredVictories();

  if (victories.length === 0) {
    listEl.innerHTML = `<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 16px 0;">
      No local victory records saved yet.<br>Defeat Impossible Mode AI to record your name.
    </div>`;
  } else {
    let html = '';
    victories.forEach((v, idx) => {
      const pioneerBadge = v.isPioneer !== false
        ? `<span style="font-size:0.65rem; background:#1e3a29; color:#4ade80; border:1px solid #2e8253; padding:1px 5px; border-radius:3px; margin-left:6px; font-weight:700;">Pioneer</span>`
        : `<span style="font-size:0.65rem; background:#292415; color:#fcd34d; border:1px solid #735118; padding:1px 5px; border-radius:3px; margin-left:6px;">Replay</span>`;

      html += `
        <div style="display:flex; align-items:center; justify-content:space-between; padding: 8px 10px; border-bottom: 1px solid #1e2227; font-size: 0.8rem;">
          <div>
            <span style="font-weight:700; color:#fcd34d;">#${idx + 1} ${v.nickname}</span>
            ${pioneerBadge}
            <span style="font-size:0.75rem; color:var(--text-muted); margin-left:4px;">(${v.difficulty || 'Impossible Mode'})</span>
            <div style="font-size:0.75rem; color:var(--text-muted);">${v.date} • ${v.movesCount} Moves • Streak: ${v.streak || 1}</div>
          </div>
          <button class="pgn-copy-btn" data-pgn="${(v.pgn || '').replace(/"/g, '&quot;')}" style="padding: 4px 8px; font-size: 0.75rem;">
            PGN
          </button>
        </div>
      `;
    });
    listEl.innerHTML = html;

    listEl.querySelectorAll('.pgn-copy-btn').forEach(btn => {
      btn.onclick = () => {
        const pgn = btn.getAttribute('data-pgn');
        navigator.clipboard.writeText(pgn).then(() => alert('Victory PGN Copied!'));
      };
    });
  }
}

async function loadGlobalLeaderboard() {
  const listEl = document.getElementById('hof-list');
  listEl.innerHTML = `<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 16px 0;">
    Loading Global Leaderboard...
  </div>`;

  try {
    const res = await fetch('/api/victory');
    const data = await res.json();
    if (data.success && data.victors && data.victors.length > 0) {
      let html = '';
      data.victors.forEach((v, idx) => {
        const pioneerBadge = v.isPioneer !== false
          ? `<span style="font-size:0.65rem; background:#1e3a29; color:#4ade80; border:1px solid #2e8253; padding:1px 5px; border-radius:3px; margin-left:6px; font-weight:700;">Pioneer</span>`
          : `<span style="font-size:0.65rem; background:#292415; color:#fcd34d; border:1px solid #735118; padding:1px 5px; border-radius:3px; margin-left:6px;">Replay</span>`;

        html += `
          <div style="display:flex; align-items:center; justify-content:space-between; padding: 8px 10px; border-bottom: 1px solid #1e2227; font-size: 0.8rem;">
            <div>
              <span style="font-weight:700; color:#fcd34d;">#${idx + 1} ${v.nickname}</span>
              ${pioneerBadge}
              <span style="font-size:0.75rem; color:var(--text-muted); margin-left:4px;">(${v.difficulty || 'Impossible Mode'})</span>
              <div style="font-size:0.75rem; color:var(--text-muted);">${v.date} • ${v.moves_count || v.movesCount || 0} Moves • Streak: ${v.streak || 1}</div>
            </div>
            <button class="pgn-copy-btn" data-pgn="${(v.pgn || '').replace(/"/g, '&quot;')}" style="padding: 4px 8px; font-size: 0.75rem;">
              PGN
            </button>
          </div>
        `;
      });
      listEl.innerHTML = html;

      listEl.querySelectorAll('.pgn-copy-btn').forEach(btn => {
        btn.onclick = () => {
          const pgn = btn.getAttribute('data-pgn');
          navigator.clipboard.writeText(pgn).then(() => alert('Victory PGN Copied!'));
        };
      });
    } else {
      listEl.innerHTML = `<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 16px 0;">
        No global records in Cloudflare D1/KV yet.<br>Be the first to defeat Impossible Mode!
      </div>`;
    }
  } catch (err) {
    listEl.innerHTML = `<div style="color: #f87171; font-size: 0.8rem; text-align: center; padding: 16px 0;">
      Local Mode: Deploy to Cloudflare Pages with D1 to see live global entries.
    </div>`;
  }
}

// 11. Attach Global Window Handlers & Init
window.newGame = newGame;
window.undoMove = undoMove;
window.flipBoard = flipBoard;
window.copyPGN = copyPGN;
window.changeDifficulty = changeDifficulty;
window.changePlayerSide = changePlayerSide;
window.changeTimerSetting = changeTimerSetting;
window.toggleSound = toggleSound;
window.loadScenario = loadScenario;
window.openHallOfFame = openHallOfFame;
window.closeHallOfFame = closeHallOfFame;
window.openVictoryModal = openVictoryModal;
window.saveVictoryNicknameDirect = saveVictoryNicknameDirect;
window.openGameAnalysis = () => gameAnalysisView.open(chess, playerColor);
window.closeGameAnalysis = () => gameAnalysisView.close();
window.shareToWhatsApp = shareToWhatsApp;
window.shareToTwitter = shareToTwitter;
window.shareVictoryDirect = shareVictoryDirect;
window.editNickname = editNickname;
window.switchHofTab = switchHofTab;
window.goToFirstMove = () => replayController.goToFirst();
window.goToPrevMove = () => replayController.goToPrev();
window.goToNextMove = () => replayController.goToNext();
window.goToLastMove = () => replayController.goToLast();
window.downloadPGN = () => replayController.downloadPGN();

window.addEventListener('DOMContentLoaded', () => {
  newGame();
  changeDifficulty();
  updateHofBadges();
  globalTicker.init();

  // Register PWA Service Worker for Offline Gameplay
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});

// Keyboard Navigation
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
    return;
  }
  if (e.key === 'ArrowLeft') {
    replayController.goToPrev();
  } else if (e.key === 'ArrowRight') {
    replayController.goToNext();
  } else if (e.key === 'Home') {
    replayController.goToFirst();
  } else if (e.key === 'End') {
    replayController.goToLast();
  }
});
