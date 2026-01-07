# SolusX: Neural Strike Trading Bot

SolusX is a high-frequency, neural-momentum trading bot designed for the **Kalshi V2 API**. It specializes in short-duration crypto markets (15M, Hourly) using RSI sentiment filtering and Kelly Criterion risk management.

## 🌌 Features

- **Neural Sentiment Engine**: Analyzes 5-minute RSI and 1-hour macro trends to prevent "fighting the tape."
- **Hyper-Velocity Scanning**: Specifically targets markets expiring within 2 hours for rapid capital rotation.
- **Vigilant Risk Shield**: Implements fractional Kelly sizing to protect account balance during volatility.
- **Cyberpunk Terminal UI**: Real-time encrypted ledger and performance tracking.

## 🛡️ Security & Privacy

**SolusX is designed with security-first architecture:**

- **Zero Hardcoded Secrets**: Your Kalshi API Key ID and Private Key are **never** stored in the source code.
- **HTTP-Only Cookie Storage**: Credentials are encrypted/stored in your browser's secure session cookies, meaning they are never sent to GitHub or any third-party server.
- **Git-Safe**: The `.gitignore` is pre-configured to block `.env` files, `.pem` keys, and build artifacts.

## 🚀 Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/kalshi-trader.git
   cd kalshi-trader
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Initialize Solus:**
   Go to the **Hardware (Settings)** tab in the dashboard and paste your Kalshi V2 Production keys.

## ⚖️ Disclaimer

Trading in prediction markets involves significant risk. SolusX is a tool for statistical analysis and automated execution; it does not guarantee profits. Never trade with capital you cannot afford to lose.
