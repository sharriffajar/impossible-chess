/**
 * Impossible Chess - Post-Game Accuracy & Move Quality Analysis Engine
 */

import { evaluateWhiteAdvantage } from '../ui/evalbar.js';

export function calculateAccuracyFromAcpl(acpl) {
  // Lichess / Chess.com standard logistic curve
  // 0 ACPL -> ~99%, 30 ACPL -> ~90%, 60 ACPL -> ~78%, 100 ACPL -> ~60%, 200+ ACPL -> <30%
  const acc = 103.1668 * Math.exp(-0.00435 * acpl) - 3.1668;
  return Math.max(5, Math.min(99.5, parseFloat(acc.toFixed(1))));
}

export function classifyMoveQuality(cpLoss, wasWinning) {
  if (cpLoss <= 12) return { tag: 'best', label: 'Best Move', glyph: '!' };
  if (cpLoss <= 40) return { tag: 'good', label: 'Good Move', glyph: '' };
  if (cpLoss <= 95) return { tag: 'inaccuracy', label: 'Inaccuracy', glyph: '?!' };
  if (cpLoss <= 220) return { tag: 'mistake', label: 'Mistake', glyph: '?' };
  return { tag: 'blunder', label: 'Blunder', glyph: '??' };
}

export function analyzeGameHistory(chessInstance, playerColor = 'w') {
  const fullHistory = chessInstance.history({ verbose: true });
  if (fullHistory.length === 0) return null;

  const tempChess = new Chess();
  const evalTimeline = [0]; // starting position 0.0
  const moveAnalyses = [];

  let whiteCplTotal = 0;
  let whiteMoveCount = 0;
  let blackCplTotal = 0;
  let blackMoveCount = 0;

  const whiteCounts = { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
  const blackCounts = { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };

  for (let i = 0; i < fullHistory.length; i++) {
    const move = fullHistory[i];
    const sideToMove = tempChess.turn(); // 'w' or 'b'

    // Eval before move (from White's perspective)
    const prevEval = evaluateWhiteAdvantage(tempChess);

    // Apply move
    tempChess.move(move);

    // Eval after move (from White's perspective)
    const currentEval = evaluateWhiteAdvantage(tempChess);
    evalTimeline.push(currentEval);

    // Centipawn loss calculation
    let cpLoss = 0;
    if (sideToMove === 'w') {
      // White wants score to increase; loss = prevEval - currentEval
      cpLoss = Math.max(0, prevEval - currentEval);
      // Cap extreme mate swing spikes
      if (cpLoss > 1000) cpLoss = 1000;
      whiteCplTotal += cpLoss;
      whiteMoveCount++;

      const quality = classifyMoveQuality(cpLoss);
      whiteCounts[quality.tag]++;
      moveAnalyses.push({
        ply: i + 1,
        san: move.san,
        color: 'w',
        evalAfter: currentEval,
        cpLoss: cpLoss,
        quality: quality
      });
    } else {
      // Black wants score to decrease; loss = currentEval - prevEval
      cpLoss = Math.max(0, currentEval - prevEval);
      if (cpLoss > 1000) cpLoss = 1000;
      blackCplTotal += cpLoss;
      blackMoveCount++;

      const quality = classifyMoveQuality(cpLoss);
      blackCounts[quality.tag]++;
      moveAnalyses.push({
        ply: i + 1,
        san: move.san,
        color: 'b',
        evalAfter: currentEval,
        cpLoss: cpLoss,
        quality: quality
      });
    }
  }

  const whiteAcpl = whiteMoveCount > 0 ? Math.round(whiteCplTotal / whiteMoveCount) : 0;
  const blackAcpl = blackMoveCount > 0 ? Math.round(blackCplTotal / blackMoveCount) : 0;

  const whiteAccuracy = calculateAccuracyFromAcpl(whiteAcpl);
  const blackAccuracy = calculateAccuracyFromAcpl(blackAcpl);

  const playerAccuracy = playerColor === 'w' ? whiteAccuracy : blackAccuracy;
  const playerAcpl = playerColor === 'w' ? whiteAcpl : blackAcpl;
  const playerCounts = playerColor === 'w' ? whiteCounts : blackCounts;

  const aiAccuracy = playerColor === 'w' ? blackAccuracy : whiteAccuracy;
  const aiAcpl = playerColor === 'w' ? blackAcpl : whiteAcpl;
  const aiCounts = playerColor === 'w' ? blackCounts : whiteCounts;

  return {
    timeline: evalTimeline,
    moves: moveAnalyses,
    white: { acpl: whiteAcpl, accuracy: whiteAccuracy, counts: whiteCounts },
    black: { acpl: blackAcpl, accuracy: blackAccuracy, counts: blackCounts },
    player: { color: playerColor, acpl: playerAcpl, accuracy: playerAccuracy, counts: playerCounts },
    ai: { color: playerColor === 'w' ? 'b' : 'w', acpl: aiAcpl, accuracy: aiAccuracy, counts: aiCounts }
  };
}
