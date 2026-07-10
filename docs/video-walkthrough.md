# Demo Video Walkthrough Guide

Record a 1-2 minute screen recording using [OBS Studio](https://obsproject.com/) (free) or [Loom](https://www.loom.com/).

## Video Script (1:30 total)

### 0:00 - 0:15 — Intro
> "Welcome to Wallet Balance Checker — a production-grade Stellar dashboard with Soroban smart contracts. Let me walk through the key features."

Show: Side-by-side code editor + browser

### 0:15 - 0:35 — Connect Screen & Prerequisites
> "On load, you see the connect screen with prerequisites for Freighter wallet, Testnet setup, and Friendbot funding."

Show: Browser at http://localhost:3000 — unconnected state, prerequisites listed

### 0:35 - 0:55 — Contract Tests (31 passing)
> "The project includes two Soroban Rust smart contracts — WalletRegistry and Vault — with inter-contract communication. All 31 unit tests pass."

Show: Terminal running `npm run test:contracts` — 14 + 17 = 31 passed

### 0:55 - 1:10 — E2E Tests (10 passing)
> "The Playwright E2E tests cover the connect screen, responsive layouts at 375px and 768px, and error handling. All 10 pass."

Show: Terminal running `npm run test:e2e` — 10 passed in ~14s

### 1:10 - 1:25 — CI/CD Pipeline
> "The GitHub Actions CI/CD pipeline runs lint, contract tests, build, E2E, and auto-deploys to GitHub Pages on merge to master."

Show: GitHub Actions page — all 5 jobs passing

### 1:25 - 1:30 — Outro
> "Full docs and live demo in the README. Link in description."

## Recording Tips
- Use a 1920x1080 canvas
- Show your face in a small circle overlay (optional)
- Speak clearly at a steady pace
- Use zoom-in effects for small UI elements (OBS has this built-in as "Zoom/Stretch")
- Cursor highlight / click effects help viewers follow along

## After Recording
1. Upload to YouTube (unlisted or public)
2. Copy the video URL
3. Replace `your-video-id` in the README:
   ```
   https://youtu.be/your-video-id
   ```
4. Remove this guide file (optional)
