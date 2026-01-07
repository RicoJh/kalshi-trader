"use client"

import { useEffect, useState } from "react"
import { getPortfolioAction } from "@/app/actions/portfolio"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Icons } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert } from "lucide-react"

export function OrdersTable() {
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const refresh = async () => {
        setLoading(true)
        setError(null)
        const res: any = await getPortfolioAction()
        if (res.error) {
            setError(res.error)
        } else if (res.orders) {
            setOrders(res.orders)
        }
        setLoading(false)
    }

    useEffect(() => {
        refresh()
    }, [])

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <Icons.spinner className="animate-spin h-8 w-8 text-red-500" />
            <p className="text-xs font-mono text-red-500/50 uppercase tracking-[0.2em]">Retrieving Order Ledger...</p>
        </div>
    )

    if (error) return (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-12 flex flex-col items-center justify-center space-y-4">
            <ShieldAlert className="h-12 w-12 text-red-500 animate-pulse" />
            <div className="text-center">
                <p className="text-sm font-black text-red-500 uppercase tracking-widest">Network Intercepted / Sync Error</p>
                <p className="text-xs font-mono text-white/40 mt-1 max-w-sm">{error}</p>
            </div>
            <button
                onClick={refresh}
                className="mt-4 px-4 py-2 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-colors"
            >
                Retry Request
            </button>
        </div>
    )

    return (
        <div className="rounded-xl border border-white/5 overflow-hidden glass-card">
            <Table>
                <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground">Market Ticker</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground">Action</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground">Side</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground">Price</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground">Qty</TableHead>
                        <TableHead className="text-right text-xs font-black uppercase tracking-widest text-muted-foreground">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.length === 0 ? (
                        <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={6} className="text-center h-40">
                                <div className="flex flex-col items-center justify-center space-y-2 opacity-30">
                                    <Icons.orders className="h-8 w-8" />
                                    <p className="text-xs font-mono uppercase tracking-widest">No active orders in retrieval radius.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : orders.map((order) => (
                        <TableRow key={order.order_id} className="border-white/5 hover:bg-white/5 transition-colors group">
                            <TableCell className="font-mono font-bold text-white group-hover:text-red-500">
                                {order.ticker}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={order.action === 'buy' ? "border-cyan-500/50 text-cyan-400 bg-cyan-500/5" : "border-red-500/50 text-red-500 bg-red-500/5"}>
                                    {order.action.toUpperCase()}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-xs font-bold uppercase">{order.side}</TableCell>
                            <TableCell className="font-mono text-muted-foreground">{order.yes_price || order.no_price}¢</TableCell>
                            <TableCell className="font-mono">{order.count}</TableCell>
                            <TableCell className="text-right">
                                <Badge variant="outline" className="border-white/10 text-white opacity-60">
                                    {order.status.toUpperCase()}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
