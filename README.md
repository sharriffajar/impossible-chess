# ♟️ Impossible Chess

An ultra-hard, high-performance browser chess AI with **Self-Evolving Adaptive Learning**, **Zobrist Transposition Tables**, **Quiescence Search**, and **Global Permadeath Leaderboard**.

Developed by **[Sharrif Fajar](https://sharriffajar.pages.dev)**.

---

## 🌟 Key Features

- **Self-Evolving Adaptive Defense**: The engine permanently records defeat sequences and penalizes known losing lines (`-1,000,000` sort weight), ensuring it cannot be defeated with the same line twice.
- **Strict Pioneer Line Detection**: Distinguishes between unique winning discoveries (`Pioneer`) and duplicate line replays (`Replay`), preventing leaderboard farming.
- **Custom Victory Nickname Registration**: Players can register and customize their Hall of Fame nickname upon winning.
- **Post-Game Accuracy & Blunder Analysis**: Generates centipawn evaluation trend graphs (SVG), Average Centipawn Loss (ACPL), and classifies moves (`Best !`, `Good`, `Inaccuracy ?!`, `Mistake ?`, `Blunder ??`).
- **Live Global Victor Ticker**: Real-time streaming banner displaying active global win streaks and pioneer records from Cloudflare D1.
- **Progressive Web App (PWA) & 100% Offline Gameplay**: Installable on Android, iOS, Windows, and macOS with Service Worker caching.
- **Permadeath Leaderboard**: Losing wipes your local victory records and resets your win streak to zero.

---

## 🏗️ Architecture & Modules

```
impossible-chess/
├── css/
│   ├── styles.css              # Main design system, controls, modals, ticker
│   └── board.css               # Chessboard grid, eval bar, timer, SAN log
├── js/
│   ├── config.js               # Piece values, unicode symbols, PST tables
│   ├── audio.js                # Web Audio API synthesizer
│   ├── engine/
│   │   ├── zobrist.js          # Zobrist 32-bit hashing & Transposition Table
│   │   ├── eval.js             # Static evaluation, king safety, pawn structure
│   │   ├── book.js             # Grandmaster opening book tree
│   │   ├── search.js           # Minimax, Quiescence, Iterative Deepening
│   │   ├── learning.js         # Adaptive defeat memory & novelty detection
│   │   └── analysis.js         # ACPL, accuracy score & move classification
│   ├── storage/
│   │   └── permadeath.js       # LocalStorage & Cloudflare D1 synchronization
│   ├── ui/
│   │   ├── board.js            # Chessboard DOM renderer
│   │   ├── evalbar.js          # Dynamic centipawn evaluation bar
│   │   ├── replay.js           # Move history SAN log & PGN export
│   │   ├── analysis_view.js    # Post-game analysis modal & SVG chart
│   │   └── ticker.js           # Live global victor feed
│   ├── app.js                  # Main ES module entry point
│   └── bundle.js               # Universal standalone bundle for both file:// and http://
├── functions/
│   └── api/
│       ├── victory.js          # Cloudflare Pages D1 Victory API
│       └── purge.js            # Cloudflare Pages D1 Permadeath Purge API
├── index.html                  # Semantic, SEO/GEO-optimized frontend shell
├── test_suite.html             # 16 Automated TDD Unit Tests & Benchmarks
├── manifest.webmanifest        # PWA Web App Manifest
├── sw.js                       # Offline Cache Service Worker
├── robots.txt                  # Search engine & AI crawler directive
├── sitemap.xml                 # XML Sitemap
├── llms.txt                    # Generative Engine Optimization manifest
├── schema.sql                  # Cloudflare D1 Database schema
└── wrangler.toml               # Cloudflare Pages configuration
```

---

## 🚀 Deployment

### Cloudflare Pages
1. Connect this repository to **Cloudflare Pages**.
2. Create a D1 Database named `impossible_chess_db` and execute `schema.sql`.
3. Bind the D1 database to `DB` in your Cloudflare Pages project settings.
4. Deploy with build output directory `/` (root).

---

## 🧪 Automated Testing

Open `test_suite.html` in your browser to run the **16-step automated test suite**:
- Suite 1: Zobrist Hashing & Transposition Table
- Suite 2: Positional Evaluation & King Safety
- Suite 3: Tactical Puzzle & Search Engine
- Suite 4: Adaptive Refutation & Duplicate Detection
- Suite 5: Post-Game Accuracy & Blunder Analysis

---

## 👤 Author

**Sharrif Fajar**
- Portfolio: [https://sharriffajar.pages.dev](https://sharriffajar.pages.dev)
