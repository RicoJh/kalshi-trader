import { NextRequest, NextResponse } from 'next/server';
import { getSettingsCookie } from "@/app/actions";
import { runBotCycle } from "@/lib/bot/engine";

export async function POST(req: NextRequest) {
    // Security: Check for a secret header if public, or rely on Authentication
    // For MVP interactive demo, we allow calling from the UI with the cookie present.

    const settings = await getSettingsCookie();
    if (!settings || !settings.keyId) {
        return NextResponse.json({ error: "Context not found" }, { status: 401 });
    }

    // Default bot config
    const defaultBotConfig = {
        pollInterval: 60,
        minEdge: 10,
        maxShares: 10,
        maxDailyLoss: 10,
    };

    const result = await runBotCycle(
        settings.keyId,
        settings.privateKey,
        settings.isDemo,
        settings.botConfig || defaultBotConfig
    );

    return NextResponse.json(result);
}
