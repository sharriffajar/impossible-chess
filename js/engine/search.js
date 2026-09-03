import { pieceValues } from '../config.js';
import { evaluateBoard } from './eval.js';
import { zobrist, transpositionTable } from './zobrist.js';
import { getBookMove } from './book.js';
import { adaptiveLearning } from './learning.js';

export class ChessSearchEngine {
  constructor(chessInstance) {
    this.chess = chessInstance;
    this.nodesEvaluatedCount = 0;
    this.searchDeadline = 0;
    this.searchTimeoutReached = false;
    this.aiColor = 'b';
  }

  orderMoves(moves, ttBestMove = null) {
    const currentHist = this.chess.history();
    return moves.slice().sort((a, b) => {
      // 0. Auto-Refutation Penalty: Penalize known defeated moves from previous player wins
      const aIsKnownDefeat = adaptiveLearning.isKnownLosingMove(currentHist, a.san || (a.from + a.to));
      const bIsKnownDefeat = adaptiveLearning.isKnownLosingMove(currentHist, b.san || (b.from + b.to));
      if (aIsKnownDefeat && !bIsKnownDefeat) return 1000000;
      if (!aIsKnownDefeat && bIsKnownDefeat) return -1000000;

      // 1. Prioritize Transposition Table Best Move
      if (ttBestMove) {
        if (a.from === ttBestMove.from && a.to === ttBestMove.to) return -100000;
        if (b.from === ttBestMove.from && b.to === ttBestMove.to) return 100000;
      }

      // 2. MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
      let scoreA = 0;
      let scoreB = 0;

      if (a.captured) {
        scoreA = pieceValues[a.captured] * 10 - pieceValues[a.piece];
      }
      if (b.captured) {
        scoreB = pieceValues[b.captured] * 10 - pieceValues[b.piece];
      }

      // 3. Promotion bonus
      if (a.promotion) scoreA += 800;
      if (b.promotion) scoreB += 800;

      return scoreB - scoreA;
    });
  }

  quiescence(alpha, beta, depth = 0) {
    this.nodesEvaluatedCount++;

    if ((this.nodesEvaluatedCount & 511) === 0) {
      if (Date.now() > this.searchDeadline) {
        this.searchTimeoutReached = true;
      }
    }

    const standPat = evaluateBoard(this.chess.board(), this.aiColor);
    if (depth >= 6 || this.searchTimeoutReached) {
      return standPat;
    }

    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;

    // Search tactical capture moves only
    const captureMoves = this.chess.moves({ verbose: true }).filter(m => m.captured !== undefined || m.promotion !== undefined);
    const orderedCaptures = this.orderMoves(captureMoves);

    for (let move of orderedCaptures) {
      // Delta pruning
      if (move.captured) {
        const victimVal = pieceValues[move.captured] || 100;
        if (standPat + victimVal + 200 < alpha) continue;
      }

      this.chess.move(move);
      const score = -this.quiescence(-beta, -alpha, depth + 1);
      this.chess.undo();

      if (this.searchTimeoutReached) return alpha;
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }

    return alpha;
  }

  minimax(depth, isMaximizing, alpha, beta, ply = 0) {
    this.nodesEvaluatedCount++;

    if ((this.nodesEvaluatedCount & 511) === 0) {
      if (Date.now() > this.searchDeadline) {
        this.searchTimeoutReached = true;
      }
    }

    if (this.searchTimeoutReached) {
      return isMaximizing ? alpha : beta;
    }

    // Check terminal conditions
    if (this.chess.in_checkmate()) {
      return isMaximizing ? (-999999 + ply) : (999999 - ply);
    }
    if (this.chess.in_draw()) {
      return 0;
    }

    if (depth <= 0) {
      return this.quiescence(alpha, beta, 0);
    }

    const hashKey = zobrist.hash(this.chess);
    const ttEntry = transpositionTable.probe(hashKey, depth, alpha, beta);
    if (ttEntry.hit && ply > 0) {
      return ttEntry.score;
    }

    const moves = this.chess.moves({ verbose: true });
    if (moves.length === 0) {
      if (this.chess.in_check()) return isMaximizing ? (-999999 + ply) : (999999 - ply);
      return 0;
    }

    const orderedMoves = this.orderMoves(moves, ttEntry.move);
    let bestMove = orderedMoves[0];
    let originalAlpha = alpha;

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let move of orderedMoves) {
        this.chess.move(move);
        let evaluation = this.minimax(depth - 1, false, alpha, beta, ply + 1);
        this.chess.undo();

        if (this.searchTimeoutReached) break;

        if (evaluation > maxEval) {
          maxEval = evaluation;
          bestMove = move;
        }
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }

