"use client"

import { useEffect, useState } from "react"
import { getPortfolioAction } from "@/app/actions/portfolio"
import { KalshiPosition } from "@/lib/kalshi/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Icons } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert } from "lucide-react"

export function PortfolioTable() {
    const [positions, setPositions] = useState<KalshiPosition[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const refresh = async () => {
        setLoading(true)
        setError(null)
        const res: any = await getPortfolioAction()
        if (res.error) {
            setError(res.error)
        } else if (res.positions) {
            setPositions(res.positions)
        }
        setLoading(false)
    }

    useEffect(() => {
        refresh()
    }, [])

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <Icons.spinner className="animate-spin h-8 w-8 text-cyan-400" />
            <p className="text-xs font-mono text-cyan-400/50 uppercase tracking-[0.2em]">Accessing Vault Segments...</p>
        </div>
    )

    if (error) return (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-12 flex flex-col items-center justify-center space-y-4">
            <ShieldAlert className="h-12 w-12 text-red-500 animate-pulse" />
            <div className="text-center">
                <p className="text-sm font-black text-red-500 uppercase tracking-widest">Access Denied / Sync Error</p>
                <p className="text-xs font-mono text-white/40 mt-1 max-w-sm">{error}</p>
            </div>
            <button
                onClick={refresh}
                className="mt-4 px-4 py-2 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-colors"
            >
                Retry Decryption
            </button>
        </div>
    )

    return (
        <div className="rounded-xl border border-white/5 overflow-hidden glass-card">
            <Table>
                <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground">Asset / Market</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground">Side</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground">Units</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground">Avg Entry</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground">Current</TableHead>
                        <TableHead className="text-right text-xs font-black uppercase tracking-widest text-muted-foreground">Unrealized P&L</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {positions.length === 0 ? (
                        <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={6} className="text-center h-40">
                                <div className="flex flex-col items-center justify-center space-y-2 opacity-30">
                                    <Icons.bot className="h-8 w-8" />
                                    <p className="text-xs font-mono uppercase tracking-widest">No active positions in the ledger.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : positions.map((pos) => {
                        const pnl = Number(pos.unrealized_pnl) || 0
                        return (
                            <TableRow key={pos.ticker + pos.side} className="border-white/5 hover:bg-white/5 transition-colors group">
                                <TableCell className="font-mono font-bold text-white group-hover:text-cyan-400">
                                    {pos.ticker}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={pos.side === 'yes' ? "border-cyan-500/50 text-cyan-400 bg-cyan-500/5" : "border-red-500/50 text-red-500 bg-red-500/5"}>
                                        {pos.side.toUpperCase()}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono">{pos.count}</TableCell>
                                <TableCell className="font-mono text-muted-foreground">{pos.avg_price_cnt}¢</TableCell>
                                <TableCell className="font-mono text-muted-foreground">{pos.current_price || '---'}¢</TableCell>
                                <TableCell className={`text-right font-mono font-black ${pnl >= 0 ? "text-cyan-400" : "text-red-500"}`}>
                                    {pnl >= 0 ? '+' : ''}${(pnl / 100).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
