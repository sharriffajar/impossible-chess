/**
 * Impossible Chess - Post-Game Analysis Modal & Centipawn SVG Graph
 */

import { analyzeGameHistory } from '../engine/analysis.js';

export class GameAnalysisView {
  constructor() {
    this.analysisData = null;
  }

  open(chessInstance, playerColor) {
    const modal = document.getElementById('analysis-modal');
    if (!modal) return;

    if (chessInstance.history().length === 0) {
      alert("Play at least one move to generate game analysis.");
      return;
    }

    this.analysisData = analyzeGameHistory(chessInstance, playerColor);
    if (!this.analysisData) return;

    this.renderMetrics();
    this.renderGraph();
    modal.style.display = 'flex';
  }

  close() {
    const modal = document.getElementById('analysis-modal');
    if (modal) modal.style.display = 'none';
  }

  renderMetrics() {
    const { player, ai } = this.analysisData;

    // Accuracy numbers
    const playerAccEl = document.getElementById('analysis-player-acc');
    const aiAccEl = document.getElementById('analysis-ai-acc');
    const playerAcplEl = document.getElementById('analysis-player-acpl');
    const aiAcplEl = document.getElementById('analysis-ai-acpl');

    if (playerAccEl) playerAccEl.innerText = `${player.accuracy}%`;
    if (aiAccEl) aiAccEl.innerText = `${ai.accuracy}%`;
    if (playerAcplEl) playerAcplEl.innerText = `${player.acpl} ACPL`;
    if (aiAcplEl) aiAcplEl.innerText = `${ai.acpl} ACPL`;

    // Move classification table
    const tbody = document.getElementById('analysis-breakdown-tbody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td><span class="badge-move-best">Best (!)</span></td>
          <td style="font-weight:700; color:#4ade80;">${player.counts.best}</td>
          <td style="font-weight:700; color:#4ade80;">${ai.counts.best}</td>
        </tr>
        <tr>
          <td><span class="badge-move-good">Good</span></td>
          <td>${player.counts.good}</td>
          <td>${ai.counts.good}</td>
        </tr>
        <tr>
          <td><span class="badge-move-inaccuracy">Inaccuracy (?!)</span></td>
          <td style="color:#fcd34d;">${player.counts.inaccuracy}</td>
          <td style="color:#fcd34d;">${ai.counts.inaccuracy}</td>
        </tr>
        <tr>
          <td><span class="badge-move-mistake">Mistake (?)</span></td>
          <td style="color:#fb923c;">${player.counts.mistake}</td>
          <td style="color:#fb923c;">${ai.counts.mistake}</td>
        </tr>
        <tr>
          <td><span class="badge-move-blunder">Blunder (??)</span></td>
          <td style="color:#f87171; font-weight:700;">${player.counts.blunder}</td>
          <td style="color:#f87171; font-weight:700;">${ai.counts.blunder}</td>
        </tr>
      `;
    }
  }

  renderGraph() {
    const container = document.getElementById('analysis-graph-container');
    if (!container) return;

    const timeline = this.analysisData.timeline;
    if (!timeline || timeline.length === 0) return;

    const width = 420;
    const height = 120;
    const padding = 10;
    const zeroY = height / 2;

    const maxCp = 600; // clamp max evaluation swing to +/- 6 pawns for clean visual rendering

    const points = timeline.map((cp, idx) => {
      const x = padding + (idx / (timeline.length - 1 || 1)) * (width - padding * 2);
      const clampedCp = Math.max(-maxCp, Math.min(maxCp, cp));
      // White advantage -> above zeroY (lower Y in SVG coordinates); Black advantage -> below zeroY
      const y = zeroY - (clampedCp / maxCp) * (zeroY - padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathD = `M ${points.join(' L ')}`;

    // Area fill path
    const firstX = padding;
    const lastX = width - padding;
    const areaD = `M ${firstX},${zeroY} L ${points.join(' L ')} L ${lastX},${zeroY} Z`;

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:auto; background:#121518; border-radius:6px; border:1px solid #2f353d;">
        <!-- Zero Advantage Centerline -->
        <line x1="${padding}" y1="${zeroY}" x2="${width - padding}" y2="${zeroY}" stroke="#3f4752" stroke-dasharray="3,3" stroke-width="1" />
        
        <!-- Advantage Area Fill -->
        <path d="${areaD}" fill="rgba(46, 130, 83, 0.25)" />
        
        <!-- Evaluation Trend Line -->
        <path d="${pathD}" fill="none" stroke="#4ade80" stroke-width="2" stroke-linejoin="round" />

        <!-- Labels -->
        <text x="${padding + 4}" y="${padding + 10}" fill="#9ba3af" font-size="9" font-family="sans-serif">+Advantage</text>
        <text x="${padding + 4}" y="${height - 6}" fill="#9ba3af" font-size="9" font-family="sans-serif">-Deficit</text>
      </svg>
    `;
  }
}

export const gameAnalysisView = new GameAnalysisView();
