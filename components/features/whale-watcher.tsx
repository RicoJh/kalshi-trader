"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, RotateCw, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PolyPosition {
    ticker: string;
    title: string;
    size: number;
    side: string; // 'YES' or 'NO' usually inferred from token ID or market data
    outcomeIndex?: number;
}

export function WhaleWatcher() {
    const [address, setAddress] = useState("0x63ce342161250d705dc0b16df89036c8e5f9ba9a")
    const [positions, setPositions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const fetchWhaleData = async () => {
        if (!address) return;
        setLoading(true);
        setError("");

        try {
            // Polymarket Data API (Gamma)
            // Endpoint: /positions?user={address}
            const res = await fetch(`https://data-api.polymarket.com/positions?user=${address}`);
            if (!res.ok) throw new Error("Signal Intercept Failed");

            const data = await res.json();
            // Data format is usually a list of position objects.
            // We slice top 5 largest by size
            const sorted = data.sort((a: any, b: any) => b.size - a.size).slice(0, 5);
            setPositions(sorted);
        } catch (e) {
            setError("Frequency Mismatch. Check Address.");
            // Mock data for demo if API fails/blocks (CORS issues possible on client side)
            // In a real app, this should be proxied via Next.js API route to avoid CORS.
            // setPositions([
            //     { title: "Bitcoin > $100k", size: 5000, outcomeIndex: 0 },
            //     { title: "ETH > $4k", size: 1200, outcomeIndex: 1 }
            // ])
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="glass-card border-purple-500/20 overflow-hidden h-full">
            <CardHeader className="border-b border-white/5 pb-4 bg-purple-500/5">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                            <Search className="text-purple-400" size={20} />
                            Whale Watcher
                        </CardTitle>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-50">Competitor Intelligence</p>
                    </div>
                    <Badge variant="outline" className="border-purple-500/50 text-purple-400 bg-purple-500/5 font-black uppercase tracking-widest text-[10px]">
                        POLYMARKET LINK
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="flex gap-2">
                    <Input
                        placeholder="Target Address (0x...)"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="bg-black/40 border-white/10 font-mono text-xs text-purple-200 placeholder:text-purple-500/20 focus-visible:ring-purple-500/50 h-9"
                    />
                    <Button
                        size="sm"
                        onClick={fetchWhaleData}
                        disabled={loading || !address}
                        className="bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 border border-purple-500/50"
                    >
                        {loading ? <RotateCw className="animate-spin" size={14} /> : "SCAN"}
                    </Button>
                </div>

                {error && (
                    <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono uppercase tracking-wide">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    {positions.length === 0 && !loading && !error && (
                        <div className="text-center py-8 opacity-20 text-[10px] font-mono uppercase tracking-widest">
                            No Signals Intercepted
                        </div>
                    )}

                    {positions.map((pos, i) => (
                        <div key={i} className="group p-3 rounded bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-white/90 line-clamp-1">{pos.title || pos.market}</span>
                                <Badge className={`text-[9px] font-black uppercase ${pos.outcomeIndex === 0 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-500'}`}>
                                    {pos.outcomeIndex === 0 ? 'YES' : 'NO'} // Approx logic
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                                <span>SIZE: {(pos.size || 0).toLocaleString()}</span>
                                <a href={`https://polymarket.com/market/${pos.market}`} target="_blank" rel="noopener" className="hover:text-purple-400 flex items-center gap-1">
                                    VIEW <ExternalLink size={8} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
