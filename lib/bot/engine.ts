import { KalshiClient } from "@/lib/kalshi/api";
import { getCryptoPrices } from "@/lib/coingecko/client";

/**
 * SOLUS ENGINE V5.7.4 - "VIGILANT GUARD: OPTIMIZED"
 * Comprehensive code review and bug-fix release.
 * Synchronized action throttling and multi-timeframe trend consistency.
 */

const TRADING_SERIES = ['KXBTC', 'KXETH', 'KXBTC15M', 'KXETH15M', 'KXBTCD', 'KXETHD', 'BVOL'];

function getWinningSide(market: any, spotPrice: number, rsi: number, trend: 'up' | 'down' | 'flat'): 'yes' | 'no' | null {
    const combined = (market.title + ' ' + (market.subtitle || '')).toLowerCase();
    let side: 'yes' | 'no' | null = null;

    // 1. Range Logic ($X to $Y or between $X and $Y)
    const rangeMatch = combined.match(/\$([0-9,.]+)\s*to\s*\$?([0-9,.]+)/);
    const betweenMatch = combined.match(/between\s*\$([0-9,.]+)\s*and\s*\$?([0-9,.]+)/);

    if (rangeMatch || betweenMatch) {
        const match = rangeMatch || betweenMatch;
        const low = parseFloat(match![1].replace(/,/g, ''));
        const high = parseFloat(match![2].replace(/,/g, ''));
        side = (spotPrice >= low && spotPrice <= high) ? 'yes' : 'no';
    } else {
        // 2. Above/Below Logic
        const aboveMatch = combined.match(/\$([0-9,.]+)\s*(?:above|higher|or more|at or above)/) || combined.match(/(?:above|higher|at or above)\s*\$([0-9,.]+)/);
        if (aboveMatch) {
            const thresh = parseFloat((aboveMatch[1] || aboveMatch[2]).replace(/,/g, ''));
            side = spotPrice >= thresh ? 'yes' : 'no';
        } else {
            const belowMatch = combined.match(/\$([0-9,.]+)\s*(?:below|lower|or less|at or below)/) || combined.match(/(?:below|lower|at or below)\s*\$([0-9,.]+)/);
            if (belowMatch) {
                const thresh = parseFloat((belowMatch[1] || belowMatch[2]).replace(/,/g, ''));
                side = spotPrice <= thresh ? 'yes' : 'no';
            }
        }
    }

    if (!side) return null;

    // 3. VIGILANT FILTERS

    // Filter A: Trend Fighting Protection
    if (side === 'yes' && trend === 'down') return null;
    if (side === 'no' && trend === 'up') return null;

    // Filter B: RSI Exhaustion Discipline
    if (side === 'yes' && rsi > 68) return null;
    if (side === 'no' && rsi < 32) return null;

    return side;
}

function calculateSafeSize(balanceCents: number, priceCents: number, edge: number): number {
    const p = (priceCents + edge) / 100;
    const q = 1 - p;
    const b = (100 - priceCents) / priceCents;
    const f = (p * b - q) / b;

    const riskFactor = Math.max(0, Math.min(f, 0.08));
    const targetCents = balanceCents * riskFactor;
    return Math.max(1, Math.floor(targetCents / priceCents));
}

async function placeBotOrder(client: KalshiClient, market: any, side: 'yes' | 'no', count: number, price: number, logs: string[]) {
    logs.push(`🛡️ VIGILANT: ${market.ticker} [${side.toUpperCase()}] @ ${price}¢ Qty:${count}`);
    try {
        const orderParams: any = {
            ticker: market.ticker,
            action: 'buy',
            type: 'limit',
            side: side,
            count: count
        };
        if (side === 'yes') orderParams.yes_price = price;
        else orderParams.no_price = price;

        await client.placeOrder(orderParams);
        logs.push(`>>> CONFIRMED: Strike transmitted.`);
        return true;
    } catch (e: any) {
        if (e.message.toLowerCase().includes('balance')) {
            logs.push(`⚠️ MARGIN LOCK: Account fully deployed.`);
            return 'STOP';
        }
        logs.push(`❌ FAILED: ${e.message}`);
        return false;
    }
}

