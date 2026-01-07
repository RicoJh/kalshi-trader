import { supabase } from '../supabase/client';

export interface TradeRecord {
    id?: string;
    ticker: string;
    side: 'yes' | 'no';
    price: number;
    qty: number;
    pnl?: number;
    status: 'open' | 'closed' | 'settled';
    created_at?: string;
}

/**
 * LOGS TRADE TO SUPABASE (OR PERSISTENT LOCAL STORAGE)
 * This allows the Dashboard to build the equity curve and calculate win rate.
 */
export async function logTrade(trade: TradeRecord) {
    if (supabase) {
        try {
            const { error } = await supabase
                .from('trades')
                .insert([trade]);
            if (!error) return;
        } catch (e) { }
    }

    // Fallback: Persistent Memory Log (Mocking Supabase for MVP)
    const existing = localStorage.getItem('solus_historical_trades');
    const trades = existing ? JSON.parse(existing) : [];
    trades.push({ ...trade, id: `T-${Date.now()}`, created_at: new Date().toISOString() });
    localStorage.setItem('solus_historical_trades', JSON.stringify(trades.slice(-500))); // Cap at 500
}

/**
 * FETCHES TRADE HISTORY FOR PERFORMANCE CHARTING
 */
export async function getTradeHistory(): Promise<TradeRecord[]> {
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('trades')
                .select('*')
                .order('created_at', { ascending: false });
            if (!error && data) return data;
        } catch (e) { }
    }

    const existing = localStorage.getItem('solus_historical_trades');
    return existing ? JSON.parse(existing) : [];
}
