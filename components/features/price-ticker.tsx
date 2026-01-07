"use client"

import { useEffect, useState } from "react"
import { Icons } from "@/components/icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCryptoPrices, CoinGeckoPrice } from "@/lib/coingecko/client"
import { cn } from "@/lib/utils"

export function PriceTicker() {
    const [prices, setPrices] = useState<CoinGeckoPrice | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchPrices() {
            try {
                const data = await getCryptoPrices()
                setPrices(data)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchPrices()
        const interval = setInterval(fetchPrices, 30000) // 30s poll
        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bitcoin</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-6 w-24 animate-pulse bg-muted rounded" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ethereum</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-6 w-24 animate-pulse bg-muted rounded" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    const btc = prices?.bitcoin
    const eth = prices?.ethereum

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bitcoin</CardTitle>
                    <Icons.trendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        ${btc?.usd.toLocaleString()}
                    </div>
                    <p className={cn("text-xs", (btc?.usd_24h_change || 0) >= 0 ? "text-green-500" : "text-red-500")}>
                        {btc?.usd_24h_change?.toFixed(2)}% (24h)
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ethereum</CardTitle>
                    <Icons.trendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        ${eth?.usd.toLocaleString()}
                    </div>
                    <p className={cn("text-xs", (eth?.usd_24h_change || 0) >= 0 ? "text-green-500" : "text-red-500")}>
                        {eth?.usd_24h_change?.toFixed(2)}% (24h)
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