export async function runBotCycle(
    keyId: string,
    privateKey: string,
    isDemo: boolean,
    config: { minEdge: number, maxShares: number }
) {
    const client = new KalshiClient(keyId, privateKey, isDemo);
    const logs: string[] = [];
    let actionsTaken = 0;
    const MAX_ACTIONS = 2; // Synchronized throttle limit

    try {
        logs.push(`Solus v5.7.4 Vigilant Online.`);

        const [marketRes, snapshot] = await Promise.all([
            client.getBalance(),
            getCryptoPrices()
        ]);

        let balanceCents = marketRes.balance;
        const btcRSI = snapshot.btc_rsi || 50;
        const btcTrend = snapshot.btc_trend || 'flat';
        const ethRSI = snapshot.eth_rsi || 50;
        const ethTrend = snapshot.eth_trend || 'flat';

        logs.push(`Sync: $${(balanceCents / 100).toFixed(2)} | Trend: ${btcTrend.toUpperCase()} | RSI: ${btcRSI.toFixed(0)}`);

        // 2. Clear stale state
        try {
            const ordersRes = await client.getOrders({ status: 'open' });
            for (const order of (ordersRes.orders || [])) {
                await client.cancelOrder(order.order_id);
            }
        } catch (e) { }

        // 3. Scan & Filter
        let allMarkets: any[] = [];
        const seriesCounts: Record<string, number> = {};
        for (const series of TRADING_SERIES) {
            try {
                const res: any = await client.getMarkets({ series_ticker: series, status: 'open', limit: 50 });
                if (res.markets) {
                    allMarkets = [...allMarkets, ...res.markets];
                    seriesCounts[series] = res.markets.length;
                }
                await new Promise(r => setTimeout(r, 150));
            } catch (e: any) { }
        }

        const uniqueMarkets = Array.from(new Map(allMarkets.map(m => [m.ticker, m])).values());
        const nowMs = Date.now();
        const maxMs = nowMs + 24 * 60 * 60 * 1000; // 24 Hour window to bridge the rollover gap

        const foundSeries = Object.entries(seriesCounts).map(([s, c]) => `${s}:${c}`).join(' | ');
        logs.push(`Horizon: ${foundSeries}`);

        if (uniqueMarkets.length > 0) {
            // Sort by close time to find the NEAREST one for the trace
            const sortedByTime = [...uniqueMarkets].sort((a, b) => new Date(a.close_time).getTime() - new Date(b.close_time).getTime());
            const sample = sortedByTime[0];
            const diffHr = (new Date(sample.close_time).getTime() - nowMs) / (1000 * 60 * 60);
            logs.push(`Temporal Trace: [${sample.ticker}] expires in ${diffHr.toFixed(1)}h`);
        }

        const opportunities: any[] = [];
        let timeFiltered = 0;
        for (const market of uniqueMarkets) {
            const closeMs = new Date(market.close_time).getTime();
            if (closeMs > maxMs) {
                timeFiltered++;
                continue;
            }

            const isEth = market.ticker.includes('ETH');
            const rsi = isEth ? ethRSI : btcRSI;
            const trend = isEth ? ethTrend : btcTrend;
            const spot = isEth ? (snapshot.ethereum?.usd || 0) : (snapshot.bitcoin?.usd || 0);

            if (spot === 0) continue;

            const winner = getWinningSide(market, spot, rsi, trend);
            if (!winner) continue;

            const ask = (winner === 'yes' ? market.yes_ask : market.no_ask) || 99;
            const bid = (winner === 'yes' ? market.yes_bid : market.no_bid) || 0;
            const entryPrice = Math.min(ask, (bid || 0) + 1);

            const convictionThreshold = 100 - config.minEdge;
            if (entryPrice <= convictionThreshold && entryPrice >= 12) {
                opportunities.push({ market, side: winner, cost: entryPrice, edge: config.minEdge, expiry: closeMs });
            }
        }

        logs.push(`Fast Scan: ${opportunities.length} aligned. (Skipped ${timeFiltered} > 24H)`);

        // Sort by expiry AND cost for efficiency
        opportunities.sort((a, b) => (a.expiry - b.expiry) || (a.cost - b.cost));

        for (const opp of opportunities) {
            if (actionsTaken >= MAX_ACTIONS) break;

            const shareQty = calculateSafeSize(balanceCents, opp.cost, opp.edge);
            const totalCost = opp.cost * shareQty;

            if (totalCost > balanceCents) continue;

            await new Promise(r => setTimeout(r, 1200));
            const result = await placeBotOrder(client, opp.market, opp.side, shareQty, opp.cost, logs);

            if (result === 'STOP') break;
            if (result === true) {
                actionsTaken++;
                balanceCents -= totalCost;
            }
        }

        if (actionsTaken === 0 && uniqueMarkets.length > 0) {
            logs.push(`Shield active: No high-conviction trend alignments found.`);
        }

        logs.push(`Cycle done.`);
        return { success: true, logs };

    } catch (e: any) {
        logs.push(`CRITICAL: ${e.message}`);
        return { success: false, logs };
    }
}
