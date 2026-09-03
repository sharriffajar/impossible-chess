/**
 * Impossible Chess - Zobrist Hashing & Transposition Table
 */

export class Zobrist {
  constructor() {
    this.table = [];
    this.blackToMove = this.rand32();
    this.castling = [];
    this.enPassant = [];

    // Seed 64 squares x 12 piece types
    for (let sq = 0; sq < 64; sq++) {
      this.table[sq] = {};
      for (let p of ['p', 'n', 'b', 'r', 'q', 'k', 'P', 'N', 'B', 'R', 'Q', 'K']) {
        this.table[sq][p] = this.rand32();
      }
    }

    // 16 castling states (KQkq combinations)
    for (let i = 0; i < 16; i++) {
      this.castling[i] = this.rand32();
    }

    // 8 en-passant files
    for (let i = 0; i < 8; i++) {
      this.enPassant[i] = this.rand32();
    }
  }

  rand32() {
    return (Math.floor(Math.random() * 0xFFFFFFFF) ^ (Math.floor(Math.random() * 0xFFFFFFFF) << 16)) >>> 0;
  }

  hash(chessInstance) {
    let h = 0 >>> 0;
    const board = chessInstance.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) {
          const sq = r * 8 + c;
          const key = p.color === 'w' ? p.type.toUpperCase() : p.type;
          h = (h ^ this.table[sq][key]) >>> 0;
        }
      }
    }

    if (chessInstance.turn() === 'b') {
      h = (h ^ this.blackToMove) >>> 0;
    }

    // Hash FEN en-passant and castling availability
    const fen = chessInstance.fen();
    const parts = fen.split(' ');
    const castlingStr = parts[2] || '-';
    let cIdx = 0;
    if (castlingStr.includes('K')) cIdx |= 1;
    if (castlingStr.includes('Q')) cIdx |= 2;
    if (castlingStr.includes('k')) cIdx |= 4;
    if (castlingStr.includes('q')) cIdx |= 8;
    h = (h ^ this.castling[cIdx]) >>> 0;

    const ep = parts[3];
    if (ep && ep !== '-') {
      const epFile = ep.charCodeAt(0) - 97;
      if (epFile >= 0 && epFile < 8) {
        h = (h ^ this.enPassant[epFile]) >>> 0;
      }
    }

    return h;
  }
}

export const zobrist = new Zobrist();

export class TranspositionTable {
  constructor(size = 131072) {
    this.size = size;
    this.keys = new Uint32Array(size);
    this.depths = new Int8Array(size);
    this.scores = new Int32Array(size);
    this.flags = new Uint8Array(size); // 0: EXACT, 1: LOWERBOUND (alpha), 2: UPPERBOUND (beta)
    this.bestMoves = new Array(size);
  }

  clear() {
    this.keys.fill(0);
    this.depths.fill(0);
    this.scores.fill(0);
    this.flags.fill(0);
    this.bestMoves.fill(undefined);
  }

  probe(hashKey, depth, alpha, beta) {
    const idx = hashKey % this.size;
    if (this.keys[idx] === hashKey && this.depths[idx] >= depth) {
      const score = this.scores[idx];
      const flag = this.flags[idx];
      if (flag === 0) return { hit: true, score: score, move: this.bestMoves[idx] };
      if (flag === 1 && score >= beta) return { hit: true, score: score, move: this.bestMoves[idx] };
      if (flag === 2 && score <= alpha) return { hit: true, score: score, move: this.bestMoves[idx] };
    }
    return { hit: false, move: this.keys[idx] === hashKey ? this.bestMoves[idx] : null };
  }

  store(hashKey, depth, score, flag, bestMove) {
    const idx = hashKey % this.size;
    // Replace if deeper or empty or same key
    if (this.keys[idx] === 0 || this.depths[idx] <= depth || this.keys[idx] === hashKey) {
      this.keys[idx] = hashKey;
      this.depths[idx] = depth;
      this.scores[idx] = score;
      this.flags[idx] = flag;
      if (bestMove) {
        this.bestMoves[idx] = bestMove;
      }
    }
  }
}

export const transpositionTable = new TranspositionTable(131072);
