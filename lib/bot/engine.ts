import { KalshiClient } from "@/lib/kalshi/api";
import { getCryptoPrices } from "@/lib/coingecko/client";
import { logTrade } from "@/lib/db/trades";

/**
 * SOLUS ENGINE V6.0 - "SYNTHETIX"
 * High-Frequency Scalping Protocol for Kalshi V2.
 * Features: Fractional Kelly (0.2x), Volatility-Adjusted RSI, Microstructure Guards.
 */

const TRADING_SERIES = ['KXBTC15M'];

interface EngineConfig {
    minEdge: number;
    maxShares: number;
    riskFactor?: number; // 0.1 to 1.0 (default 0.2)
}

/**
 * Determines weighting based on RSI and Trend.
 * Now includes Microstructure checks (spread penalty).
 */
function getWinningSide(market: any, spotPrice: number, rsi: number, trend: 'up' | 'down' | 'flat'): 'yes' | 'no' | null {
    const combined = (market.title + ' ' + (market.subtitle || '')).toLowerCase();
    let side: 'yes' | 'no' | null = null;

    // 1. Core Pattern Matching
    const rangeMatch = combined.match(/\$([0-9,.]+)\s*to\s*\$?([0-9,.]+)/) || combined.match(/between\s*\$([0-9,.]+)\s*and\s*\$?([0-9,.]+)/);
    if (rangeMatch) {
        const low = parseFloat(rangeMatch[1].replace(/,/g, ''));
        const high = parseFloat(rangeMatch[2].replace(/,/g, ''));
        side = (spotPrice >= low && spotPrice <= high) ? 'yes' : 'no';
    } else {
        const aboveMatch = combined.match(/\$([0-9,.]+)\s*(?:above|higher|or more|at or above)/) || combined.match(/(?:above|higher|at or above)\s*\$([0-9,.]+)/);
        if (aboveMatch) {
            const thresh = parseFloat(aboveMatch[1].replace(/,/g, ''));
            side = spotPrice >= thresh ? 'yes' : 'no';
        } else {
            const belowMatch = combined.match(/\$([0-9,.]+)\s*(?:below|lower|or less|at or below)/) || combined.match(/(?:below|lower|at or below)\s*\$([0-9,.]+)/);
            if (belowMatch) {
                const thresh = parseFloat(belowMatch[1].replace(/,/g, ''));
                side = spotPrice <= thresh ? 'yes' : 'no';
            }
        }
    }

    if (!side) return null;

    // 2. High-Frequency Volatility Guards (Expert Layer)

    // Spread Check: If YES_ASK - YES_BID > 10 cents, liquidity is too low for HFT.
    const spread = (market.yes_ask - market.yes_bid);
    if (spread > 12) return null;

    // RSI Momentum Discipline (Optimized for 15M / 1H)
    // If we want YES, we wait for a dip (RSI < 45) during UP trend or 
    // extreme oversold (RSI < 30) during FLAT trend.
    if (side === 'yes') {
        if (trend === 'down') return null;
        if (trend === 'up' && rsi > 65) return null; // Don't chase the peak
        if (trend === 'flat' && rsi > 55) return null;
    } else {
        if (trend === 'up') return null;
        if (trend === 'down' && rsi < 35) return null; // Don't chase the dump
        if (trend === 'flat' && rsi < 45) return null;
    }

    return side;
}

/**
 * FRACTIONAL KELLY CRITERION
 * p = winning probability, b = odds - 1
 * f* = (pb - q) / b
 */
function calculateKellySize(balanceCents: number, priceCents: number, edge: number, riskFactor: number = 0.2): number {
    const p = (priceCents + edge) / 100;
    const q = 1 - p;
    const b = (100 - priceCents) / priceCents;

    const f = (p * b - q) / b;

    // Use fractional Kelly to smooth equity curve
    const adjustedF = Math.max(0, Math.min(f, 0.15)) * riskFactor;
    const targetCents = balanceCents * adjustedF;
    const shares = Math.floor(targetCents / priceCents);

    return Math.max(0, shares);
}

