import { signRequest } from './signing';
import { KalshiMarket, KalshiBalance, KalshiPosition } from './types';

/**
 * KALSHI CLIENT V2.2 - "CANONICAL HANDSHAKE"
 */
const LIVE_API = 'https://api.elections.kalshi.com/trade-api/v2';
const DEMO_API = 'https://demo-api.kalshi.co/trade-api/v2';

export class KalshiClient {
    private keyId: string;
    private privateKey: string;
    private baseUrl: string;

    constructor(keyId: string, privateKey: string, isDemo = true) {
        // Deep clean Key ID: Remove anything that isn't a valid UUID/Key character
        this.keyId = keyId.trim().replace(/[^a-zA-Z0-9-]/g, '');
        this.privateKey = privateKey.trim();
        this.baseUrl = isDemo ? DEMO_API : LIVE_API;
    }

    private async request<T>(method: string, path: string, body?: any): Promise<T> {
        const timestamp = Date.now().toString();
        const bodyString = body ? JSON.stringify(body) : '';

        // The path passed here is relative to the base URL (e.g., /portfolio/balance)
        const signature = signRequest(
            method,
            path,
            timestamp,
            this.privateKey
        );

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'KALSHI-ACCESS-KEY': this.keyId,
            'KALSHI-ACCESS-SIGNATURE': signature,
            'KALSHI-ACCESS-TIMESTAMP': timestamp,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        };

        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        const url = `${this.baseUrl}${cleanPath}`;

        try {
            const response = await fetch(url, {
                method,
                headers,
                body: (method === 'GET' || method === 'DELETE') ? undefined : bodyString,
                cache: 'no-store',
                redirect: 'manual' // Prevent redirects from masking 401/403 errors
            });

            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 401) {
                    throw new Error(`401 Unauthorized: INCORRECT_API_KEY_SIGNATURE. Verify that your Key ID and Private Key are from the PRODUCTION environment.`);
                }
                throw new Error(`Kalshi Error ${response.status}: ${errorText}`);
            }

            return response.json();
        } catch (e: any) {
            if (e.message.includes('redirect')) {
                throw new Error(`Connection Error: The server attempted an unauthorized redirect. Check your API endpoint.`);
            }
            throw e;
        }
    }

    async getMarkets(opts: { status?: string, limit?: number, cursor?: string, series_ticker?: string } = {}): Promise<{ markets: KalshiMarket[], cursor?: string }> {
        const query = new URLSearchParams();
        if (opts.status) query.append('status', opts.status);
        if (opts.limit) query.append('limit', opts.limit.toString());
        if (opts.cursor) query.append('cursor', opts.cursor);
        if (opts.series_ticker) query.append('series_ticker', opts.series_ticker);

        const qStr = query.toString();
        return this.request('GET', `/markets${qStr ? '?' + qStr : ''}`);
    }

    async getMarket(ticker: string): Promise<{ market: KalshiMarket }> {
        return this.request('GET', `/markets/${ticker}`);
    }

    async getBalance(): Promise<KalshiBalance> {
        return this.request('GET', '/portfolio/balance');
    }

    async getPositions(): Promise<{ positions: KalshiPosition[] }> {
        return this.request('GET', '/portfolio/positions');
    }

    async getFills(opts: { ticker?: string, limit?: number, cursor?: string } = {}): Promise<{ fills: any[], cursor?: string }> {
        const query = new URLSearchParams();
        if (opts.ticker) query.append('ticker', opts.ticker);
        if (opts.limit) query.append('limit', opts.limit.toString());
        if (opts.cursor) query.append('cursor', opts.cursor);

        const qStr = query.toString();
        return this.request('GET', `/portfolio/fills${qStr ? '?' + qStr : ''}`);
    }

    async getSettlements(opts: { limit?: number, cursor?: string } = {}): Promise<{ settlements: any[], cursor?: string }> {
        const query = new URLSearchParams();
        if (opts.limit) query.append('limit', opts.limit.toString());
        if (opts.cursor) query.append('cursor', opts.cursor);

        const qStr = query.toString();
        return this.request('GET', `/portfolio/settlements${qStr ? '?' + qStr : ''}`);
    }

    async getOrders(opts: { ticker?: string, status?: string } = {}): Promise<{ orders: any[] }> {
        const query = new URLSearchParams();
        if (opts.ticker) query.append('ticker', opts.ticker);
        if (opts.status) query.append('status', opts.status);
        const qStr = query.toString();
        return this.request('GET', `/portfolio/orders${qStr ? '?' + qStr : ''}`);
    }

    async cancelOrder(orderId: string): Promise<any> {
        return this.request('DELETE', `/portfolio/orders/${orderId}`);
    }

    async placeOrder(order: any) {
        if (!order.client_order_id) {
            order.client_order_id = `solus-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
        return this.request('POST', '/portfolio/orders', order);
    }
}
