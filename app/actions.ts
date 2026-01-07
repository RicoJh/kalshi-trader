'use server'

import { cookies } from 'next/headers'

export async function setSettingsCookie(data: {
    keyId: string;
    privateKey: string;
    isDemo: boolean;
    botConfig?: {
        pollInterval: number;
        minEdge: number;
        maxShares: number;
        maxDailyLoss: number;
    };
}) {
    const cookieStore = cookies()
    // In a real app, encrypt these values. For this MVP/Demo, we store as JSON string.
    // CRITICAL: We should be careful about size limits (4KB). Private keys are large (~1.7KB).
    // It fits, but barely.

    cookieStore.set('kalshi_settings', JSON.stringify(data), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 days
    })
}

export async function getSettingsCookie() {
    const cookieStore = cookies()
    const val = cookieStore.get('kalshi_settings')?.value
    if (!val) return null;
    try {
        return JSON.parse(val);
    } catch {
        return null;
    }
}

export async function clearSettingsCookie() {
    cookies().delete('kalshi_settings')
}
