/**
 * Cloudflare Pages Function: /api/victory
 * Automatically persists player victory records to Cloudflare D1 / KV
 * and wipes data upon defeat (Permadeath Leaderboard).
 */

export async function onRequestGet(context) {
  const { env } = context;

  // 1. If Cloudflare D1 Database is bound (binding: DB)
  if (env && env.DB) {
    try {
      const { results } = await env.DB.prepare(
        "SELECT id, nickname, moves_count, pgn, date, streak, difficulty FROM victors ORDER BY streak DESC, moves_count ASC LIMIT 50"
      ).all();
      return new Response(JSON.stringify({ success: true, victors: results || [] }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
    }
  }

  // 2. If Cloudflare KV is bound (binding: CHESS_KV)
  if (env && env.CHESS_KV) {
    try {
      const list = await env.CHESS_KV.get("victors_list", { type: "json" });
      return new Response(JSON.stringify({ success: true, victors: list || [] }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
    }
  }

  // Fallback demo response (Local / Development)
  return new Response(JSON.stringify({
    success: true,
    message: "Cloudflare D1/KV not yet bound. Data saved in browser localStorage.",
    victors: []
  }), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();
    const { id, nickname, movesCount, pgn, date, streak, difficulty } = data;

    if (!nickname || !pgn) {
      return new Response(JSON.stringify({ success: false, error: "Incomplete data" }), { status: 400 });
    }

    // 1. Save to Cloudflare D1 if available
    if (env && env.DB) {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS victors (
          id TEXT PRIMARY KEY,
          nickname TEXT,
          moves_count INTEGER,
          pgn TEXT,
          date TEXT,
          streak INTEGER,
          difficulty TEXT
        )
      `).run();

      await env.DB.prepare(`
        INSERT OR REPLACE INTO victors (id, nickname, moves_count, pgn, date, streak, difficulty)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(id || Date.now().toString(), nickname, movesCount || 0, pgn, date || new Date().toISOString(), streak || 1, difficulty || 'Impossible Mode').run();

      return new Response(JSON.stringify({ success: true, message: "Victory saved in Cloudflare D1" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. Save to Cloudflare KV if available
    if (env && env.CHESS_KV) {
      let list = await env.CHESS_KV.get("victors_list", { type: "json" }) || [];
      const existingIdx = list.findIndex(v => v.nickname === nickname);
      const newEntry = { id: id || Date.now().toString(), nickname, movesCount, pgn, date: date || new Date().toISOString(), streak: streak || 1, difficulty: difficulty || 'Impossible Mode' };
      if (existingIdx >= 0) {
        list[existingIdx] = newEntry;
      } else {
        list.push(newEntry);
      }
      await env.CHESS_KV.put("victors_list", JSON.stringify(list));

      return new Response(JSON.stringify({ success: true, message: "Victory saved in Cloudflare KV" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Victory data received (Ready for Cloudflare D1/KV binding)"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;

  try {
    const { nickname, id } = await request.json();

    // Delete from Cloudflare D1 if present
    if (env && env.DB) {
      if (nickname) {
        await env.DB.prepare("DELETE FROM victors WHERE nickname = ?").bind(nickname).run();
      } else if (id) {
        await env.DB.prepare("DELETE FROM victors WHERE id = ?").bind(id).run();
      }
    }

    // Delete from Cloudflare KV if present
    if (env && env.CHESS_KV) {
      let list = await env.CHESS_KV.get("victors_list", { type: "json" }) || [];
      list = list.filter(v => v.nickname !== nickname && v.id !== id);
      await env.CHESS_KV.put("victors_list", JSON.stringify(list));
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Victory data for ${nickname || id} purged from Cloudflare`
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
