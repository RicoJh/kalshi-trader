'use server'

import { cookies } from 'next/headers'
import { encryptCredential, decryptCredential } from '@/lib/crypto';

// CRITICAL: In production, this must be an environment variable. 
const MASTER_VAULT_KEY = process.env.MASTER_VAULT_KEY || 'SOLUS-X-MASTER-SYSTEM-KEY-2026';

export async function setSettingsCookie(data: {
    keyId: string;
    privateKey: string;
    isDemo: boolean;
    botConfig?: any;
}) {
    const cookieStore = cookies();
    const rawData = JSON.stringify(data);

    // Encrypt the sensitive payload
    const encrypted = encryptCredential(rawData, MASTER_VAULT_KEY);

    cookieStore.set('kalshi_vault', encrypted, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 days
    })
}

export async function getSettingsCookie() {
    const cookieStore = cookies()
    const encrypted = cookieStore.get('kalshi_vault')?.value
    if (!encrypted) return null;

    try {
        const decrypted = decryptCredential(encrypted, MASTER_VAULT_KEY);
        return JSON.parse(decrypted);
    } catch (e) {
        console.error("Vault Decryption Failed: Corrupted or invalid Master Key.");
        return null;
    }
}

export async function clearSettingsCookie() {
    cookies().delete('kalshi_vault')
}