async function placeBotOrder(client: KalshiClient, market: any, side: 'yes' | 'no', count: number, price: number, logs: string[]) {
    // Micro-latency logging
    logs.push(`⚡ EXECUTING: ${market.ticker} [${side.toUpperCase()}] @ ${price}¢ x${count}`);

    try {
        const result = await client.placeOrder({
            ticker: market.ticker,
            action: 'buy',
            type: 'limit',
            side: side,
            count: count,
            [side === 'yes' ? 'yes_price' : 'no_price']: price,
        }) as any;

        // Persistent Ledger Entry
        await logTrade({
            ticker: market.ticker,
            side: side,
            price: price,
            qty: count,
            status: 'open'
        }).catch(() => { }); // Don't block execution if DB fails

        logs.push(`>>> CONFIRMED: Order ${result.order?.order_id || result.order_id} filled/placed.`);
        return true;
    } catch (e: any) {
        logs.push(`❌ REJECTED: ${e.message}`);
        return false;
    }
}

export async function runBotCycle(
    keyId: string,
    privateKey: string,
    isDemo: boolean,
    config: EngineConfig
) {
    const client = new KalshiClient(keyId, privateKey, isDemo);
    const logs: string[] = [];
    let actionsTaken = 0;
    const MAX_ACTIONS = 2;

    try {
        logs.push(`Solus v7.0 Synthetix Engaged.`);

        const [portfolio, crypto, openOrdersRes] = await Promise.all([
            client.getBalance(),
            getCryptoPrices(),
            client.getOrders({ status: 'open' })
        ]);

        let balanceCents = portfolio.available_balance || portfolio.balance;
        const btcRSI = crypto.btc_rsi || 50;
        const btcTrend = crypto.btc_trend || 'flat';
        const openTickers = new Set((openOrdersRes.orders || []).map(o => o.ticker));

        logs.push(`Pulse: $${(balanceCents / 100).toFixed(2)} | RSI: ${btcRSI.toFixed(1)} | Trend: ${btcTrend.toUpperCase()}`);

        // 1. Smart Housekeeping: Cancel orders that are no longer in our 'Optimized window'
        try {
            for (const order of (openOrdersRes.orders || [])) {
                const orderTime = new Date(order.created_time || Date.now()).getTime();
                // If an order has been sitting for more than 5 minutes without filling, recycle it
                if (Date.now() - orderTime > 5 * 60 * 1000) {
                    await client.cancelOrder(order.order_id);
                    openTickers.delete(order.ticker);
                }
            }
        } catch (e) { }

        // 2. Continuous Alpha Discovery
        let allMarkets: any[] = [];
        let seriesHits: Record<string, number> = {};

        const scanPromises = TRADING_SERIES.map(s =>
            client.getMarkets({ series_ticker: s, status: 'open', limit: 30 })
                .then(res => {
                    seriesHits[s] = res.markets?.length || 0;
                    return res;
                })
                .catch(() => ({ markets: [] }))
        );
        const results = await Promise.all(scanPromises);
        results.forEach(res => { if (res.markets) allMarkets.push(...res.markets); });

        const uniqueMarkets = Array.from(new Map(allMarkets.map(m => [m.ticker, m])).values());
        const maxMs = Date.now() + 12 * 60 * 60 * 1000; // STRICT 12H Horizon (No tomorrow morning prep)

        // 3. Identification & Sizing
        const opportunities: any[] = [];
        let filteredCount = { time: 0, spread: 0, logic: 0, edge: 0, size: 0 };

        for (const market of uniqueMarkets) {
            const closeTime = new Date(market.close_time).getTime();
            if (closeTime > maxMs) {
                filteredCount.time++;
                continue;
            }

            const isEth = market.ticker.includes('ETH');
            const rsi = isEth ? (crypto.eth_rsi || 50) : (crypto.btc_rsi || 50);
            const trend = isEth ? (crypto.eth_trend || 'flat') : (crypto.btc_trend || 'flat');
            const spot = isEth ? crypto.ethereum?.usd : crypto.bitcoin?.usd;

            if (!spot) continue;

            // DEDUPLICATION: Don't double-buy
            if (openTickers.has(market.ticker)) continue;

            // Microstructure: Reciprocal Pricing Validation
            // Kalshi orderbooks reciprocal: Yes Ask = 100 - No Bid
            const yesBid = market.yes_bid;
            const noBid = market.no_bid;
            const yesAsk = market.yes_ask || (noBid > 0 ? 100 - noBid : 99);
            const noAsk = market.no_ask || (yesBid > 0 ? 100 - yesBid : 99);

            const spread = (yesAsk - yesBid);
            if (spread > 15) { // Relaxed to 15c
                filteredCount.spread++;
                continue;
            }

            const side = getWinningSide(market, spot, rsi, trend);
            if (!side) {
                // Debug logging for logic rejection
                if (filteredCount.logic < 3) {
                    logs.push(`LogicRej: ${market.ticker} | T:${market.title} | Spot:${spot} | RSI:${rsi.toFixed(1)}`);
                }
                filteredCount.logic++;
                continue;
            }

            const ask = (side === 'yes' ? yesAsk : noAsk);
            const bid = (side === 'yes' ? yesBid : noBid);
            let entryPrice = Math.min(ask, bid + 1);

            // STRATEGY UPGRADE: "The Polymarket Bot" Logic (Latency Arb)
            // If Spot is DEEP ITM (>0.5% away from strike), we treat it as a "Sure Thing".
            // We allow buying up to 98c for these high-certainty trades to scalp the last pennies.
            let isSureThing = false;

            // Extract strike from title for gap calculation
            const aboveMatch = market.title.match(/(?:above|higher|at or above)\s*\$([0-9,.]+)/i);
            if (aboveMatch) {
                const strike = parseFloat(aboveMatch[1].replace(/,/g, ''));
                const gap = (spot - strike) / strike;

                // If we are 'Yes' and spot is >0.2% above strike, it's very safe
                if (side === 'yes' && gap > 0.002) isSureThing = true;
                // If we are 'No' and spot is <0.2% below strike (for a "Below" market?), wait.
                // Actually 'Above' market, 'No' means Spot < Strike. 
                if (side === 'no' && gap < -0.002) isSureThing = true;
            }

            // Standard Edge (e.g. buy < 90c)
            const standardProb = 100 - config.minEdge;
            // Sure Thing Edge (buy < 98c)
            const sureThingLimit = 98;

            const priceLimit = isSureThing ? sureThingLimit : standardProb;

            if (entryPrice <= priceLimit && entryPrice >= 12) {
                let qty = calculateKellySize(balanceCents, entryPrice, isSureThing ? 2 : config.minEdge, config.riskFactor || 0.2);

                if (qty === 0 && balanceCents >= entryPrice) {
                    qty = 1; // Always take at least 1 if we can afford it
                }

                if (isSureThing && qty > 0) logs.push(`💎 ARB SIGHTED: ${market.ticker} is Deep ITM. Paying up to ${priceLimit}¢.`);

                if (qty > 0) {
                    opportunities.push({ market, side, cost: entryPrice, qty, expiry: closeTime });
                } else {
                    filteredCount.size++;
                }
            } else {
                filteredCount.edge++;
            }
        }

        if (opportunities.length === 0 && uniqueMarkets.length > 0) {
            const hitsStr = Object.entries(seriesHits).filter(([_, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join('|');
            const target = uniqueMarkets.find(m => m.ticker.includes('15M'))?.ticker || uniqueMarkets[0]?.ticker;

            if (balanceCents < 15) {
                logs.push(`⚠️ DRY TANK: Balance exhausted ($${(balanceCents / 100).toFixed(2)}). Waiting for settlements.`);
            }

            logs.push(`Radar: Skp ${filteredCount.time} Time | ${filteredCount.spread} Sprd | ${filteredCount.logic} Log | ${filteredCount.edge} Edge | ${filteredCount.size} Size`);
            logs.push(`Target: Found ${hitsStr || 'None'} | Trace: ${target}`);
        } else {
            logs.push(`Synthetix: Found ${opportunities.length} Aligned Patterns.`);
        }

        // 4. Execution (Sorted by Time-to-Profit)
        opportunities.sort((a, b) => a.expiry - b.expiry);

        for (const opp of opportunities) {
            if (actionsTaken >= MAX_ACTIONS) break;

            const success = await placeBotOrder(client, opp.market, opp.side, opp.qty, opp.cost, logs);
            if (success) {
                actionsTaken++;
                balanceCents -= (opp.cost * opp.qty);
            }
            await new Promise(r => setTimeout(r, 800)); // Rate limit buffer
        }

        logs.push(`Cycle done. ${actionsTaken} strikes launched.`);
        return { success: true, logs };

    } catch (e: any) {
        logs.push(`FATAL: ${e.message}`);
        return { success: false, logs };
    }
}
