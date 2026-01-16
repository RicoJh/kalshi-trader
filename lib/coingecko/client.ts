export interface CoinGeckoPrice {
    bitcoin?: {
        usd: number;
        usd_24h_change?: number;
    };
    ethereum?: {
        usd: number;
        usd_24h_change?: number;
    };
    btc_rsi?: number;
    eth_rsi?: number;
    btc_trend?: 'up' | 'down' | 'flat';
    eth_trend?: 'up' | 'down' | 'flat';
}

export async function getCryptoPrices(): Promise<CoinGeckoPrice> {
    let btcPrice = 0;
    let ethPrice = 0;
    let btcRsi = 50;
    let ethRsi = 50;
    let btcTrend: 'up' | 'down' | 'flat' = 'flat';
    let ethTrend: 'up' | 'down' | 'flat' = 'flat';

    // 1. Current Spot Prices - Multi-Source Redundancy
    const headers = { 'User-Agent': 'Mozilla/5.0' }; // Prevent 403s
    let source = 'None';

    // Decoupled fetching to prevent Promise.all failures from blocking

    // Attempt 1: Binance (Primary)
    try {
        const btcRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', { cache: 'no-store', headers });
        if (btcRes.ok) {
            btcPrice = parseFloat((await btcRes.json()).price);
            source = 'Binance';
        }
    } catch (e) { }

    // Attempt 2: Mempool.space (Very Open / No Rate Limit)
    if (btcPrice === 0) {
        try {
            const res = await fetch('https://mempool.space/api/v1/prices', { cache: 'no-store', headers });
            if (res.ok) {
                btcPrice = (await res.json()).USD;
                source = 'Mempool';
            }
        } catch (e) { }
    }

    // Attempt 3: Coinbase
    if (btcPrice === 0) {
        try {
            const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', { cache: 'no-store', headers });
            if (res.ok) {
                btcPrice = parseFloat((await res.json()).data.amount);
                source = 'Coinbase';
            }
        } catch (e) { }
    }

    // Attempt 4: Blockchain.info
    if (btcPrice === 0) {
        try {
            const res = await fetch('https://blockchain.info/ticker', { cache: 'no-store', headers });
            if (res.ok) {
                btcPrice = (await res.json()).USD.last;
                source = 'Blockchain';
            }
        } catch (e) { }
    }

    // Attempt 5: Kraken
    if (btcPrice === 0) {
        try {
            const res = await fetch('https://api.kraken.com/0/public/Ticker?pair=XBTUSD', { cache: 'no-store', headers });
            if (res.ok) {
                const data = await res.json();
                btcPrice = parseFloat(data.result?.XXBTZUSD?.c?.[0] || "0");
                source = 'Kraken';
            }
        } catch (e) {
            console.error("All Crypto APIs Failed. Internet?", e);
        }
    }

    // ETH Fetch (Independent)
    try {
        const ethRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT', { cache: 'no-store' });
        if (ethRes.ok) ethPrice = parseFloat((await ethRes.json()).price);
    } catch (e) { }

    // 2. Momentum & Sentiment (RSI/Trend)
    try {
        const [btc5m, eth5m, btc1h, eth1h] = await Promise.all([
            fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=30', { cache: 'no-store' }).then(r => r.json()),
            fetch('https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=5m&limit=30', { cache: 'no-store' }).then(r => r.json()),
            fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=12', { cache: 'no-store' }).then(r => r.json()).catch(() => []),
            fetch('https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1h&limit=12', { cache: 'no-store' }).then(r => r.json()).catch(() => [])
        ]);

        if (Array.isArray(btc1h) && btc1h.length >= 2) {
            btcTrend = detectTrend(btc1h.map((k: any) => parseFloat(k[4])));
        }

        if (Array.isArray(eth1h) && eth1h.length >= 2) {
            ethTrend = detectTrend(eth1h.map((k: any) => parseFloat(k[4])));
        }

        if (Array.isArray(btc5m) && btc5m.length >= 7) {
            btcRsi = calculateRSI(btc5m.map((k: any) => parseFloat(k[4])));
        } else if (Array.isArray(btc1h) && btc1h.length >= 2) {
            btcRsi = btcTrend === 'up' ? 62 : (btcTrend === 'down' ? 38 : 50.2);
        } else if (btcPrice > 0) {
            // HEARTBEAT FALLBACK: Use spot price pulse if all candle streams are dead
            btcRsi = 50.4;
        } else {
            btcRsi = 50.3;
        }

        if (Array.isArray(eth5m) && eth5m.length >= 7) {
            ethRsi = calculateRSI(eth5m.map((k: any) => parseFloat(k[4])));
        } else if (Array.isArray(eth1h) && eth1h.length >= 2) {
            ethRsi = ethTrend === 'up' ? 62 : (ethTrend === 'down' ? 38 : 50.2);
        }

    } catch (e) {
        if (btcPrice > 0) {
            btcRsi = 50.4; // Signal: Delta Fallback Active
            btcTrend = 'flat';
        } else {
            btcRsi = 49.9;
        }
    }

    return {
        bitcoin: { usd: btcPrice || 0 }, // REMOVED 91000 DEFAULT
        ethereum: { usd: ethPrice || 0 },
        btc_rsi: btcRsi,
        eth_rsi: ethRsi,
        btc_trend: btcTrend,
        eth_trend: ethTrend
    };
}

function detectTrend(prices: number[]): 'up' | 'down' | 'flat' {
    if (prices.length < 2) return 'flat';
    const first = prices[0];
    const last = prices[prices.length - 1];
    const change = (last - first) / first;

    // Use a more sensitive 0.1% threshold for short-term strikes
    if (change > 0.001) return 'up';
    if (change < -0.001) return 'down';
    return 'flat';
}

function calculateRSI(prices: number[]): number {
    // Variable-period RSI (Adapts from 7 to 14 periods based on available data)
    const count = prices.length;
    if (count < 8) return 50; // Still need a base minimum for sanity

    const periods = Math.min(count - 1, 14);
    const recentPrices = prices.slice(-(periods + 1));

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= periods; i++) {
        const diff = recentPrices[i] - recentPrices[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }

    if (losses === 0) return 100;

    const rs = (gains / periods) / (losses / periods);
    return 100 - (100 / (1 + rs));
}
