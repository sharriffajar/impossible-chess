/**
 * Impossible Chess - Universal Standalone Bundle
 * Allows Impossible Chess to run instantly in any browser via both http:// and double-clicked file:/// protocol!
 */

(function() {
  'use strict';

  // 1. Config & PST Tables
  const pieceSymbols = {
    p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚',
    P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔'
  };

  const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

  const pstPawn = [
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
  ];

  const pstKnight = [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
  ];

  const pstBishop = [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20
  ];

  const pstRook = [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
  ];

  const pstQueen = [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
  ];

  const pstKingMid = [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20
  ];

  const pstKingEnd = [
    -50,-40,-30,-20,-20,-30,-40,-50,
    -30,-20,-10,  0,  0,-10,-20,-30,
    -30,-10, 20, 30, 30, 20,-10,-30,
    -30,-10, 30, 40, 40, 30,-10,-30,
    -30,-10, 30, 40, 40, 30,-10,-30,
    -30,-10, 20, 30, 30, 20,-10,-30,
    -30,-30,  0,  0,  0,  0,-30,-30,
    -50,-30,-30,-30,-30,-30,-30,-50
  ];

  const pstTables = {
    p: pstPawn, n: pstKnight, b: pstBishop, r: pstRook, q: pstQueen, k: pstKingMid
  };

  // 2. Web Audio Sound Engine
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }
    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
    }
    playTone(freq, type, duration, gainVal = 0.1) {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    }
    move() { this.playTone(320, 'triangle', 0.08, 0.12); }
    capture() { this.playTone(480, 'square', 0.12, 0.15); }
    check() {
      this.playTone(600, 'sine', 0.1, 0.15);
      setTimeout(() => this.playTone(750, 'sine', 0.15, 0.15), 80);
    }
    gameover() {
      this.playTone(400, 'sawtooth', 0.2, 0.15);
      setTimeout(() => this.playTone(300, 'sawtooth', 0.25, 0.15), 180);
      setTimeout(() => this.playTone(200, 'sawtooth', 0.4, 0.18), 380);
    }
  }
  const sound = new SoundEngine();

  // 3. Zobrist & Transposition Table
  class Zobrist {
    constructor() {
      this.table = [];
      this.blackMove = 0;
      this.init();
    }
    rand32() { return (Math.random() * 0xFFFFFFFF) >>> 0; }
    init() {
      for (let sq = 0; sq < 64; sq++) {
        this.table[sq] = {};
        const pieces = ['p', 'n', 'b', 'r', 'q', 'k', 'P', 'N', 'B', 'R', 'Q', 'K'];
        pieces.forEach(p => { this.table[sq][p] = this.rand32(); });
      }
      this.blackMove = this.rand32();
    }
    computeHash(chessInstance) {
      let h = 0;
      const b = chessInstance.board();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = b[r][c];
          if (p) {
            const sq = r * 8 + c;
            const sym = p.color === 'w' ? p.type.toUpperCase() : p.type.toLowerCase();
            h = (h ^ this.table[sq][sym]) >>> 0;
          }
        }
      }
      if (chessInstance.turn() === 'b') h = (h ^ this.blackMove) >>> 0;
      return h;
    }
  }
  const zobrist = new Zobrist();

  class TranspositionTable {
    constructor(maxEntries = 50000) {
      this.maxEntries = maxEntries;
      this.map = new Map();
    }
    get(hash) { return this.map.get(hash); }
    set(hash, data) {
      if (this.map.size >= this.maxEntries) {
        const firstKey = this.map.keys().next().value;
        this.map.delete(firstKey);
      }
      this.map.set(hash, data);
    }
    clear() { this.map.clear(); }
  }
  const transpositionTable = new TranspositionTable(40000);

  // 4. Evaluation Engine
  function evaluatePawnStructure(chessInstance) {
    let bonus = 0;
    const board = chessInstance.board();
    const whitePawnsByFile = [0, 0, 0, 0, 0, 0, 0, 0];
    const blackPawnsByFile = [0, 0, 0, 0, 0, 0, 0, 0];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'p') {
          if (p.color === 'w') whitePawnsByFile[c]++;
          else blackPawnsByFile[c]++;
        }
      }
    }
    for (let f = 0; f < 8; f++) {
      if (whitePawnsByFile[f] > 1) bonus -= (whitePawnsByFile[f] - 1) * 20;
      if (blackPawnsByFile[f] > 1) bonus += (blackPawnsByFile[f] - 1) * 20;
      const wIso = (f === 0 || whitePawnsByFile[f - 1] === 0) && (f === 7 || whitePawnsByFile[f + 1] === 0);
      if (whitePawnsByFile[f] > 0 && wIso) bonus -= 15;
      const bIso = (f === 0 || blackPawnsByFile[f - 1] === 0) && (f === 7 || blackPawnsByFile[f + 1] === 0);
      if (blackPawnsByFile[f] > 0 && bIso) bonus += 15;
    }
    return bonus;
  }

  function evaluateKingSafety(chessInstance) {
    let safety = 0;
    const board = chessInstance.board();
    let whiteKing = null;
    let blackKing = null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k') {
          if (p.color === 'w') whiteKing = { r, c };
          else blackKing = { r, c };
        }
      }
    }
    if (whiteKing && whiteKing.r >= 6) {
      let shield = 0;
      for (let dc = -1; dc <= 1; dc++) {
        const col = whiteKing.c + dc;
        if (col >= 0 && col < 8) {
          const front1 = board[whiteKing.r - 1]?.[col];
          const front2 = board[whiteKing.r - 2]?.[col];
          if (front1 && front1.type === 'p' && front1.color === 'w') shield += 15;
          else if (front2 && front2.type === 'p' && front2.color === 'w') shield += 8;
        }
      }
      safety += shield;
    }
    if (blackKing && blackKing.r <= 1) {
      let shield = 0;
      for (let dc = -1; dc <= 1; dc++) {
        const col = blackKing.c + dc;
        if (col >= 0 && col < 8) {
          const front1 = board[blackKing.r + 1]?.[col];
          const front2 = board[blackKing.r + 2]?.[col];
          if (front1 && front1.type === 'p' && front1.color === 'b') shield += 15;
          else if (front2 && front2.type === 'p' && front2.color === 'b') shield += 8;
        }
      }
      safety -= shield;
    }
    return safety;
  }

  function evaluateBoard(chessInstance) {
    if (chessInstance.in_checkmate()) {
      return chessInstance.turn() === 'w' ? -999999 : 999999;
    }
    if (chessInstance.in_draw() || chessInstance.in_stalemate() || chessInstance.in_threefold_repetition()) {
      return 0;
    }

    let materialScore = 0;
    let positionalScore = 0;
    const board = chessInstance.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p) continue;
        const val = pieceValues[p.type] || 0;
        const pst = pstTables[p.type];
        let pScore = 0;
        if (pst) {
          const idx = p.color === 'w' ? (r * 8 + c) : ((7 - r) * 8 + c);
          pScore = pst[idx] || 0;
        }
        if (p.color === 'w') {
          materialScore += val;
          positionalScore += pScore;
        } else {
          materialScore -= val;
          positionalScore -= pScore;
        }
      }
    }

    const pawnBonus = evaluatePawnStructure(chessInstance);
    const kingSafety = evaluateKingSafety(chessInstance);
    return materialScore + positionalScore + pawnBonus + kingSafety;
  }

  // 5. Grandmaster Opening Book
  const openingBook = {
    'start': ['e4', 'd4', 'Nf3', 'c4'],
    'e4': ['e5', 'c5', 'e6', 'c6'],
    'd4': ['d5', 'Nf6', 'e6'],
    'e4 e5': ['Nf3', 'Bc4', 'Nc3'],
    'e4 e5 Nf3': ['Nc6', 'Nf6', 'd6'],
    'e4 e5 Nf3 Nc6': ['Bb5', 'Bc4', 'd4', 'Nc3'],
    'e4 c5': ['Nf3', 'Nc3', 'c3', 'd4'],
    'e4 c5 Nf3': ['d6', 'Nc6', 'e6'],
    'e4 c5 Nf3 d6': ['d4', 'Bb5+'],
    'e4 c5 Nf3 d6 d4': ['cxd4'],
    'e4 c5 Nf3 d6 d4 cxd4': ['Nxd4'],
    'd4 d5': ['c4', 'Nf3', 'Bf4'],
    'd4 d5 c4': ['e6', 'c6', 'dxc4'],
    'd4 Nf6': ['c4', 'Nf3', 'Bg5'],
    'd4 Nf6 c4': ['e6', 'g6', 'c5'],
    'd4 Nf6 c4 g6': ['Nc3', 'Nf3'],
    'e4 e6': ['d4', 'd3', 'Nf3'],
    'e4 e6 d4': ['d5'],
    'e4 e6 d4 d5': ['Nc3', 'Nd2', 'e5', 'exd5'],
    'e4 c6': ['d4', 'd3', 'Nf3'],
    'e4 c6 d4': ['d5']
  };

  function getBookMove(chessInstance) {
    const history = chessInstance.history();
    const key = history.length === 0 ? 'start' : history.join(' ');
    const candidates = openingBook[key];
    if (candidates && candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    return null;
  }

  // 6. Adaptive Defense & Pioneer Detection
  class AdaptiveLearning {
    constructor() {
      this.defeatsKey = 'chess_learned_defeats';
    }
    getDefeats() {
      try {
        const raw = localStorage.getItem(this.defeatsKey);
        return raw ? JSON.parse(raw) : [];
      } catch (e) { return []; }
    }
    recordDefeat(chessInstance) {
      const history = chessInstance.history();
      if (history.length < 2) return;
      const defeats = this.getDefeats();
      const currentSequence = history.join(' ');
      if (!defeats.includes(currentSequence)) {
        defeats.push(currentSequence);
        for (let i = 2; i <= history.length; i += 2) {
          const sub = history.slice(0, i).join(' ');
          if (!defeats.includes(sub)) defeats.push(sub);
        }
        try { localStorage.setItem(this.defeatsKey, JSON.stringify(defeats)); } catch (e) {}
      }
    }
    isKnownLosingMove(currentHistoryArray, candidateSan) {
      const defeats = this.getDefeats();
      if (defeats.length === 0) return false;
      const testSequence = [...currentHistoryArray, candidateSan].join(' ');
      return defeats.some(seq => seq === testSequence || seq.startsWith(testSequence + ' '));
    }
    isDuplicateGameLine(chessInstance, storedVictoriesList) {
      const currentSeq = chessInstance.history().join(' ');
      if (!currentSeq || !storedVictoriesList || storedVictoriesList.length === 0) {
        return { isDuplicate: false, originalAuthor: null };
      }
      const match = storedVictoriesList.find(v => v.historySequence === currentSeq);
      if (match) {
        return { isDuplicate: true, originalAuthor: match.nickname || 'Unknown Victor', date: match.date };
      }
      return { isDuplicate: false, originalAuthor: null };
    }
  }
  const adaptiveLearning = new AdaptiveLearning();

  // 7. Search Engine
  class ChessSearchEngine {
    constructor(chessInstance) {
      this.chess = chessInstance;
      this.nodesEvaluated = 0;
    }
    orderMoves(moves, currentHistory = []) {
      const mvvLva = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
      return moves.sort((a, b) => {
        const aLosing = adaptiveLearning.isKnownLosingMove(currentHistory, a.san);
        const bLosing = adaptiveLearning.isKnownLosingMove(currentHistory, b.san);
        if (aLosing && !bLosing) return 1;
        if (!aLosing && bLosing) return -1;
        let scoreA = 0;
        let scoreB = 0;
        if (a.captured) {
          const victimVal = mvvLva[a.captured] || 1;
          const attackerVal = mvvLva[a.piece] || 1;
          scoreA += victimVal * 10 - attackerVal + 1000;
        }
        if (b.captured) {
          const victimVal = mvvLva[b.captured] || 1;
          const attackerVal = mvvLva[b.piece] || 1;
          scoreB += victimVal * 10 - attackerVal + 1000;
        }
        if (a.promotion) scoreA += 900;
        if (b.promotion) scoreB += 900;
        return scoreB - scoreA;
      });
    }
    quiescence(alpha, beta, side) {
      this.nodesEvaluated++;
      const standPat = (side === 'w' ? 1 : -1) * evaluateBoard(this.chess);
      if (standPat >= beta) return beta;
      if (alpha < standPat) alpha = standPat;
      const captures = this.chess.moves({ verbose: true }).filter(m => m.captured || m.promotion);
      const orderedCaptures = this.orderMoves(captures);
      for (const move of orderedCaptures) {
        this.chess.move(move);
        const score = -this.quiescence(-beta, -alpha, side === 'w' ? 'b' : 'w');
        this.chess.undo();
        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
      }
      return alpha;
    }
    minimax(depth, alpha, beta, isMaximizing, currentHistory = []) {
      this.nodesEvaluated++;
      const hash = zobrist.computeHash(this.chess);
      const ttEntry = transpositionTable.get(hash);
      if (ttEntry && ttEntry.depth >= depth) {
        if (ttEntry.flag === 'exact') return ttEntry.score;
        if (ttEntry.flag === 'lower' && ttEntry.score > alpha) alpha = ttEntry.score;
        if (ttEntry.flag === 'upper' && ttEntry.score < beta) beta = ttEntry.score;
        if (alpha >= beta) return ttEntry.score;
      }
      if (depth === 0) {
        const qScore = this.quiescence(alpha, beta, this.chess.turn());
        return isMaximizing ? qScore : -qScore;
      }
      const rawMoves = this.chess.moves({ verbose: true });
      if (rawMoves.length === 0) {
        if (this.chess.in_check()) return isMaximizing ? (-999999 + (4 - depth)) : (999999 - (4 - depth));
        return 0;
      }
      const moves = this.orderMoves(rawMoves, currentHistory);
      let bestMove = null;
      let originalAlpha = alpha;
      if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
          this.chess.move(move);
          const evaluation = this.minimax(depth - 1, alpha, beta, false, [...currentHistory, move.san]);
          this.chess.undo();
          if (evaluation > maxEval) { maxEval = evaluation; bestMove = move; }
          alpha = Math.max(alpha, evaluation);
          if (beta <= alpha) break;
        }
        let flag = 'exact';
        if (maxEval <= originalAlpha) flag = 'upper';
        else if (maxEval >= beta) flag = 'lower';
        transpositionTable.set(hash, { depth, score: maxEval, flag, bestMove });
        return maxEval;
      } else {
        let minEval = Infinity;
        for (const move of moves) {
          this.chess.move(move);
          const evaluation = this.minimax(depth - 1, alpha, beta, true, [...currentHistory, move.san]);
          this.chess.undo();
          if (evaluation < minEval) { minEval = evaluation; bestMove = move; }
          beta = Math.min(beta, evaluation);
          if (beta <= alpha) break;
        }
        let flag = 'exact';
        if (minEval <= originalAlpha) flag = 'upper';
        else if (minEval >= beta) flag = 'lower';
        transpositionTable.set(hash, { depth, score: minEval, flag, bestMove });
        return minEval;
      }
    }
    findBestMove(difficulty = 4, side = 'b') {
      this.nodesEvaluated = 0;
      const history = this.chess.history();
      if (history.length < 12) {
        const bookSan = getBookMove(this.chess);
        if (bookSan) {
          const legalMoves = this.chess.moves({ verbose: true });
          const found = legalMoves.find(m => m.san === bookSan);
          if (found) return { move: found, score: 0, nodes: 1, isBook: true };
        }
      }
      const rawMoves = this.chess.moves({ verbose: true });
      if (rawMoves.length === 0) return null;
      if (rawMoves.length === 1) return { move: rawMoves[0], score: 0, nodes: 1 };
      const currentHistory = this.chess.history();
      const moves = this.orderMoves(rawMoves, currentHistory);
      const isMaximizing = (side === 'w');
      let bestMove = moves[0];
      let bestScore = isMaximizing ? -Infinity : Infinity;
      const targetDepth = difficulty >= 4 ? 4 : (difficulty === 3 ? 3 : (difficulty === 2 ? 2 : 1));
      let currentBestMove = moves[0];
      for (let d = 1; d <= targetDepth; d++) {
        let alpha = -Infinity;
        let beta = Infinity;
        let iterationBestScore = isMaximizing ? -Infinity : Infinity;
        let iterationBestMove = currentBestMove;
        for (const move of moves) {
          this.chess.move(move);
          const score = this.minimax(d - 1, alpha, beta, !isMaximizing, [...currentHistory, move.san]);
          this.chess.undo();
          if (isMaximizing) {
            if (score > iterationBestScore) { iterationBestScore = score; iterationBestMove = move; }
            alpha = Math.max(alpha, score);
          } else {
            if (score < iterationBestScore) { iterationBestScore = score; iterationBestMove = move; }
            beta = Math.min(beta, score);
          }
          if (beta <= alpha) break;
        }
        currentBestMove = iterationBestMove;
        bestMove = iterationBestMove;
        bestScore = iterationBestScore;
        if (Math.abs(bestScore) > 900000) break;
      }
      return { move: bestMove, score: bestScore, nodes: this.nodesEvaluated, isBook: false };
    }
  }

  // 8. Permadeath & Storage
  function getPlayerNickname() {
    let nick = localStorage.getItem('chess_nickname');
    if (!nick || nick.trim() === '') {
      nick = 'Player_' + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem('chess_nickname', nick);
    }
    return nick;
  }
  function setPlayerNickname(newNickname) {
    if (!newNickname || newNickname.trim() === '') return getPlayerNickname();
    const clean = newNickname.trim().substring(0, 20);
    localStorage.setItem('chess_nickname', clean);
    return clean;
  }
  function getStoredVictories() {
    try {
      const v = localStorage.getItem('chess_victories');
      return v ? JSON.parse(v) : [];
    } catch (e) { return []; }
  }
  function getWinStreak() {
    return parseInt(localStorage.getItem('chess_streak') || '0', 10);
  }
  function saveVictory(chessInstance, aiDifficulty, customNickname = null) {
    if (customNickname && customNickname.trim() !== '') setPlayerNickname(customNickname.trim());
    const nickname = customNickname && customNickname.trim() !== '' ? customNickname.trim() : getPlayerNickname();
    const streak = getWinStreak() + 1;
    localStorage.setItem('chess_streak', streak.toString());
    const victories = getStoredVictories();
    const duplicateCheck = adaptiveLearning.isDuplicateGameLine(chessInstance, victories);
    const currentSeq = chessInstance.history().join(' ');
    const newRecord = {
      id: 'vic_' + Date.now(),
      nickname: nickname,
      movesCount: chessInstance.history().length,
      historySequence: currentSeq,
      pgn: chessInstance.pgn(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      streak: streak,
      difficulty: aiDifficulty === 4 ? "Impossible Mode" : "Regular Mode",
      isPioneer: !duplicateCheck.isDuplicate,
      noveltyNote: duplicateCheck.isDuplicate ? `Replay Line (First solved by ${duplicateCheck.originalAuthor})` : 'Pioneer Novelty (New Winning Line)'
    };
    adaptiveLearning.recordDefeat(chessInstance);
    victories.unshift(newRecord);
    localStorage.setItem('chess_victories', JSON.stringify(victories));
    try {
      fetch('/api/victory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      }).catch(() => {});
    } catch (e) {}
    return newRecord;
  }
  function updateVictoryNickname(recordId, newNickname) {
    if (!newNickname || newNickname.trim() === '') return null;
    const cleanName = setPlayerNickname(newNickname.trim());
    const victories = getStoredVictories();
    const target = victories.find(v => v.id === recordId) || victories[0];
    if (target) {
      target.nickname = cleanName;
      localStorage.setItem('chess_victories', JSON.stringify(victories));
      return target;
    }
    return null;
  }
  function purgeOnLoss(nickname) {
    localStorage.setItem('chess_streak', '0');
    localStorage.removeItem('chess_victories');
    try {
      fetch('/api/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname })
      }).catch(() => {});
    } catch (e) {}
  }

  // 9. Analysis Engine
  function calculateAccuracyFromAcpl(acpl) {
    const acc = 103.1668 * Math.exp(-0.00435 * acpl) - 3.1668;
    return Math.max(5, Math.min(99.5, parseFloat(acc.toFixed(1))));
  }
  function classifyMoveQuality(cpLoss) {
    if (cpLoss <= 12) return { tag: 'best', label: 'Best Move', glyph: '!' };
    if (cpLoss <= 40) return { tag: 'good', label: 'Good Move', glyph: '' };
    if (cpLoss <= 95) return { tag: 'inaccuracy', label: 'Inaccuracy', glyph: '?!' };
    if (cpLoss <= 220) return { tag: 'mistake', label: 'Mistake', glyph: '?' };
    return { tag: 'blunder', label: 'Blunder', glyph: '??' };
  }
  function analyzeGameHistory(chessInstance, playerColor = 'w') {
    const fullHistory = chessInstance.history({ verbose: true });
    if (fullHistory.length === 0) return null;
    const tempChess = new Chess();
    const evalTimeline = [0];
    const moveAnalyses = [];
    let whiteCplTotal = 0, whiteMoveCount = 0, blackCplTotal = 0, blackMoveCount = 0;
    const whiteCounts = { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
    const blackCounts = { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
    for (let i = 0; i < fullHistory.length; i++) {
      const move = fullHistory[i];
      const sideToMove = tempChess.turn();
      const prevEval = evaluateBoard(tempChess);
      tempChess.move(move);
      const currentEval = evaluateBoard(tempChess);
      evalTimeline.push(currentEval);
      let cpLoss = 0;
      if (sideToMove === 'w') {
        cpLoss = Math.max(0, prevEval - currentEval);
        if (cpLoss > 1000) cpLoss = 1000;
        whiteCplTotal += cpLoss;
        whiteMoveCount++;
        const quality = classifyMoveQuality(cpLoss);
        whiteCounts[quality.tag]++;
        moveAnalyses.push({ ply: i + 1, san: move.san, color: 'w', evalAfter: currentEval, cpLoss, quality });
      } else {
        cpLoss = Math.max(0, currentEval - prevEval);
        if (cpLoss > 1000) cpLoss = 1000;
        blackCplTotal += cpLoss;
        blackMoveCount++;
        const quality = classifyMoveQuality(cpLoss);
        blackCounts[quality.tag]++;
        moveAnalyses.push({ ply: i + 1, san: move.san, color: 'b', evalAfter: currentEval, cpLoss, quality });
      }
    }
    const whiteAcpl = whiteMoveCount > 0 ? Math.round(whiteCplTotal / whiteMoveCount) : 0;
    const blackAcpl = blackMoveCount > 0 ? Math.round(blackCplTotal / blackMoveCount) : 0;
    const whiteAccuracy = calculateAccuracyFromAcpl(whiteAcpl);
    const blackAccuracy = calculateAccuracyFromAcpl(blackAcpl);
    return {
      timeline: evalTimeline,
      moves: moveAnalyses,
      player: {
        color: playerColor,
        acpl: playerColor === 'w' ? whiteAcpl : blackAcpl,
        accuracy: playerColor === 'w' ? whiteAccuracy : blackAccuracy,
        counts: playerColor === 'w' ? whiteCounts : blackCounts
      },
      ai: {
        color: playerColor === 'w' ? 'b' : 'w',
        acpl: playerColor === 'w' ? blackAcpl : whiteAcpl,
        accuracy: playerColor === 'w' ? blackAccuracy : whiteAccuracy,
        counts: playerColor === 'w' ? blackCounts : whiteCounts
      }
    };
  }

  // 10. Main Game Controller
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
  let lastVictoryRecord = null;

  let timerBaseSeconds = 0;
  let whiteTime = 0;
  let blackTime = 0;
  let timerInterval = null;
  let currentHofTab = 'local';

  // Replay Controller
  let replayIndex = -1;
  function isReviewing() { return replayIndex !== -1 && replayIndex < chess.history().length; }
  function getDisplayChess() {
    if (!isReviewing()) return chess;
    const temp = new Chess();
    const history = chess.history();
    for (let i = 0; i < replayIndex; i++) temp.move(history[i]);
    return temp;
  }
  function goToFirst() { if (chess.history().length === 0) return; replayIndex = 0; renderGame(); }
  function goToPrev() {
    const total = chess.history().length;
    if (total === 0) return;
    if (replayIndex === -1) replayIndex = total - 1;
    else if (replayIndex > 0) replayIndex--;
    renderGame();
  }
  function goToNext() {
    const total = chess.history().length;
    if (total === 0 || replayIndex === -1) return;
    if (replayIndex < total) {
      replayIndex++;
      if (replayIndex === total) replayIndex = -1;
      renderGame();
    }
  }
  function goToLast() { replayIndex = -1; renderGame(); }

  // Board Rendering
  function renderBoardDOM() {
    const boardEl = document.getElementById('board');
    if (!boardEl) return;
    boardEl.innerHTML = '';

    const displayChess = getDisplayChess();
    const board = displayChess.board();
    const inCheck = displayChess.in_check() || displayChess.in_checkmate();
    const turnSide = displayChess.turn();

    const displayHistory = displayChess.history({ verbose: true });
    let currentDisplayLastMove = null;
    if (displayHistory.length > 0) {
      const l = displayHistory[displayHistory.length - 1];
      currentDisplayLastMove = { from: l.from, to: l.to };
    }

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const boardRow = isBoardFlipped ? (7 - r) : r;
        const boardCol = isBoardFlipped ? (7 - c) : c;
        const fileChar = String.fromCharCode(97 + boardCol);
        const rankNum = 8 - boardRow;
        const squareName = fileChar + rankNum;

        const squareDiv = document.createElement('div');
        const isLight = (boardCol + rankNum) % 2 === 0;
        squareDiv.className = `square ${isLight ? 'light' : 'dark'}`;
        squareDiv.dataset.square = squareName;

        if (c === 0) {
          const rankLabel = document.createElement('span');
          rankLabel.className = 'coordinate coord-rank';
          rankLabel.innerText = rankNum;
          squareDiv.appendChild(rankLabel);
        }
        if (r === 7) {
          const fileLabel = document.createElement('span');
          fileLabel.className = 'coordinate coord-file';
          fileLabel.innerText = fileChar;
          squareDiv.appendChild(fileLabel);
        }

        const piece = board[boardRow][boardCol];
        if (piece) {
          const spanPiece = document.createElement('span');
          const symKey = piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
          spanPiece.innerText = pieceSymbols[symKey] || '';
          spanPiece.className = piece.color === 'w' ? 'piece-white' : 'piece-black';
          squareDiv.appendChild(spanPiece);

          if (inCheck && piece.type === 'k' && piece.color === turnSide) {
            squareDiv.classList.add('king-in-check');
          }
        }

        if (selectedSquare === squareName) squareDiv.classList.add('selected');
        if (currentDisplayLastMove && (currentDisplayLastMove.from === squareName || currentDisplayLastMove.to === squareName)) {
          squareDiv.classList.add('last-move');
        }

        const moveHint = legalMovesForSelected.find(m => m.to === squareName);
        if (moveHint) {
          if (moveHint.captured || (moveHint.flags && moveHint.flags.includes('e'))) {
            squareDiv.classList.add('capture-hint');
          } else {
            squareDiv.classList.add('hint');
          }
        }

        squareDiv.onclick = () => handleSquareClick(squareName);
        boardEl.appendChild(squareDiv);
      }
    }
  }

  function handleSquareClick(square) {
    if (isReviewing()) goToLast();
    if (chess.game_over() || chess.turn() !== playerColor || isAiThinking) return;

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
        showPromotionModal(playerColor, (chosenPromo) => {
          executePlayerMove({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: chosenPromo });
          pendingPromotion = null;
        });
        return;
      }
      executePlayerMove({ from: selectedSquare, to: square });
    }
  }

  function showPromotionModal(color, onSelect) {
    const modal = document.getElementById('promotion-modal');
    const container = document.getElementById('promo-options');
    container.innerHTML = '';
    ['q', 'r', 'b', 'n'].forEach(type => {
      const btn = document.createElement('div');
      btn.className = 'promo-btn';
      const symKey = color === 'w' ? type.toUpperCase() : type;
      btn.innerHTML = `<span class="${color === 'w' ? 'piece-white' : 'piece-black'}">${pieceSymbols[symKey]}</span>`;
      btn.onclick = () => {
        modal.style.display = 'none';
        onSelect(type);
      };
      container.appendChild(btn);
    });
    modal.style.display = 'flex';
  }

  function executePlayerMove(moveObj) {
    const move = chess.move(moveObj);
    if (!move) return;
    selectedSquare = null;
    legalMovesForSelected = [];
    lastMove = { from: move.from, to: move.to };
    if (move.captured) sound.capture();
    else if (chess.in_check()) sound.check();
    else sound.move();
    renderGame();
    if (chess.game_over()) {
      handleGameOver();
      return;
    }
    triggerAiTurn();
  }

  function triggerAiTurn() {
    isAiThinking = true;
    updateStatusDisplay(chess);
    setTimeout(() => {
      if (chess.game_over()) { isAiThinking = false; return; }
      const side = playerColor === 'w' ? 'b' : 'w';
      const result = searchEngine.findBestMove(aiDifficulty, side);
      if (result && result.move) {
        const aiMove = chess.move(result.move);
        if (aiMove) {
          lastMove = { from: aiMove.from, to: aiMove.to };
          if (aiMove.captured) sound.capture();
          else if (chess.in_check()) sound.check();
          else sound.move();
        }
      }
      isAiThinking = false;
      renderGame();
      if (chess.game_over()) handleGameOver();
    }, 250);
  }

  function handleGameOver() {
    stopTimer();
    sound.gameover();
    updateStatusDisplay(chess);
    if (chess.in_checkmate()) {
      const winner = chess.turn() === 'w' ? 'Black' : 'White';
      const playerWon = (winner === 'White' && playerColor === 'w') || (winner === 'Black' && playerColor === 'b');
      if (playerWon) {
        lastVictoryRecord = saveVictory(chess, aiDifficulty);
        updateHofBadges();
        setTimeout(() => openVictoryModal(lastVictoryRecord), 400);
      } else {
        purgeOnLoss(getPlayerNickname());
        updateHofBadges();
        setTimeout(() => { document.getElementById('permadeath-modal').style.display = 'flex'; }, 500);
      }
    }
  }

  function renderMoveLog() {
    const container = document.getElementById('moves-log');
    if (!container) return;
    const history = chess.history();
    if (history.length === 0) {
      container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 12px 0;">No moves yet.</div>';
      return;
    }
    let html = '';
    for (let i = 0; i < history.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const wMove = history[i];
      const bMove = history[i + 1] || '';
      const wIdx = i + 1;
      const bIdx = i + 2;
      const wActive = replayIndex === wIdx ? 'active-move' : '';
      const bActive = replayIndex === bIdx ? 'active-move' : '';
      html += `
        <div class="move-row">
          <span class="move-num">${moveNum}.</span>
          <span class="move-white"><span class="move-btn ${wActive}" data-idx="${wIdx}">${wMove}</span></span>
          <span class="move-black">${bMove ? `<span class="move-btn ${bActive}" data-idx="${bIdx}">${bMove}</span>` : ''}</span>
        </div>
      `;
    }
    container.innerHTML = html;
    container.querySelectorAll('.move-btn').forEach(btn => {
      btn.onclick = () => {
        replayIndex = parseInt(btn.getAttribute('data-idx'), 10);
        renderGame();
      };
    });
    if (!isReviewing()) container.scrollTop = container.scrollHeight;
  }

  function updateEvalBarDOM(displayChess) {
    const fillEl = document.getElementById('eval-bar-fill');
    const textEl = document.getElementById('eval-score-text');
    if (!fillEl || !textEl) return;
    const evalScore = evaluateBoard(displayChess);
    const cp = Math.max(-1000, Math.min(1000, evalScore));
    let whitePct = 50 + (cp / 1000) * 45;
    whitePct = Math.max(5, Math.min(95, whitePct));
    fillEl.style.height = `${whitePct}%`;
    const scoreVal = (Math.abs(evalScore) / 100).toFixed(1);
    textEl.innerText = evalScore > 0 ? `+${scoreVal}` : (evalScore < 0 ? `-${scoreVal}` : '0.0');
  }

  function updateStatusDisplay(displayChess) {
    const statusEl = document.getElementById('game-status');
    if (!statusEl) return;
    if (isAiThinking) {
      statusEl.innerHTML = '<span class="status-badge status-active">AI Thinking...</span>';
      return;
    }
    if (displayChess.in_checkmate()) {
      const winner = displayChess.turn() === 'w' ? 'Black' : 'White';
      statusEl.innerHTML = `<span class="status-badge status-mate">Checkmate: ${winner} Wins</span>`;
      return;
    }
    if (displayChess.in_draw()) {
      statusEl.innerHTML = '<span class="status-badge status-draw">Game Drawn</span>';
      return;
    }
    if (displayChess.in_check()) {
      const side = displayChess.turn() === 'w' ? "White" : "Black";
      statusEl.innerHTML = `<span class="status-badge status-check">${side} in Check</span>`;
      return;
    }
    const currentTurn = displayChess.turn() === 'w' ? "White's Turn" : "Black's Turn";
    statusEl.innerHTML = `<span class="status-badge status-active">${currentTurn}</span>`;
  }

  function updateCapturedPieces(displayChess) {
    const topCap = document.getElementById('top-captured');
    const botCap = document.getElementById('bottom-captured');
    const topAdv = document.getElementById('top-advantage');
    const botAdv = document.getElementById('bottom-advantage');
    if (!topCap || !botCap) return;
    const starting = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const currentW = { p: 0, n: 0, b: 0, r: 0, q: 0 };
    const currentB = { p: 0, n: 0, b: 0, r: 0, q: 0 };
    displayChess.board().forEach(row => {
      row.forEach(p => {
        if (p && p.type !== 'k') {
          if (p.color === 'w') currentW[p.type]++;
          else currentB[p.type]++;
        }
      });
    });
    let wLost = '', bLost = '', wMat = 0, bMat = 0;
    ['q', 'r', 'b', 'n', 'p'].forEach(type => {
      const wDiff = starting[type] - currentW[type];
      const bDiff = starting[type] - currentB[type];
      const val = pieceValues[type];
      if (wDiff > 0) { wLost += pieceSymbols[type.toUpperCase()].repeat(wDiff); bMat += val * wDiff; }
      if (bDiff > 0) { bLost += pieceSymbols[type.toLowerCase()].repeat(bDiff); wMat += val * bDiff; }
    });
    const isTopWhite = isBoardFlipped ? (playerColor === 'w') : (playerColor === 'b');
    topCap.innerText = isTopWhite ? bLost : wLost;
    botCap.innerText = isTopWhite ? wLost : bLost;
    const diff = Math.round((wMat - bMat) / 100);
    if (topAdv && botAdv) {
      topAdv.style.display = 'none';
      botAdv.style.display = 'none';
      if (diff > 0) {
        if (isTopWhite) { topAdv.innerText = `+${diff}`; topAdv.style.display = 'inline-block'; }
        else { botAdv.innerText = `+${diff}`; botAdv.style.display = 'inline-block'; }
      } else if (diff < 0) {
        if (isTopWhite) { botAdv.innerText = `+${Math.abs(diff)}`; botAdv.style.display = 'inline-block'; }
        else { topAdv.innerText = `+${Math.abs(diff)}`; topAdv.style.display = 'inline-block'; }
      }
    }
  }

  function updatePlayerLabels() {
    const topName = document.getElementById('top-player-name');
    const bottomName = document.getElementById('bottom-player-name');
    const nick = getPlayerNickname();
    const streak = getWinStreak();
    if (isBoardFlipped) {
      if (playerColor === 'w') {
        if (topName) topName.innerText = `You (${nick}) Streak: ${streak}`;
        if (bottomName) bottomName.innerText = 'Grandmaster AI (Black)';
      } else {
        if (topName) topName.innerText = `You (${nick}) Streak: ${streak}`;
        if (bottomName) bottomName.innerText = 'Grandmaster AI (White)';
      }
    } else {
      if (playerColor === 'w') {
        if (topName) topName.innerText = 'Grandmaster AI (Black)';
        if (bottomName) bottomName.innerText = `You (${nick}) Streak: ${streak}`;
      } else {
        if (topName) topName.innerText = 'Grandmaster AI (White)';
        if (bottomName) bottomName.innerText = `You (${nick}) Streak: ${streak}`;
      }
    }
  }

  function updateHofBadges() {
    const victories = getStoredVictories();
    const badge = document.getElementById('hof-count-badge');
    const nickBtn = document.getElementById('btn-nickname');
    if (badge) badge.innerText = victories.length;
    if (nickBtn) nickBtn.innerText = getPlayerNickname();
    updatePlayerLabels();
  }

  function renderGame() {
    renderBoardDOM();
    const displayChess = getDisplayChess();
    updateStatusDisplay(displayChess);
    updateCapturedPieces(displayChess);
    updateEvalBarDOM(displayChess);
    renderMoveLog();
  }

  function newGame() {
    chess.reset();
    selectedSquare = null;
    legalMovesForSelected = [];
    lastMove = null;
    isAiThinking = false;
    replayIndex = -1;
    updatePlayerLabels();
    renderGame();
    if (playerColor === 'b') triggerAiTurn();
  }

  function undoMove() {
    if (isAiThinking || chess.history().length === 0) return;
    replayIndex = -1;
    if (chess.turn() === playerColor) {
      chess.undo();
      if (chess.history().length > 0) chess.undo();
    } else {
      chess.undo();
    }
    renderGame();
  }

  function flipBoard() {
    isBoardFlipped = !isBoardFlipped;
    updatePlayerLabels();
    renderGame();
  }

  function copyPGN() {
    const pgn = chess.pgn();
    navigator.clipboard.writeText(pgn).then(() => alert("PGN Copied to Clipboard!"));
  }

  function changeDifficulty() {
    const sel = document.getElementById('select-difficulty');
    if (!sel) return;
    aiDifficulty = parseInt(sel.value, 10);
    const badge = document.getElementById('mode-badge');
    if (badge) {
      badge.innerText = aiDifficulty === 4 ? "Impossible Mode" : "Regular Mode";
      badge.style.display = aiDifficulty === 4 ? "inline-block" : "none";
    }
  }

  function changePlayerSide() {
    const sel = document.getElementById('select-side');
    if (!sel) return;
    playerColor = sel.value;
    isBoardFlipped = (playerColor === 'b');
    newGame();
  }

  function changeTimerSetting() {
    const sel = document.getElementById('select-timer');
    if (!sel) return;
    timerBaseSeconds = parseInt(sel.value, 10);
    newGame();
  }

  function toggleSound() {
    const sel = document.getElementById('select-sound');
    if (!sel) return;
    sound.enabled = (sel.value === 'on');
  }

  function loadScenario(type) {
    chess.reset();
    replayIndex = -1;
    if (type === 'mate1') chess.load('r1bqkb1r/pppp1ppp/2n5/4N3/2B1n3/8/PPPP1PPP/RNBQK2R w KQkq - 0 5');
    else if (type === 'fork') chess.load('r1bqkb1r/pppp1ppp/2n5/4p3/4n3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 4');
    else if (type === 'endgame') chess.load('8/8/4k3/8/8/4K3/4R3/8 w - - 0 1');
    renderGame();
  }

  // Live Global Ticker
  function initTicker() {
    const el = document.getElementById('global-ticker');
    if (!el) return;
    const local = getStoredVictories();
    const items = local.length > 0 ? local : [
      { nickname: 'Grandmaster AI', streak: 99, movesCount: 0, isPioneer: true }
    ];
    const itemsHtml = items.map(v => `
      <span class="ticker-item">
        <span class="ticker-badge">${v.isPioneer !== false ? 'PIONEER' : 'WIN'}</span>
        <strong>${v.nickname}</strong>: Streak ${v.streak || 1} (${v.movesCount || 0} moves)
      </span>
    `).join(' • ');

    el.innerHTML = `
      <div class="ticker-wrap">
        <div class="ticker-label">LIVE FEED</div>
        <div class="ticker-content">
          <div class="ticker-marquee">${itemsHtml} &nbsp;&nbsp;•&nbsp;&nbsp; ${itemsHtml}</div>
        </div>
      </div>
    `;
  }

  // Victory Modal & Custom Nickname
  function openVictoryModal(record) {
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
      inputNick.onkeydown = (e) => { if (e.key === 'Enter') saveVictoryNicknameDirect(); };
    }
    if (msgNick) msgNick.style.display = 'none';
    modal.style.display = 'flex';
  }

  function saveVictoryNicknameDirect() {
    const inputEl = document.getElementById('vic-nickname-input');
    const msgEl = document.getElementById('vic-name-saved-msg');
    const statNickEl = document.getElementById('vic-stat-nick');
    if (!inputEl) return;
    const newName = inputEl.value.trim();
    if (newName === '') return;
    const updated = updateVictoryNickname(lastVictoryRecord ? lastVictoryRecord.id : null, newName);
    if (updated) lastVictoryRecord = updated;
    if (statNickEl) statNickEl.innerText = newName;
    updateHofBadges();
    if (msgEl) {
      msgEl.style.display = 'block';
      setTimeout(() => { if (msgEl) msgEl.style.display = 'none'; }, 2500);
    }
  }

  function getVictoryShareText() {
    const streak = getWinStreak();
    const moves = chess.history().length;
    return `I defeated the Grandmaster Engine on Impossible Chess in ${moves} moves. Win Streak: ${streak}. Can you beat it? Play here: https://impossible-chess.pages.dev (Built by Sharrif Fajar)`;
  }
  function shareToWhatsApp() {
    const text = encodeURIComponent(getVictoryShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  }
  function shareToTwitter() {
    const text = encodeURIComponent(getVictoryShareText());
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  }
  function shareVictoryDirect() {
    const shareText = getVictoryShareText();
    if (navigator.share) {
      navigator.share({ title: 'Impossible Chess Victory', text: shareText, url: 'https://impossible-chess.pages.dev' }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText).then(() => alert("Victory link and score copied to clipboard!"));
    }
  }

  // Hall of Fame
  function openHallOfFame() {
    const modal = document.getElementById('hof-modal');
    if (modal) modal.style.display = 'flex';
    renderLocalHof();
  }
  function closeHallOfFame() {
    const modal = document.getElementById('hof-modal');
    if (modal) modal.style.display = 'none';
  }
  function switchHofTab(tab) {
    currentHofTab = tab;
    document.getElementById('tab-btn-local')?.classList.toggle('active', tab === 'local');
    document.getElementById('tab-btn-global')?.classList.toggle('active', tab === 'global');
    if (tab === 'local') renderLocalHof();
    else loadGlobalLeaderboard();
  }
  function renderLocalHof() {
    const listEl = document.getElementById('hof-list');
    if (!listEl) return;
    const victories = getStoredVictories();
    if (victories.length === 0) {
      listEl.innerHTML = `<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 16px 0;">No local victories recorded yet.<br>Defeat the AI to earn a permanent record.</div>`;
      return;
    }
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
          <button class="pgn-copy-btn" data-pgn="${(v.pgn || '').replace(/"/g, '&quot;')}" style="padding: 4px 8px; font-size: 0.75rem;">PGN</button>
        </div>
      `;
    });
    listEl.innerHTML = html;
    listEl.querySelectorAll('.pgn-copy-btn').forEach(btn => {
      btn.onclick = () => {
        navigator.clipboard.writeText(btn.getAttribute('data-pgn')).then(() => alert('Victory PGN Copied!'));
      };
    });
  }
  async function loadGlobalLeaderboard() {
    const listEl = document.getElementById('hof-list');
    if (!listEl) return;
    listEl.innerHTML = `<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 16px 0;">Loading Global Leaderboard...</div>`;
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
              <button class="pgn-copy-btn" data-pgn="${(v.pgn || '').replace(/"/g, '&quot;')}" style="padding: 4px 8px; font-size: 0.75rem;">PGN</button>
            </div>
          `;
        });
        listEl.innerHTML = html;
      } else {
        listEl.innerHTML = `<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 16px 0;">No global records in Cloudflare D1/KV yet.<br>Be the first to defeat Impossible Mode!</div>`;
      }
    } catch (e) {
      listEl.innerHTML = `<div style="color: #f87171; font-size: 0.8rem; text-align: center; padding: 16px 0;">Local Mode: Deploy to Cloudflare Pages with D1 to see live global entries.</div>`;
    }
  }

  function editNickname() {
    const current = getPlayerNickname();
    const entered = prompt("Enter your player nickname for the Hall of Fame:", current);
    if (entered && entered.trim() !== '') {
      setPlayerNickname(entered.trim());
      updateHofBadges();
    }
  }

  // Game Analysis View
  function openGameAnalysis() {
    const modal = document.getElementById('analysis-modal');
    if (!modal) return;
    if (chess.history().length === 0) {
      alert("Play at least one move to generate game analysis.");
      return;
    }
    const data = analyzeGameHistory(chess, playerColor);
    if (!data) return;

    document.getElementById('analysis-player-acc').innerText = `${data.player.accuracy}%`;
    document.getElementById('analysis-ai-acc').innerText = `${data.ai.accuracy}%`;
    document.getElementById('analysis-player-acpl').innerText = `${data.player.acpl} ACPL`;
    document.getElementById('analysis-ai-acpl').innerText = `${data.ai.acpl} ACPL`;

    const tbody = document.getElementById('analysis-breakdown-tbody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td><span class="badge-move-best">Best (!)</span></td>
          <td style="font-weight:700; color:#4ade80;">${data.player.counts.best}</td>
          <td style="font-weight:700; color:#4ade80;">${data.ai.counts.best}</td>
        </tr>
        <tr>
          <td><span class="badge-move-good">Good</span></td>
          <td>${data.player.counts.good}</td>
          <td>${data.ai.counts.good}</td>
        </tr>
        <tr>
          <td><span class="badge-move-inaccuracy">Inaccuracy (?!)</span></td>
          <td style="color:#fcd34d;">${data.player.counts.inaccuracy}</td>
          <td style="color:#fcd34d;">${data.ai.counts.inaccuracy}</td>
        </tr>
        <tr>
          <td><span class="badge-move-mistake">Mistake (?)</span></td>
          <td style="color:#fb923c;">${data.player.counts.mistake}</td>
          <td style="color:#fb923c;">${data.ai.counts.mistake}</td>
        </tr>
        <tr>
          <td><span class="badge-move-blunder">Blunder (??)</span></td>
          <td style="color:#f87171; font-weight:700;">${data.player.counts.blunder}</td>
          <td style="color:#f87171; font-weight:700;">${data.ai.counts.blunder}</td>
        </tr>
      `;
    }

    // Render SVG Graph
    const container = document.getElementById('analysis-graph-container');
    if (container && data.timeline) {
      const width = 420, height = 120, padding = 10, zeroY = height / 2, maxCp = 600;
      const points = data.timeline.map((cp, idx) => {
        const x = padding + (idx / (data.timeline.length - 1 || 1)) * (width - padding * 2);
        const clampedCp = Math.max(-maxCp, Math.min(maxCp, cp));
        const y = zeroY - (clampedCp / maxCp) * (zeroY - padding);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      const pathD = `M ${points.join(' L ')}`;
      const areaD = `M ${padding},${zeroY} L ${points.join(' L ')} L ${width - padding},${zeroY} Z`;
      container.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:auto; background:#121518; border-radius:6px; border:1px solid #2f353d;">
          <line x1="${padding}" y1="${zeroY}" x2="${width - padding}" y2="${zeroY}" stroke="#3f4752" stroke-dasharray="3,3" stroke-width="1" />
          <path d="${areaD}" fill="rgba(46, 130, 83, 0.25)" />
          <path d="${pathD}" fill="none" stroke="#4ade80" stroke-width="2" stroke-linejoin="round" />
          <text x="${padding + 4}" y="${padding + 10}" fill="#9ba3af" font-size="9" font-family="sans-serif">+Advantage</text>
          <text x="${padding + 4}" y="${height - 6}" fill="#9ba3af" font-size="9" font-family="sans-serif">-Deficit</text>
        </svg>
      `;
    }

    modal.style.display = 'flex';
  }
  function closeGameAnalysis() {
    const modal = document.getElementById('analysis-modal');
    if (modal) modal.style.display = 'none';
  }

  // Attach to window
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
  window.openGameAnalysis = openGameAnalysis;
  window.closeGameAnalysis = closeGameAnalysis;
  window.shareToWhatsApp = shareToWhatsApp;
  window.shareToTwitter = shareToTwitter;
  window.shareVictoryDirect = shareVictoryDirect;
  window.editNickname = editNickname;
  window.switchHofTab = switchHofTab;
  window.goToFirstMove = goToFirst;
  window.goToPrevMove = goToPrev;
  window.goToNextMove = goToNext;
  window.goToLastMove = goToLast;

  function initApp() {
    newGame();
    changeDifficulty();
    updateHofBadges();
    initTicker();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