      if (!this.searchTimeoutReached) {
        let flag = 0; // EXACT
        if (maxEval <= originalAlpha) flag = 2; // UPPERBOUND
        else if (maxEval >= beta) flag = 1; // LOWERBOUND
        transpositionTable.store(hashKey, depth, maxEval, flag, bestMove);
      }

      return maxEval;
    } else {
      let minEval = Infinity;
      for (let move of orderedMoves) {
        this.chess.move(move);
        let evaluation = this.minimax(depth - 1, true, alpha, beta, ply + 1);
        this.chess.undo();

        if (this.searchTimeoutReached) break;

        if (evaluation < minEval) {
          minEval = evaluation;
          bestMove = move;
        }
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }

      if (!this.searchTimeoutReached) {
        let flag = 0;
        if (minEval <= originalAlpha) flag = 2;
        else if (minEval >= beta) flag = 1;
        transpositionTable.store(hashKey, depth, minEval, flag, bestMove);
      }

      return minEval;
    }
  }

  findBestMove(difficulty = 4, playerColor = 'w', clockTimeSec = 0) {
    this.aiColor = this.chess.turn();

    // 1. Try Grandmaster Opening Book for fast, professional openings
    const bookMove = getBookMove(this.chess);
    if (bookMove) {
      return {
        move: bookMove,
        score: 0,
        depth: 0,
        nodes: 1,
        timeMs: 5,
        isBook: true
      };
    }

    const moves = this.chess.moves({ verbose: true });
    if (moves.length === 0) return null;

    let maxDepth = 1;
    let timeLimitMs = 1200;

    if (difficulty === 1) {
      maxDepth = 1;
      timeLimitMs = 150;
    } else if (difficulty === 2) {
      maxDepth = 2;
      timeLimitMs = 350;
    } else if (difficulty === 3) {
      maxDepth = 3;
      timeLimitMs = 600;
    } else if (difficulty === 4) {
      maxDepth = 4;
      timeLimitMs = 750;
      if (clockTimeSec > 0) {
        timeLimitMs = Math.max(250, Math.min(850, Math.floor(clockTimeSec * 35)));
      }
    }

    const startTime = Date.now();
    this.searchDeadline = startTime + timeLimitMs;
    this.searchTimeoutReached = false;
    this.nodesEvaluatedCount = 0;

    let overallBestMove = moves[0];
    let overallBestScore = -Infinity;
    let depthAchieved = 1;

    // Iterative Deepening Loop
    for (let d = 1; d <= maxDepth; d++) {
      let currentBestMove = null;
      let currentBestValue = -Infinity;

      let orderedMoves = this.orderMoves(moves, overallBestMove);

      for (let m of orderedMoves) {
        this.chess.move(m);
        let score = this.minimax(d - 1, false, -Infinity, Infinity, 1);
        this.chess.undo();

        if (this.searchTimeoutReached && currentBestMove !== null) {
          break;
        }

        if (score > currentBestValue) {
          currentBestValue = score;
          currentBestMove = m;
        }
      }

      if (!this.searchTimeoutReached && currentBestMove !== null) {
        overallBestMove = currentBestMove;
        overallBestScore = currentBestValue;
        depthAchieved = d;
      }

      if (overallBestScore >= 900000 || overallBestScore <= -900000) {
        break;
      }

      const timeUsed = Date.now() - startTime;
      if (timeUsed > timeLimitMs * 0.55 && d >= 3) {
        break;
      }
    }

    return {
      move: overallBestMove,
      score: overallBestScore,
      depth: depthAchieved,
      nodes: this.nodesEvaluatedCount,
      timeMs: Date.now() - startTime,
      isBook: false
    };
  }
}
