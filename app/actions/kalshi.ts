'use server'

import { getSettingsCookie } from "@/app/actions";
import { KalshiClient } from "@/lib/kalshi/api";
import { KalshiMarket } from "@/lib/kalshi/types";

async function getClient() {
    const settings = await getSettingsCookie();
    if (!settings || !settings.keyId) return null;
    return new KalshiClient(settings.keyId, settings.privateKey, settings.isDemo);
}

export async function getMarketsAction() {
    const client = await getClient();
    if (!client) {
        return { error: "No API Keys found. Please configure them in Settings." };
    }

    try {
        const allMarkets: KalshiMarket[] = [];
        let cursor: string | undefined = undefined;

        // Fetch KXBTC series markets - reduced to single page of 50 for stability
        const response = await client.getMarkets({
            series_ticker: 'KXBTC',
            status: 'open',
            limit: 50,
            cursor
        });

        const pageMarkets = response.markets || [];
        allMarkets.push(...pageMarkets);

        // Also fetch KXETH for broader insights
        await new Promise(r => setTimeout(r, 500)); // Delay to prevent burst rate limit
        const ethResponse = await client.getMarkets({
            series_ticker: 'KXETH',
            status: 'open',
            limit: 50
        });
        if (ethResponse.markets) allMarkets.push(...ethResponse.markets);

        return { markets: allMarkets };
    } catch (e: any) {
        console.error("[GET MARKETS ACTION] ERROR:", e.message);
        return { error: e.message || "Failed to fetch crypto markets." };
    }
}

export async function placeOrderAction(order: any) {
    const client = await getClient();
    if (!client) return { error: "No Credentials" };
    try {
        const res = await client.placeOrder(order);
        return { success: true, daa: res };
    } catch (e: any) {
        return { error: e.message || "Order transmission failed." };
    }
}

export async function getUserBalanceAction() {
    const client = await getClient();
    if (!client) return { error: "No Credentials" };
    try {
        const balance = await client.getBalance();
        return { balance };
    } catch (e: any) {
        return { error: e.message || "Balance sync failed." };
    }
}

export async function getFillsAction() {
    const client = await getClient();
    if (!client) return { error: "No Credentials" };
    try {
        const response = await client.getFills({ limit: 40 });
        return { fills: response.fills };
    } catch (e: any) {
        return { error: e.message || "Ledger retrieval failed." };
    }
}

export async function getSettlementsAction() {
    const client = await getClient();
    if (!client) return { error: "No Credentials" };
    try {
        const response = await client.getSettlements({ limit: 40 });
        return { settlements: response.settlements };
    } catch (e: any) {
        return { error: e.message || "Settlements retrieval failed." };
    }
}
