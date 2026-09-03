/**
 * Impossible Chess - Live Global Victor Ticker Component
 */

import { getStoredVictories, getWinStreak } from '../storage/permadeath.js';

export class GlobalVictorTicker {
  constructor(containerId = 'global-ticker') {
    this.containerId = containerId;
    this.intervalId = null;
    this.victors = [];
  }

  init() {
    this.fetchVictors();
    // Refresh every 45 seconds
    this.intervalId = setInterval(() => this.fetchVictors(), 45000);
  }

  async fetchVictors() {
    try {
      const res = await fetch('/api/victory');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.victors && data.victors.length > 0) {
          this.victors = data.victors;
          this.render();
          return;
        }
      }
    } catch (e) {}

    // Fallback to local victories if offline or API unavailable
    const local = getStoredVictories();
    if (local.length > 0) {
      this.victors = local;
    } else {
      this.victors = [
        { nickname: 'Grandmaster AI', moves_count: 0, streak: 99, difficulty: 'Impossible Mode', date: 'Undefeated' }
      ];
    }
    this.render();
  }

  render() {
    const el = document.getElementById(this.containerId);
    if (!el) return;

    if (this.victors.length === 0) {
      el.innerHTML = `<div class="ticker-content"><span>Live: Defeat Impossible Mode AI to broadcast your victory here.</span></div>`;
      return;
    }

    const itemsHtml = this.victors.map(v => {
      const name = v.nickname || 'Unknown Victor';
      const streak = v.streak || 1;
      const moves = v.moves_count || v.movesCount || 0;
      const badge = v.isPioneer !== false ? 'PIONEER' : 'WIN';
      return `
        <span class="ticker-item">
          <span class="ticker-badge">${badge}</span>
          <strong>${name}</strong>: Streak ${streak} (${moves} moves)
        </span>
      `;
    }).join(' • ');

    el.innerHTML = `
      <div class="ticker-wrap">
        <div class="ticker-label">LIVE FEED</div>
        <div class="ticker-content">
          <div class="ticker-marquee">${itemsHtml} &nbsp;&nbsp;•&nbsp;&nbsp; ${itemsHtml}</div>
        </div>
      </div>
    `;
  }
}

export const globalTicker = new GlobalVictorTicker('global-ticker');
