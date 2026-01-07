"use client"

import { useEffect, useState } from "react"
import { getMarketsAction } from "@/app/actions/kalshi"
import { KalshiMarket } from "@/lib/kalshi/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { OrderForm } from "@/components/features/order-form"

export function MarketList() {
    const [markets, setMarkets] = useState<KalshiMarket[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function load() {
            setLoading(true)
            const res = await getMarketsAction();
            if (res.error) {
                setError(res.error)
                toast.error(res.error)
            } else if (res.markets) {
                setMarkets(res.markets)
            }
            setLoading(false)
        }
        load()
    }, [])

    const filtered = markets.filter(m =>
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.ticker.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return <div className="text-center p-8"><Icons.spinner className="animate-spin h-8 w-8 mx-auto" /></div>

    if (error) return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">Make sure you have set your API keys in Settings.</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
        </div>
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <Input
                    placeholder="Search markets..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ticker</TableHead>
                            <TableHead className="w-[400px]">Event</TableHead>
                            <TableHead>Yes Price</TableHead>
                            <TableHead>No Price</TableHead>
                            <TableHead>Volume</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    No markets found (or keys invalid).
                                </TableCell>
                            </TableRow>
                        ) : filtered.map((market) => (
                            <TableRow key={market.ticker}>
                                <TableCell className="font-mono text-xs">{market.ticker}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{market.title}</div>
                                    <div className="text-xs text-muted-foreground">{market.subtitle}</div>
                                </TableCell>
                                <TableCell className="text-green-600 font-bold">{market.yes_bid}¢</TableCell>
                                <TableCell className="text-red-600 font-bold">{market.no_bid}¢</TableCell>
                                <TableCell>{market.volume.toLocaleString()}</TableCell>
                                <TableCell className="text-right">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button size="sm" variant="outline">Trade</Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>{market.title}</DialogTitle>
                                                <DialogDescription>
                                                    {market.ticker} - Place your trade
                                                </DialogDescription>
                                            </DialogHeader>
                                            <OrderForm market={market} />
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
