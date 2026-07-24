# 🚀 FORMA — Autonomous Executive & Investor Asset Agent

> **OKX AI Hackathon Submission** | *Category 1: Professional Asset Creation*  
> Powered by **OKX Onchain OS**, **x402 Payment Protocol** (X Layer), and **DeepSeek AI**.

![OKX X-Layer](https://img.shields.io/badge/Network-X%20Layer%20Mainnet-blue?style=for-the-badge)
![x402 Protocol](https://img.shields.io/badge/Protocol-x402%20v2%20(EIP--3009)-green?style=for-the-badge)
![DeepSeek AI](https://img.shields.io/badge/AI%20Engine-DeepSeek--V3-purple?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge)

---

## 📌 Overview

**Forma** is an Agent Service Provider (ASP) built for the **OKX AI Marketplace**. It transforms raw ideas, startup concepts, or unorganized founder notes into executive-ready business deliverables in seconds.

Instead of spending days designing pitch decks, drafting investment memos, or writing complex spreadsheet formulas, Web3 founders and developers can prompt **Forma** to instantly generate polished, production-ready files—including PowerPoint decks (`.pptx`), PDF investment memos (`.pdf`), and formula-driven Excel financial models (`.xlsx`).

---

## ⚡ Services & Pricing

Forma implements the **OKX Onchain OS 3-service registration model**, monetization via the **x402 Payment Protocol** in X Layer USDT.

| Service | Endpoint | Fee (x402) | Deliverable | Design & Value Specification |
| :--- | :--- | :--- | :--- | :--- |
| **Investor Pitch Deck** | `POST /api/deck/generate` | **1.00 USDT** | `.pptx` PowerPoint | **Premium Designed Output**: Dark-mode Web3 master slide template, vector graphics, multi-column layouts, and McKinsey/a16z-style structured content. |
| **Tokenomics Model** | `POST /api/deck/financials` | **0.10 USDT** | `.xlsx` Excel | **Active Formulas & Calculations**: Dynamically formatted spreadsheet with active Excel formulas (`=SUM`, `=IF`) modeling vesting cliffs, token distribution, and cap tables. |
| **Executive One-Pager** | `POST /api/deck/onepager` | **0.05 USDT** | `.pdf` Document | **Vector Document Layout**: Clean, single-page investment memo with strict typography (Helvetica/Inter), section dividers, and institutional formatting. |

---

## 🏗️ Architecture & System Design

Forma enforces a strict **Separation of Concerns** between AI content generation and visual file rendering:

```
┌─────────────────┐       1. Prompt       ┌────────────────────────┐       2. Generate JSON       ┌────────────────────────┐
│   OKX Client /  │ ────────────────────► │  Forma Express Backend │ ───────────────────────────► │  DeepSeek AI Engine    │
│   User Agent    │ ◄──────────────────── │   (x402 Middleware)    │ ◄─────────────────────────── │   (deepseek-chat)      │
└─────────────────┘       5. Deliver      └───────────┬────────────┘       3. JSON Blueprint      └────────────────────────┘
                       Binary File                    │
                     (base64 stream)                  ▼
                                          ┌────────────────────────┐
                                          │ File Rendering Engines │
                                          │ pptxgenjs / pdfkit     │
                                          │ exceljs                │
                                          └────────────────────────┘
                                           4. Apply Design Rules &
                                              Active Formulas
```

1. **AI Intelligence Layer (`src/services/ai.ts`)**: DeepSeek generates strict JSON blueprints (slide content, sections, vesting rules, layout hints) with built-in retry mechanisms and high-density prompts.
2. **File Rendering Layer (`src/services/*Engine.ts`)**: Hardcoded TypeScript design templates (`pptxgenjs`, `pdfkit`, `exceljs`) convert the JSON blueprints into native, beautiful binary files. **The code controls the design, the AI controls the content.**
3. **x402 Payment Layer (`src/middleware/x402.ts`)**: Off-chain verification of EIP-712 typed data signatures (`transferWithAuthorization`) for X Layer USDT (`0x779ded0c9e1022225f8e0630b35a9b54be713736`).

---

## 🛠️ Tech Stack

- **Runtime & Language**: Node.js, Express, TypeScript (ES2020)
- **AI Model**: DeepSeek API (`deepseek-chat`) via OpenAI Node SDK
- **Payment Verification**: `ethers.js` (EIP-3009 verification for X Layer USDT)
- **File Engines**:
  - `pptxgenjs` — Native PowerPoint presentation builder
  - `pdfkit` — Vector PDF document generator
  - `exceljs` — Spreadsheet engine with formula calculation support

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ 
- DeepSeek API Key

### 1. Installation & Environment Setup
Clone the repository and install dependencies:
```bash
git clone https://github.com/Cryptojigi/forma.git
cd forma
npm install
```

Create a `.env` file in the root directory:
```env
PORT=3002
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

### 2. Run the Development Server
```bash
npm run dev
```
The server will start at `http://localhost:3002`.

---

## 🧪 Testing the API

Forma endpoints return HTTP 402 Payment Required challenges per the OKX x402 specification. For testing purposes, you must provide valid EIP-3009 signatures.

### Generate Investor Pitch Deck (`.pptx`)
```bash
curl -X POST http://localhost:3002/api/deck/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A decentralized lending protocol on X Layer with automated liquidation vaults"}'
```

### Generate Executive One-Pager (`.pdf`)
```bash
curl -X POST http://localhost:3002/api/deck/onepager \
  -H "Content-Type: application/json" \
  -d '{"prompt": "An AI-powered automated yield aggregator on X Layer"}'
```

### Generate Tokenomics Spreadsheet (`.xlsx`)
```bash
curl -X POST http://localhost:3002/api/deck/financials \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Tokenomics for FORMA token with 1,000,000,000 total supply"}'
```

---

## 🌐 OKX ASP Registration & Deployment

### 1. Registering with `onchainos` CLI
Log in and register Forma as an Agent on the OKX Marketplace:
```bash
onchainos login
onchainos agent create --role asp --name "Forma" --description "Autonomous Executive Pitch Deck, PDF Memo & Tokenomics Sheet Generator"
```

Register the 3 services:
1. `Pitch Deck`: `POST https://your-domain.com/api/deck/generate` (1.00 USDT)
2. `Tokenomics Sheet`: `POST https://your-domain.com/api/deck/financials` (0.10 USDT)
3. `Executive Memo`: `POST https://your-domain.com/api/deck/onepager` (0.05 USDT)

### 2. Running the A2A Daemon
To ensure Forma stays **Online** on the OKX marketplace 24/7, deploy `@okxweb3/a2a-node` to a cloud server:
```bash
npm install -g @okxweb3/a2a-node@latest
okx-a2a doctor --fix
```

---

## 🏆 Hackathon Alignment

- **Category**: Category 1 — Professional Asset Creation
- **Target Prizes**:
  - **Finance Copilot** ($2,500)
  - **Creative Genius** (Up to $10,000)
  - **Software Utility** ($2,500)
  - **Revenue Rocket** (Up to $10,000)

---

## 📜 License

MIT License. Designed and developed for the OKX AI Hackathon.
