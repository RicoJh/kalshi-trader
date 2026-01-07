"use client"

import { useEffect, useState } from "react"
import { getPortfolioAction } from "@/app/actions/portfolio"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw, Shield, Vault, Wallet, CircleDollarSign } from "lucide-react"

export default function PortfolioPage() {
    const [balance, setBalance] = useState<number | null>(null)
    const [isDemo, setIsDemo] = useState<boolean | null>(null)

    const syncBalance = async () => {
        const res: any = await getPortfolioAction()
        if (res.balance) {
            setBalance(res.balance.balance)
        }
    }

    useEffect(() => {
        syncBalance()
    }, [])

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 max-w-[1600px] mx-auto overflow-hidden relative">
            <div className="scan-line" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-white to-red-500 bg-clip-text text-transparent italic flex items-center gap-3">
                        VAULT <span className="text-cyan-400">CORPUS</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
                            <Vault className="h-3 w-3" /> Secure Storage
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-400/10 px-2 py-0.5 rounded border border-red-500/20">
                            <Shield className="h-3 w-3" /> Decryption Active
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="glass-card border border-white/5 p-4 py-2 rounded-xl flex items-center gap-4">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Available Capital</p>
                            <div className="flex items-center gap-2">
                                <CircleDollarSign className="h-4 w-4 text-cyan-400" />
                                <span className="text-xl font-mono font-black text-white">
                                    {balance !== null ? `$${(balance / 100).toFixed(2)}` : '---'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                            syncBalance()
                            window.location.reload()
                        }}
                        className="h-12 w-12 border-white/10 hover:bg-white/5 group"
                    >
                        <RefreshCw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="positions" className="space-y-6">
                <TabsList className="bg-white/5 border border-white/5 p-1 w-max">
                    <TabsTrigger
                        value="positions"
                        className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 px-8 py-2 text-xs font-black uppercase tracking-widest transition-all"
                    >
                        Active Clusters
                    </TabsTrigger>
                    <TabsTrigger
                        value="orders"
                        className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-500 px-8 py-2 text-xs font-black uppercase tracking-widest transition-all"
                    >
                        Pending Transmission
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="positions" className="space-y-4 focus-visible:ring-0 outline-none">
                    <div className="portfolio-table-container">
                        <PortfolioTable />
                    </div>
                </TabsContent>

                <TabsContent value="orders" className="space-y-4 focus-visible:ring-0 outline-none">
                    <div className="orders-table-container">
                        <OrdersTable />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

import { PortfolioTable } from "@/components/features/portfolio-table"
import { OrdersTable } from "@/components/features/orders-table"
