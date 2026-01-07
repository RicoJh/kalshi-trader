"use client"

import { useState } from "react"
import { KalshiMarket } from "@/lib/kalshi/types"
import { placeOrderAction } from "@/app/actions/kalshi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import { Icons } from "@/components/icons"

interface OrderFormProps {
    market: KalshiMarket
    onSuccess?: () => void
}

export function OrderForm({ market, onSuccess }: OrderFormProps) {
    const [side, setSide] = useState<"yes" | "no">("yes")
    const [type] = useState<"market" | "limit">("market") // Simplified to Market only for MVP, or add Tab
    const [shares, setShares] = useState(1)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Construct order payload
        const order = {
            ticker: market.ticker,
            action: 'buy', // Always buy to open in this simple UI
            type: type,
            side: side,
            count: shares,
            // client_order_id: uuid() // Good practice
        }

        try {
            const res = await placeOrderAction(order);
            if (res.error) {
                toast.error("Order Failed: " + res.error)
            } else {
                toast.success("Order Placed Successfully")
                if (onSuccess) onSuccess()
            }
        } catch (err) {
            toast.error("Unexpected error")
        } finally {
            setLoading(false)
        }
    }

    const cost = shares * (side === 'yes' ? market.yes_ask : market.no_ask) || 0

    return (
        <div className="space-y-4">
            <Tabs defaultValue="yes" onValueChange={(v) => setSide(v as 'yes' | 'no')}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="yes">YES ({market.yes_ask}¢)</TabsTrigger>
                    <TabsTrigger value="no">NO ({market.no_ask}¢)</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="space-y-4 py-2">
                <div className="space-y-2">
                    <Label>Shares</Label>
                    <div className="flex items-center space-x-4">
                        <Slider
                            value={[shares]}
                            onValueChange={(v) => setShares(v[0])}
                            max={100}
                            step={1}
                            className="flex-1"
                        />
                        <Input
                            type="number"
                            value={shares}
                            onChange={(e) => setShares(parseInt(e.target.value))}
                            className="w-20"
                        />
                    </div>
                </div>

                <div className="rounded-lg bg-muted p-4">
                    <div className="flex items-center justify-between text-sm">
                        <span>Estimated Cost</span>
                        <span className="font-bold">${(cost / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                        <span>Potential Payout</span>
                        <span className="font-bold">${shares}.00</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                        <span>ROI</span>
                        <span className="text-green-600 font-bold">
                            {cost > 0 ? (((shares * 100 - cost) / cost) * 100).toFixed(0) : 0}%
                        </span>
                    </div>
                </div>

                <Button className="w-full" onClick={handleSubmit} disabled={loading}>
                    {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                    Place Buy Order
                </Button>
            </div>
        </div>
    )
}
