# Tasks Checklist - Polymarket Visual & Layout Overhaul

## Phase 1: Seed Rich Mock Data
- [x] Add rich seed data in `seed.js` for categories: `Iran`, `Sports`, `Politics`, `Weather`, `Technology`, `Crypto`
- [x] Temporarily stop backend server task
- [x] Run `npm run db:seed` to update SQLite dev.db
- [x] Start backend server task

## Phase 2: Premium Header Navbar Redesign
- [x] Redesign `Navbar.jsx` with logo, centered search, and right stacked Portfolio/Cash display
- [x] Add bright blue Deposit button (acts as faucet grant trigger)
- [x] Add gift & bell icons
- [x] Implement user profile gradient avatar dropdown (links to Dashboard, Portfolio, Wallet, Leaderboard, Admin, Logout)
- [x] Link search state with navigation query routing

## Phase 3: Category Ribbon & Dynamic Sidebar
- [x] Redesign category ribbon on `/markets` with icons (Trending flame, World Cup soccer ball/trophy) and full-width styling
- [x] Add dynamic left sidebar title and category-specific sub-topics list (Iran Ceasefire, U.S. x Iran, Strait of Hormuz, etc.)
- [x] Filter markets in `Markets.jsx` dynamically when a sub-topic is clicked

## Phase 4: Market Cards Redesign
- [x] Re-style `MarketCard.jsx` standard YES/NO card layout (square icon, title, circular odds chance on right, wide side-by-side green/red buttons, footer)
- [x] Re-style multi-outcome card layout (title, list of target sub-market rows, inline YES/NO action pills, odds percentage in middle, footer)
- [x] Ensure USD/INR currency conversions apply correctly across all cards and buttons

## Phase 5: Verification & Polishing
- [x] Verify frontend build completes without errors
- [x] Verify hot-reloading and navigation filters function
- [x] Verify USD/INR conversion rate calculates correctly in the new UI layouts

## Phase 6: Trade Notification & Rapid Market Navigation
- [x] Replace static bell with detailed buy/sell activities dropdown (showing side, status, timestamp, qty, price, total costs)
- [x] Clear notification dropdown state automatically upon user logout
- [x] Add dynamic rapid rounds selectors to fetch past 12 rapid round statuses and outcomes
- [x] Enable navigation to past rounds for outcome inspection while disabling active trading
- [x] Implement WebSocket automatic transitions to the next rapid round upon active round resolution
- [x] Add 'Go to Live Market' action button inside the Price Chart card to switch back to the active round
- [x] Align rapid round start and end times to clean 5-minute boundaries of the wall clock
- [x] Create `stripe.js` route handler:
  - Create checkout session endpoint `POST /api/payment/create-checkout-session`
  - Create verification endpoint `GET /api/payment/verify-session/:sessionId`
- [x] Register new route inside `server.js`

## Phase 7: Instant Trading Fills
- [x] Modify `matchingEngine.js` to match remaining unfilled order quantity against the system Market Maker account at the outcome's current price
- [x] Verify that trades are recorded, user balances are updated, and positions are generated immediately
- [x] Calculate dynamic odds (probability prices) for rapid markets based on BTC ticker target distance
- [x] Configure liquidity bot to place active buy/sell limit orders for rapid markets (Up/Down outcomes)
- [x] Integrate real-time portfolio updates inside tradesUpdate socket handler to refresh owned shares count immediately
- [x] Refactor dynamic odds updates to use lightweight updateRapidPrices action to prevent unmounting/loading flashes
- [x] Refactor order flow to prevent locking/debiting cash balance at placement, moving debit to fill execution
- [x] Integrate TradingView Lightweight Charts for rapid BTC markets, streaming real-time candlestick data from Binance WebSocket
- [x] Optimize mock chart data generation to prevent browser tab freezes on older standard markets
- [x] Add TradingView chart container resets and exact time range boundaries loading for historical rounds











