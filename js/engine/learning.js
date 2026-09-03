/**
 * Impossible Chess - Adaptive Learning & Auto-Refutation Engine
 * 
 * Prevents the AI from ever repeating a losing move sequence.
 * Stores known defeat paths and penalizes branching into identical losing lines.
 */

export class AdaptiveLearning {
  constructor() {
    this.losingSequences = new Set();
    this.loadLearnedLines();
  }

  loadLearnedLines() {
    try {
      const stored = localStorage.getItem('chess_learned_defeats');
      if (stored) {
        const arr = JSON.parse(stored);
        arr.forEach(seq => this.losingSequences.add(seq));
      }
    } catch (e) {}
  }

  saveLearnedLines() {
    try {
      const arr = Array.from(this.losingSequences);
      localStorage.setItem('chess_learned_defeats', JSON.stringify(arr));
    } catch (e) {}
  }

  recordDefeat(chessInstance) {
    const history = chessInstance.history();
    if (history.length === 0) return;

    // Record the full sequence and critical prefix branches
    const fullLine = history.join(' ');
    this.losingSequences.add(fullLine);

    // Also record the key losing branching points (last 4 plies)
    for (let len = Math.max(2, history.length - 4); len <= history.length; len++) {
      this.losingSequences.add(history.slice(0, len).join(' '));
    }

    this.saveLearnedLines();
  }

  isKnownLosingMove(currentHistoryArray, candidateMoveSan) {
    const projectedSequence = [...currentHistoryArray, candidateMoveSan].join(' ');
    return this.losingSequences.has(projectedSequence);
  }

  isDuplicateGameLine(chessInstance, storedVictoriesList) {
    const currentLine = chessInstance.history().join(' ');
    for (let vic of storedVictoriesList) {
      if (vic.historySequence && vic.historySequence === currentLine) {
        return { isDuplicate: true, originalAuthor: vic.nickname, date: vic.date };
      }
      if (vic.pgn) {
        // Fallback compare stripped moves
        const testChess = new Chess();
        if (testChess.load_pgn(vic.pgn)) {
          if (testChess.history().join(' ') === currentLine) {
            return { isDuplicate: true, originalAuthor: vic.nickname, date: vic.date };
          }
        }
      }
    }
    return { isDuplicate: false };
  }
}

export const adaptiveLearning = new AdaptiveLearning();
