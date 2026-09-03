/**
 * Impossible Chess - Dynamic Centipawn Evaluation Bar
 */

import { pieceValues, pstTables } from '../config.js';
import { evaluateKingSafety, evaluatePawnStructure } from '../engine/eval.js';

export function evaluateWhiteAdvantage(chessInstance) {
  if (chessInstance.in_checkmate()) {
    return chessInstance.turn() === 'b' ? 100000 : -100000;
  }
  if (chessInstance.in_draw()) return 0;

  const board = chessInstance.board();
  let wScore = 0;
  let bScore = 0;
  let nonKingPieces = 0;
  let wQueens = 0;
  let bQueens = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      let val = pieceValues[p.type];
      const pst = pstTables[p.type];
      if (pst) {
        const sqIndex = p.color === 'w' ? (r * 8 + c) : ((7 - r) * 8 + c);
        val += pst[sqIndex];
      }
      if (p.type !== 'k') {
        nonKingPieces++;
        if (p.type === 'q') {
          if (p.color === 'w') wQueens++;
          else bQueens++;
        }
      }
      if (p.color === 'w') wScore += val;
      else bScore += val;
    }
  }

  const isEndgame = nonKingPieces <= 6 || (wQueens === 0 && bQueens === 0);
  wScore += evaluateKingSafety(board, 'w', isEndgame);
  bScore += evaluateKingSafety(board, 'b', isEndgame);
  wScore += evaluatePawnStructure(board, 'w');
  bScore += evaluatePawnStructure(board, 'b');

  return wScore - bScore;
}

export function updateEvalBar(chessInstance, isBoardFlipped = false, customScore = null) {
  const fillEl = document.getElementById('eval-bar-fill');
  const textEl = document.getElementById('eval-score-text');
  if (!fillEl || !textEl) return;

  const cp = customScore !== null ? customScore : evaluateWhiteAdvantage(chessInstance);

  let whitePercent = 50;
  let labelText = "0.0";

  if (cp >= 90000) {
    whitePercent = 98;
    labelText = "+M";
  } else if (cp <= -90000) {
    whitePercent = 2;
    labelText = "-M";
  } else {
    const winChance = 50 + 50 * (2 / (1 + Math.exp(-0.0035 * cp)) - 1);
    whitePercent = Math.max(3, Math.min(97, winChance));
    const formatted = (cp / 100).toFixed(1);
    labelText = cp > 0 ? `+${formatted}` : `${formatted}`;
  }

  const fillPercent = isBoardFlipped ? (100 - whitePercent) : whitePercent;
  fillEl.style.height = `${fillPercent}%`;
  textEl.innerText = labelText;
}
