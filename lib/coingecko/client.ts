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

    // 1. Current Spot Prices
    try {
        const [btcRes, ethRes] = await Promise.all([
            fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', { cache: 'no-store' }),
            fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT', { cache: 'no-store' })
        ]);
        if (btcRes.ok) btcPrice = parseFloat((await btcRes.json()).price);
        if (ethRes.ok) ethPrice = parseFloat((await ethRes.json()).price);
    } catch (e) {
        try {
            const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', { cache: 'no-store' });
            if (res.ok) btcPrice = parseFloat((await res.json()).data.amount);
        } catch (e2) { }
    }

    // 2. Momentum & Sentiment (RSI/Trend)
    try {
        const [btc5m, eth5m, btc1h, eth1h] = await Promise.all([
            fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=25', { cache: 'no-store' }).then(r => r.json()),
            fetch('https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=5m&limit=25', { cache: 'no-store' }).then(r => r.json()),
            fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=10', { cache: 'no-store' }).then(r => r.json()).catch(() => []),
            fetch('https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1h&limit=10', { cache: 'no-store' }).then(r => r.json()).catch(() => [])
        ]);

        if (Array.isArray(btc5m) && btc5m.length >= 15) btcRsi = calculateRSI(btc5m.map((k: any) => parseFloat(k[4])));
        if (Array.isArray(eth5m) && eth5m.length >= 15) ethRsi = calculateRSI(eth5m.map((k: any) => parseFloat(k[4])));
        if (Array.isArray(btc1h) && btc1h.length >= 3) btcTrend = detectTrend(btc1h.map((k: any) => parseFloat(k[4])));
        if (Array.isArray(eth1h) && eth1h.length >= 3) ethTrend = detectTrend(eth1h.map((k: any) => parseFloat(k[4])));

    } catch (e) {
        btcRsi = 49; // Signal error state
    }

    return {
        bitcoin: { usd: btcPrice || 91000 },
        ethereum: { usd: ethPrice || 2400 },
        btc_rsi: btcRsi,
        eth_rsi: ethRsi,
        btc_trend: btcTrend,
        eth_trend: ethTrend
    };
}

function detectTrend(prices: number[]): 'up' | 'down' | 'flat' {
    if (prices.length < 3) return 'flat';
    const first = prices[0];
    const last = prices[prices.length - 1];
    const change = (last - first) / first;

    if (change > 0.002) return 'up';   // +0.2% trend
    if (change < -0.002) return 'down'; // -0.2% trend
    return 'flat';
}

function calculateRSI(prices: number[]): number {
    // We use the LAST 15 elements to ensure we get the most recent momentum
    const recentPrices = prices.slice(-15);
    if (recentPrices.length < 15) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i < 15; i++) {
        const diff = recentPrices[i] - recentPrices[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }

    if (losses === 0) return 100;

    const rs = (gains / 14) / (losses / 14);
    return 100 - (100 / (1 + rs));
}
