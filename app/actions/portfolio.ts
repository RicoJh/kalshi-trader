'use server'

import { getSettingsCookie } from "@/app/actions";
import { KalshiClient } from "@/lib/kalshi/api";

export async function getPortfolioAction() {
    const client = await getClient();
    if (!client) return { error: "No Credentials Found. Check Hardware Settings." };

    try {
        // 1. Fetch balance (Usually very fast)
        const balance = await client.getBalance();

        // 2. SIGNIFICANT COOLDOWN (1 second)
        // This avoids triggering Kalshi's "Multiple Concurrent Requests" firewall
        await new Promise(r => setTimeout(r, 1000));

        // 3. Fetch positions
        const positionsRes = await client.getPositions();
        const activePositions = (positionsRes.positions || []).filter(p => Number(p.count) > 0);

        // 4. Another Cooldown
        await new Promise(r => setTimeout(r, 800));

        // 5. Fetch open orders
        const ordersRes = await client.getOrders({ status: 'open' });

        return {
            balance,
            positions: activePositions,
            orders: ordersRes.orders || []
        };
    } catch (e: any) {
        console.error("[PORTFOLIO ACTION] SYNC ERROR:", e.message);
        return { error: e.message || "Exchange connection interrupted." };
    }
}

async function getClient() {
    const settings = await getSettingsCookie();
    if (!settings || !settings.keyId) return null;
    return new KalshiClient(settings.keyId, settings.privateKey, settings.isDemo);
}
