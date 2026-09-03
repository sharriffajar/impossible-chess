import { adaptiveLearning } from '../engine/learning.js';

/**
 * Impossible Chess - Permadeath Leaderboard & Cloudflare Sync Storage
 */

export function getPlayerNickname() {
  let name = localStorage.getItem('chess_nickname');
  if (!name || name.trim() === '') {
    name = 'Player_' + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('chess_nickname', name);
  }
  return name;
}

export function setPlayerNickname(newName) {
  if (newName && newName.trim() !== '') {
    localStorage.setItem('chess_nickname', newName.trim());
    return newName.trim();
  }
  return getPlayerNickname();
}

export function getStoredVictories() {
  try {
    const data = localStorage.getItem('chess_victories');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function getWinStreak() {
  return parseInt(localStorage.getItem('chess_streak') || '0', 10);
}

export async function syncVictoryToCloudflare(record) {
  const statusEl = document.getElementById('cf-sync-status');
  if (statusEl) statusEl.innerText = "Cloudflare: Syncing...";
  try {
    const res = await fetch('/api/victory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    if (res.ok) {
      if (statusEl) statusEl.innerText = "Cloudflare: Synced";
    } else {
      if (statusEl) statusEl.innerText = "Cloudflare: Local Mode (Deploy Ready)";
    }
  } catch (e) {
    if (statusEl) statusEl.innerText = "Cloudflare: Saved Locally";
  }
}

export async function deleteVictoryFromCloudflare(nickname) {
  try {
    await fetch('/api/victory', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: nickname })
    });
  } catch (e) {}
}

export function saveVictory(chessInstance, aiDifficulty, customNickname = null) {
  if (customNickname && customNickname.trim() !== '') {
    setPlayerNickname(customNickname.trim());
  }
  const nickname = customNickname && customNickname.trim() !== '' ? customNickname.trim() : getPlayerNickname();
  const streak = getWinStreak() + 1;
  localStorage.setItem('chess_streak', streak.toString());

  const victories = getStoredVictories();
  const duplicateCheck = adaptiveLearning.isDuplicateGameLine(chessInstance, victories);
  const currentSeq = chessInstance.history().join(' ');

  const newRecord = {
    id: 'vic_' + Date.now(),
    nickname: nickname,
    movesCount: chessInstance.history().length,
    historySequence: currentSeq,
    pgn: chessInstance.pgn(),
    date: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    streak: streak,
    difficulty: aiDifficulty === 4 ? "Impossible Mode" : "Regular Mode",
    isPioneer: !duplicateCheck.isDuplicate,
    noveltyNote: duplicateCheck.isDuplicate
      ? `Replay Line (First solved by ${duplicateCheck.originalAuthor})`
      : 'Pioneer Novelty (New Winning Line)'
  };

  // Teach the AI never to repeat this losing branch again!
  adaptiveLearning.recordDefeat(chessInstance);

  victories.unshift(newRecord);
  localStorage.setItem('chess_victories', JSON.stringify(victories));

  syncVictoryToCloudflare(newRecord);
  return newRecord;
}

export function updateVictoryNickname(recordId, newNickname) {
  if (!newNickname || newNickname.trim() === '') return null;
  const cleanName = setPlayerNickname(newNickname.trim());
  const victories = getStoredVictories();
  const target = victories.find(v => v.id === recordId) || victories[0];

  if (target) {
    target.nickname = cleanName;
    localStorage.setItem('chess_victories', JSON.stringify(victories));
    syncVictoryToCloudflare(target);
    return target;
  }
  return null;
}

export function purgeOnLoss(nickname) {
  const prevStreak = getWinStreak();
  const prevVictories = getStoredVictories();

  localStorage.setItem('chess_streak', '0');
  localStorage.removeItem('chess_victories');

  deleteVictoryFromCloudflare(nickname);
  return { hadPreviousRecords: prevVictories.length > 0 || prevStreak > 0 };
}
