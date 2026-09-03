/**
 * Impossible Chess - Replay Navigator & PGN Export
 */

export class ReplayController {
  constructor(chessInstance, onStateChangeCallback) {
    this.chess = chessInstance;
    this.replayPly = -1; // -1 means live latest position
    this.onStateChange = onStateChangeCallback;
  }

  getDisplayChess() {
    const fullHistory = this.chess.history({ verbose: true });
    if (this.replayPly === -1 || this.replayPly >= fullHistory.length) {
      return this.chess;
    }
    const displayInstance = new Chess();
    for (let i = 0; i < this.replayPly; i++) {
      displayInstance.move(fullHistory[i]);
    }
    return displayInstance;
  }

  isReviewing() {
    return this.replayPly !== -1 && this.replayPly < this.chess.history().length;
  }

  goToFirst() {
    if (this.chess.history().length === 0) return;
    this.replayPly = 0;
    this.notify();
  }

  goToPrev() {
    const total = this.chess.history().length;
    if (total === 0) return;
    const current = (this.replayPly === -1) ? total : this.replayPly;
    if (current > 0) {
      this.replayPly = current - 1;
      this.notify();
    }
  }

  goToNext() {
    const total = this.chess.history().length;
    if (this.replayPly === -1 || total === 0) return;
    if (this.replayPly + 1 >= total) {
      this.replayPly = -1;
    } else {
      this.replayPly = this.replayPly + 1;
    }
    this.notify();
  }

  goToLast() {
    if (this.replayPly === -1) return;
    this.replayPly = -1;
    this.notify();
  }

  jumpTo(ply) {
    const total = this.chess.history().length;
    if (ply >= total || ply < 0) {
      this.replayPly = -1;
    } else {
      this.replayPly = ply;
    }
    this.notify();
  }

  reset() {
    this.replayPly = -1;
  }

  notify() {
    if (typeof this.onStateChange === 'function') {
      this.onStateChange();
    }
  }

  renderMoveLog(containerEl) {
    if (!containerEl) return;
    const history = this.chess.history();
    if (history.length === 0) {
      containerEl.innerHTML = '<div style="color: var(--text-muted); font-size: 0.8rem;">No moves yet.</div>';
      return;
    }

    const activePly = (this.replayPly === -1) ? history.length : this.replayPly;

    let html = '';
    for (let i = 0; i < history.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const wMove = history[i] || '';
      const bMove = history[i + 1] || '';

      const wActive = (activePly === i + 1) ? ' active-move' : '';
      const bActive = (activePly === i + 2) ? ' active-move' : '';

      html += `
        <div class="move-row">
          <span class="move-num">${moveNum}.</span>
          <span class="move-white">
            ${wMove ? `<span class="move-btn${wActive}" data-ply="${i + 1}">${wMove}</span>` : ''}
          </span>
          <span class="move-black">
            ${bMove ? `<span class="move-btn${bActive}" data-ply="${i + 2}">${bMove}</span>` : ''}
          </span>
        </div>
      `;
    }
    containerEl.innerHTML = html;

    // Attach click listeners to data-ply spans
    containerEl.querySelectorAll('.move-btn').forEach(btn => {
      btn.onclick = () => {
        const ply = parseInt(btn.getAttribute('data-ply'), 10);
        this.jumpTo(ply);
      };
    });

    if (this.replayPly === -1) {
      containerEl.scrollTop = containerEl.scrollHeight;
    }
  }

  updateBanner(bannerEl, bannerTextEl) {
    if (!bannerEl || !bannerTextEl) return;
    const total = this.chess.history().length;

    if (this.replayPly !== -1 && this.replayPly < total) {
      bannerEl.style.display = 'flex';
      if (this.replayPly === 0) {
        bannerTextEl.innerText = `Starting Position [0/${total}]`;
      } else {
        const moveNum = Math.floor((this.replayPly - 1) / 2) + 1;
        const isWhite = ((this.replayPly - 1) % 2 === 0);
        bannerTextEl.innerText = `Viewing Move ${moveNum}${isWhite ? ' (White)' : ' (Black)'} [${this.replayPly}/${total}]`;
      }
    } else {
      bannerEl.style.display = 'none';
    }
  }

  downloadPGN() {
    const pgnText = this.chess.pgn();
    if (!pgnText) {
      alert("No moves played yet to download.");
      return;
    }
    const blob = new Blob([pgnText], { type: "application/x-chess-pgn" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `impossible_chess_${Date.now()}.pgn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
