'use client'

import { useEffect, useState } from "react"
import { getFillsAction, getSettlementsAction } from "@/app/actions/kalshi"
import { TrendingDown, Target, Zap, Activity } from "lucide-react"

export function StatsCards() {
    const [stats, setStats] = useState({
        wins: 0,
        losses: 0,
        totalFills: 0,
        winRate: 0
    })
    const [syncing, setSyncing] = useState(false)

    useEffect(() => {
        async function calculateStats() {
            setSyncing(true)
            try {
                const [fillsRes, settlementsRes] = await Promise.all([
                    getFillsAction(),
                    getSettlementsAction()
                ]);

                let wins = 0;
                let losses = 0;

                // 1. Process Settlements (Direct Wins/Losses)
                if (settlementsRes.settlements) {
                    settlementsRes.settlements.forEach((s: any) => {
                        // In Kalshi V2, revenue > 0 means the contract expired in the money
                        if (s.revenue > 0) wins++;
                        else losses++;
                    });
                }

                // 2. Process Intra-day Fills (Sold for profit/loss before expiry)
                if (fillsRes.fills) {
                    const fills = fillsRes.fills;
                    const markets: Record<string, any[]> = {};
                    fills.forEach((f: any) => {
                        if (!markets[f.ticker]) markets[f.ticker] = [];
                        markets[f.ticker].push(f);
                    });

                    Object.values(markets).forEach(marketFills => {
                        marketFills.sort((a, b) => a.ts - b.ts);
                        const buys = marketFills.filter(f => f.action === 'buy');
                        const sells = marketFills.filter(f => f.action === 'sell');

                        if (buys.length > 0 && sells.length > 0) {
                            // Simple logic: compare first buy and last sell for profit/loss
                            const buyPrice = buys[0].yes_price || buys[0].no_price || buys[0].fill_price;
                            const sellPrice = sells[sells.length - 1].yes_price || sells[sells.length - 1].no_price || sells[sells.length - 1].fill_price;

                            if (sellPrice > buyPrice) wins++;
                            else if (sellPrice < buyPrice) losses++;
                        }
                    });
                }

                const totalFills = (fillsRes.fills?.length || 0);
                const totalSettled = wins + losses;
                const winRate = totalSettled > 0 ? Math.round((wins / totalSettled) * 100) : 0;

                setStats({ wins, losses, totalFills, winRate });
            } catch (e) {
                console.error("Stats calculation failed", e);
            }
            setTimeout(() => setSyncing(false), 1000)
        }

        calculateStats()
        const interval = setInterval(calculateStats, 8000)
        return () => clearInterval(interval)
    }, [])

    const items = [
        { label: "Wins", value: stats.wins, icon: Target, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
        { label: "Losses", value: stats.losses, icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
        { label: "Win Rate", value: `${stats.winRate}%`, icon: Zap, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
        { label: "Total Fills", value: stats.totalFills, icon: Activity, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
    ]

    return (
        <div className="relative">
            {/* Live Sync Pulse */}
            <div className="absolute -top-6 right-2 flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${syncing ? 'bg-cyan-400 animate-ping' : 'bg-white/20'}`} />
                <span className="text-[10px] font-mono font-black text-white/30 uppercase tracking-widest">Live Sync Engaged</span>
            </div>

            <div className="grid gap-4 md:grid-cols-4 w-full">
                {items.map((item) => (
                    <div key={item.label} className={`relative overflow-hidden glass-card rounded-xl border p-4 transition-all duration-300 hover:scale-[1.02] shadow-[0_0_20px_rgba(0,0,0,0.5)] ${item.border}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${item.bg}`}>
                                <item.icon className={`h-4 w-4 ${item.color}`} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                                    {item.label}
                                </p>
                                <div className="text-xl font-black tracking-tight font-mono text-white">
                                    {item.value}
                                </div>
                            </div>
                        </div>
                        <div className={`absolute -right-4 -bottom-4 h-16 w-16 rounded-full blur-2xl opacity-10 ${item.bg}`} />
                    </div>
                ))}
            </div>
        </div>
    )
}
