'use client'

import { useEffect, useState } from "react"
import { getFillsAction, getSettlementsAction } from "@/app/actions/kalshi"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MoveUpRight, MoveDownRight, Clock, ShieldCheck, ShieldX } from "lucide-react"

export function RecentActivity() {
    const [activities, setActivities] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchHistory() {
            const [fillsRes, settlementsRes] = await Promise.all([
                getFillsAction(),
                getSettlementsAction()
            ]);

            const allActivity: any[] = [];

            // Process Fills
            if (fillsRes.fills) {
                fillsRes.fills.forEach((f: any) => {
                    allActivity.push({
                        id: f.fill_id,
                        type: 'fill',
                        action: f.action,
                        ticker: f.ticker,
                        side: f.side,
                        count: f.count,
                        price: f.yes_price || f.no_price || f.fill_price,
                        ts: f.ts
                    });
                });
            }

            // Process Settlements
            if (settlementsRes.settlements) {
                settlementsRes.settlements.forEach((s: any) => {
                    allActivity.push({
                        id: `settle-${s.ticker}-${s.ts}`,
                        type: 'settle',
                        action: s.revenue > 0 ? 'win' : 'loss',
                        ticker: s.ticker,
                        revenue: s.revenue,
                        ts: s.ts
                    });
                });
            }

            // Sort by TS descending
            allActivity.sort((a, b) => b.ts - a.ts);
            setActivities(allActivity.slice(0, 30));
            setLoading(false);
        }

        fetchHistory()
        const interval = setInterval(fetchHistory, 10000)
        return () => clearInterval(interval)
    }, [])

    if (loading && activities.length === 0) {
        return <div className="p-8 text-center text-cyan-400 font-mono animate-pulse uppercase tracking-[0.2em] text-xs">Synchronizing ledger...</div>
    }

    if (activities.length === 0) {
        return <div className="p-8 text-center text-muted-foreground font-mono text-xs">NO MARKET DATA SEGMENTS FOUND.</div>
    }

    return (
        <ScrollArea className="h-[400px]">
            <div className="divide-y divide-white/5">
                {activities.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-white/5 transition-colors group relative overflow-hidden">
                        <div className="flex items-center justify-between relative z-10">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    {item.type === 'fill' ? (
                                        <Badge variant={item.action === 'buy' ? 'default' : 'destructive'} className={`${item.action === 'buy' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'} text-[9px] h-5 uppercase tracking-widest font-black`}>
                                            {item.action === 'buy' ? 'ENTRY' : 'EXIT'}
                                        </Badge>
                                    ) : (
                                        <Badge className={`${item.action === 'win' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'} text-[9px] h-5 uppercase tracking-widest font-black`}>
                                            {item.action === 'win' ? 'SETTLED WIN' : 'SETTLED LOSS'}
                                        </Badge>
                                    )}
                                    <span className="font-mono text-xs font-bold tracking-tight text-white/90">{item.ticker}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono uppercase opacity-50">
                                    <Clock className="h-3 w-3" />
                                    {new Date(item.ts * 1000).toLocaleString('en-US', {
                                        hour: 'numeric',
                                        minute: 'numeric',
                                        second: 'numeric',
                                        hour12: false
                                    })}
                                </div>
                            </div>
                            <div className="text-right">
                                {item.type === 'fill' ? (
                                    <>
                                        <div className={`flex items-center gap-1 font-mono font-black text-sm ${item.side === 'yes' ? 'text-cyan-400' : 'text-red-500'}`}>
                                            {item.count}x {item.side.toUpperCase()}
                                            {item.action === 'buy' ? <MoveUpRight className="h-3 w-3" /> : <MoveDownRight className="h-3 w-3" />}
                                        </div>
                                        <div className="text-xs font-bold font-mono text-white/40">
                                            {item.price}¢ UNIT
                                        </div>
                                    </>
                                ) : (
                                    <div className={`flex items-center gap-2 font-mono font-black text-sm ${item.action === 'win' ? 'text-green-400' : 'text-red-500'}`}>
                                        {item.action === 'win' ? (
                                            <>+$${(item.revenue / 100).toFixed(2)} <ShieldCheck className="h-4 w-4" /></>
                                        ) : (
                                            <>-$$0.00 <ShieldX className="h-4 w-4" /></>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
}
