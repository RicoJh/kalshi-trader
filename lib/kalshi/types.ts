export interface KalshiMarket {
    ticker: string;
    event_ticker: string;
    subtitle: string;
    title: string;
    open_time: string;
    close_time: string;
    expiration_time: string;
    status: 'open' | 'closed' | 'settled';
    yes_bid: number;
    yes_ask: number;
    no_bid: number;
    no_ask: number;
    last_price: number;
    volume: number;
    open_interest: number;
    liquidity: number;
    category: string;
}

export interface KalshiOrderBook {
    bids: [number, number][]; // [price, count]
    asks: [number, number][];
}

export interface KalshiPosition {
    ticker: string;
    market_ticker: string;
    side: 'yes' | 'no';
    count: number;
    avg_price_cnt: number; // average price in cents
    current_price: number;
    realized_pnl: number;
    unrealized_pnl: number;
}

export interface KalshiBalance {
    balance: number; // in cents
    available_balance: number;
}

export type TradeAction = 'buy' | 'sell';
export type TradeSide = 'yes' | 'no';
export type OrderType = 'limit' | 'market';
