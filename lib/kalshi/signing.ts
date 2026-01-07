import crypto from 'crypto';

/**
 * KALSHI V2 SIGNING PROTOCOL - PSS PRIMARY
 * 
 * Kalshi V2 Production officially requires:
 * 1. Payload: [timestamp][method][path]
 * 2. Algorithm: RSA-SHA256
 * 3. Padding: RSA-PSS
 * 4. Salt Length: 32 (Matches SHA256 digest length)
 */

function wrapKey(base64: string, type: 'RSA PRIVATE KEY' | 'PRIVATE KEY'): string {
    const chunked = base64.match(/.{1,64}/g)?.join('\n') || base64;
    return `-----BEGIN ${type}-----\n${chunked}\n-----END ${type}-----\n`;
}

export function signRequest(
    method: string,
    path: string,
    timestamp: string,
    privateKey: string
): string {
    if (!privateKey || privateKey.length < 32) {
        throw new Error("Private Key is empty. Check Hardware settings.");
    }

    // Canonical payload construction
    const m = method.toUpperCase();
    let p = path.split('?')[0];
    if (!p.startsWith('/trade-api/v2')) {
        p = `/trade-api/v2${p.startsWith('/') ? '' : '/'}${p}`;
    }
    p = p.replace(/\/+/g, '/');
    const payload = `${timestamp}${m}${p}`;

    // Extract raw base64 material
    const base64Only = privateKey
        .replace(/-----BEGIN [A-Z ]+-----/g, '')
        .replace(/-----END [A-Z ]+-----/g, '')
        .replace(/[^A-Za-z0-9+/=]/g, '');

    // Try PKCS#8 first, then PKCS#1
    const pkcs8Key = wrapKey(base64Only, 'PRIVATE KEY');
    const pkcs1Key = wrapKey(base64Only, 'RSA PRIVATE KEY');
    const trialKeys = [pkcs8Key, pkcs1Key];

    for (const keyCandidate of trialKeys) {
        try {
            // KALSHI V2 PRODUCTION STANDARD: RSA-PSS
            return crypto.sign(
                'sha256',
                Buffer.from(payload),
                {
                    key: keyCandidate,
                    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
                    saltLength: 32 // Required for SHA256-PSS
                }
            ).toString('base64');
        } catch (e: any) {
            // If decoder issues occur, try next key format
            if (e.message.includes('DECODER')) continue;

            // Fallback for Demo or Older keys: PKCS#1 v1.5
            try {
                return crypto.sign(
                    'sha256',
                    Buffer.from(payload),
                    {
                        key: keyCandidate,
                        padding: crypto.constants.RSA_PKCS1_PADDING,
                    }
                ).toString('base64');
            } catch (e2: any) {
                // Continue to next key format trial
            }
        }
    }

    throw new Error("Handshake Failed: Cryptographic mismatch. Ensure your Private Key is correct.");
}
