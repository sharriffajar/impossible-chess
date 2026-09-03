/**
 * Impossible Chess - Board UI Renderer & DOM Interaction
 */

import { pieceSymbols } from '../config.js';

export class BoardRenderer {
  constructor(boardContainerEl, onSquareClickCallback) {
    this.boardEl = boardContainerEl;
    this.onSquareClick = onSquareClickCallback;
  }

  render(displayChess, isBoardFlipped, selectedSquare, legalMovesForSelected, lastMove) {
    if (!this.boardEl) {
      this.boardEl = document.getElementById('board');
    }
    if (!this.boardEl) return;
    this.boardEl.innerHTML = '';

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

        if (selectedSquare === squareName) {
          squareDiv.classList.add('selected');
        }
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

        squareDiv.onclick = () => {
          if (typeof this.onSquareClick === 'function') {
            this.onSquareClick(squareName);
          }
        };

        this.boardEl.appendChild(squareDiv);
      }
    }
  }

  showPromotionModal(playerColor, onSelectCallback) {
    const promoOptions = document.getElementById('promo-options');
    const modal = document.getElementById('promotion-modal');
    promoOptions.innerHTML = '';

    const choices = ['q', 'r', 'b', 'n'];
    choices.forEach(type => {
      const btn = document.createElement('div');
      btn.className = 'promo-btn';
      const symKey = playerColor === 'w' ? type.toUpperCase() : type;
      btn.innerHTML = `<span class="${playerColor === 'w' ? 'piece-white' : 'piece-black'}">${pieceSymbols[symKey]}</span>`;
      btn.onclick = () => {
        modal.style.display = 'none';
        if (typeof onSelectCallback === 'function') {
          onSelectCallback(type);
        }
      };
      promoOptions.appendChild(btn);
    });

    modal.style.display = 'flex';
  }
}
