/**
 * Impossible Chess - Evaluation Functions (Material, PST, King Safety, Pawn Structure)
 */

import { pieceValues, pstTables, pstKingEnd } from '../config.js';

export function evaluateKingSafety(board, color, isEndgame) {
  let safetyScore = 0;
  let kingRow = -1;
  let kingCol = -1;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'k' && p.color === color) {
        kingRow = r;
        kingCol = c;
        break;
      }
    }
    if (kingRow !== -1) break;
  }

  if (kingRow === -1) return 0;

  if (isEndgame) {
    const sqIndex = color === 'w' ? (kingRow * 8 + kingCol) : ((7 - kingRow) * 8 + kingCol);
    return pstKingEnd[sqIndex] || 0;
  }

  // Bonus for castled kings
  if (color === 'w') {
    if (kingRow === 7 && (kingCol === 6 || kingCol === 1 || kingCol === 2)) {
      safetyScore += 35;
    }
  } else {
    if (kingRow === 0 && (kingCol === 6 || kingCol === 1 || kingCol === 2)) {
      safetyScore += 35;
    }
  }

  // Pawn shield evaluation
  const shieldRow = color === 'w' ? kingRow - 1 : kingRow + 1;
  if (shieldRow >= 0 && shieldRow < 8) {
    for (let dc = -1; dc <= 1; dc++) {
      const shieldCol = kingCol + dc;
      if (shieldCol >= 0 && shieldCol < 8) {
        const piece = board[shieldRow][shieldCol];
        if (piece && piece.type === 'p' && piece.color === color) {
          safetyScore += 18;
        } else {
          // Check if pushed 2 squares
          const deepShieldRow = color === 'w' ? shieldRow - 1 : shieldRow + 1;
          if (deepShieldRow >= 0 && deepShieldRow < 8) {
            const deepPiece = board[deepShieldRow][shieldCol];
            if (deepPiece && deepPiece.type === 'p' && deepPiece.color === color) {
              safetyScore += 8;
            } else {
              safetyScore -= 12; // Open file near King penalty
            }
          }
        }
      }
    }
  }

  return safetyScore;
}

export function evaluatePawnStructure(board, color) {
  let pawnScore = 0;
  const pawnCols = new Array(8).fill(0);
  const enemyColor = color === 'w' ? 'b' : 'w';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'p' && p.color === color) {
        pawnCols[c]++;

        // Passed Pawn detection
        let isPassed = true;
        const step = color === 'w' ? -1 : 1;
        let checkRow = r + step;
        while (checkRow >= 0 && checkRow < 8) {
          for (let dc = -1; dc <= 1; dc++) {
            const checkCol = c + dc;
            if (checkCol >= 0 && checkCol < 8) {
              const ep = board[checkRow][checkCol];
              if (ep && ep.type === 'p' && ep.color === enemyColor) {
                isPassed = false;
                break;
              }
            }
          }
          if (!isPassed) break;
          checkRow += step;
        }

        if (isPassed) {
          const rankAdvancement = color === 'w' ? (7 - r) : r;
          pawnScore += 15 + (rankAdvancement * rankAdvancement * 3);
        }
      }
    }
  }

  // Doubled pawn penalty
  for (let c = 0; c < 8; c++) {
    if (pawnCols[c] > 1) {
      pawnScore -= (pawnCols[c] - 1) * 22;
    }
  }

  // Isolated pawn penalty
  for (let c = 0; c < 8; c++) {
    if (pawnCols[c] > 0) {
      const hasLeftNeighbor = (c > 0 && pawnCols[c - 1] > 0);
      const hasRightNeighbor = (c < 7 && pawnCols[c + 1] > 0);
      if (!hasLeftNeighbor && !hasRightNeighbor) {
        pawnScore -= 18;
      }
    }
  }

  return pawnScore;
}

export function evaluateBoard(board, perspectiveColor = 'b') {
  let myScore = 0;
  let opponentScore = 0;
  let nonKingPieces = 0;
  let wQueens = 0;
  let bQueens = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      let pieceVal = pieceValues[piece.type];
      const pst = pstTables[piece.type];
      if (pst) {
        const sqIndex = piece.color === 'w' ? (r * 8 + c) : ((7 - r) * 8 + c);
        pieceVal += pst[sqIndex];
      }

      if (piece.type !== 'k') {
        nonKingPieces++;
        if (piece.type === 'q') {
          if (piece.color === 'w') wQueens++;
          else bQueens++;
        }
      }

      if (piece.color === perspectiveColor) {
        myScore += pieceVal;
      } else {
        opponentScore += pieceVal;
      }
    }
  }

  const oppColor = perspectiveColor === 'w' ? 'b' : 'w';
  const isEndgame = nonKingPieces <= 6 || (wQueens === 0 && bQueens === 0);

  myScore += evaluateKingSafety(board, perspectiveColor, isEndgame);
  opponentScore += evaluateKingSafety(board, oppColor, isEndgame);

  myScore += evaluatePawnStructure(board, perspectiveColor);
  opponentScore += evaluatePawnStructure(board, oppColor);

  return myScore - opponentScore;
}
