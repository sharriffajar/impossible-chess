/**
 * Impossible Chess - Grandmaster Opening Book
 */

export const openingBook = {
  "": ["e4", "d4", "Nf3", "c4"],
  "e4": ["e5", "c5", "e6", "c6"],
  "e4 e5": ["Nf3", "Bc4", "Nc3"],
  "e4 e5 Nf3": ["Nc6", "Nf6", "d6"],
  "e4 e5 Nf3 Nc6": ["Bc4", "Bb5", "d4", "Nc3"],
  "e4 e5 Nf3 Nc6 Bc4": ["Bc5", "Nf6"],
  "e4 e5 Nf3 Nc6 Bb5": ["a6", "Nf6", "d6"],
  "e4 c5": ["Nf3", "Nc3", "c3"],
  "e4 c5 Nf3": ["d6", "Nc6", "e6"],
  "e4 c5 Nf3 d6": ["d4", "Bb5+"],
  "e4 c5 Nf3 d6 d4": ["cxd4"],
  "e4 c5 Nf3 d6 d4 cxd4": ["Nxd4"],
  "e4 c5 Nf3 d6 d4 cxd4 Nxd4": ["Nf6"],
  "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6": ["Nc3"],
  "e4 e6": ["d4", "d3"],
  "e4 e6 d4": ["d5"],
  "e4 e6 d4 d5": ["Nc3", "Nd2", "e5", "exd5"],
  "e4 c6": ["d4"],
  "e4 c6 d4": ["d5"],
  "e4 c6 d4 d5": ["Nc3", "e5", "exd5"],
  "d4": ["d5", "Nf6", "e6", "f5"],
  "d4 d5": ["c4", "Nf3", "Bf4"],
  "d4 d5 c4": ["e6", "c6", "dxc4"],
  "d4 d5 c4 e6": ["Nc3", "Nf3"],
  "d4 d5 c4 c6": ["Nf3", "Nc3"],
  "d4 Nf6": ["c4", "Nf3"],
  "d4 Nf6 c4": ["e6", "g6"],
  "d4 Nf6 c4 e6": ["Nc3", "Nf3"],
  "d4 Nf6 c4 g6": ["Nc3", "Nf3"],
  "Nf3": ["d5", "Nf6"],
  "c4": ["e5", "c5", "Nf6"]
};

export function getBookMove(chessInstance) {
  const history = chessInstance.history();
  if (history.length <= 12) {
    const pgnHistoryKey = history.join(" ");
    const candidateMoves = openingBook[pgnHistoryKey];
    if (candidateMoves && candidateMoves.length > 0) {
      const legalMoves = chessInstance.moves();
      const validCandidates = candidateMoves.filter(san => legalMoves.includes(san));
      if (validCandidates.length > 0) {
        const selectedSan = validCandidates[Math.floor(Math.random() * validCandidates.length)];
        return chessInstance.move(selectedSan, { sloppy: true });
      }
    }
  }
  return null;
}
