'use client'

import { useEffect, useState } from "react"
import { getUserBalanceAction } from "@/app/actions/kalshi"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function PerformanceChart() {
    const [data, setData] = useState<{ time: string, balance: number }[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function updatePerformance() {
            const res: any = await getUserBalanceAction()
            if (res.balance) {
                const balance = res.balance.balance / 100
                const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })

                const saved = localStorage.getItem('kalshi_pnl_history')
                let history = saved ? JSON.parse(saved) : []

                const lastPoint = history[history.length - 1]
                if (!lastPoint || lastPoint.balance !== balance) {
                    history.push({ time: now, balance })
                    if (history.length > 50) history.shift()
                    localStorage.setItem('kalshi_pnl_history', JSON.stringify(history))
                }

                setData(history)
            }
            setLoading(false)
        }

        updatePerformance()
        const interval = setInterval(updatePerformance, 10000)
        return () => clearInterval(interval)
    }, [])

    if (loading && data.length === 0) {
        return (
            <div className="flex h-[200px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
            </div>
        )
    }

    if (data.length < 2) {
        return (
            <div className="flex h-[200px] items-center justify-center text-sm font-mono text-muted-foreground uppercase tracking-widest">
                Searching ledger segments...
            </div>
        )
    }

    return (
        <div className="h-[250px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00ffff" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#00ffff" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="time"
                        stroke="#333"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        stroke="#333"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(0, 0, 0, 0.95)',
                            border: '1px solid rgba(0, 255, 255, 0.2)',
                            borderRadius: '4px',
                            backdropFilter: 'blur(10px)'
                        }}
                        itemStyle={{ color: '#00ffff', fontWeight: 'bold' }}
                        labelStyle={{ color: '#444', marginBottom: '4px', fontSize: '10px' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="balance"
                        stroke="#00ffff"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0, fill: '#ff0000' }}
                        animationDuration={1500}
                        fill="url(#colorBalance)"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
