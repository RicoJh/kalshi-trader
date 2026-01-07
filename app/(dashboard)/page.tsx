import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BalanceCard } from "@/components/features/balance-card"
import { PriceTicker } from "@/components/features/price-ticker"
import { RecentActivity } from "@/components/features/recent-activity"
import { PerformanceChart } from "@/components/features/performance-chart"
import { StatsCards } from "@/components/features/stats-cards"
import { Activity, ShieldCheck, Zap } from "lucide-react"

export default function DashboardPage() {
    return (
        <div className="flex-1 space-y-8 p-8 pt-6 max-w-[1600px] mx-auto overflow-hidden relative">
            {/* Cyber Scan line effect */}
            <div className="scan-line" />

            {/* Header / Status Bar */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-white to-red-500 bg-clip-text text-transparent italic">
                        SOLUS <span className="text-cyan-400">X</span>
                    </h1>
                    <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 bg-cyan-500/5 flex items-center gap-1 font-black">
                            <Zap className="h-3 w-3 fill-cyan-400" /> MULTI-SEGMENT ACTIVE
                        </Badge>
                        <Badge variant="outline" className="border-red-500/20 text-red-500 flex items-center gap-1 font-black">
                            <ShieldCheck className="h-3 w-3" /> NEURAL-MESH ENCRYPTED
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center space-x-4 bg-red-500/5 p-2 px-4 rounded-lg border border-red-500/20 backdrop-blur-sm shadow-[0_0_15px_rgba(255,0,0,0.1)]">
                    <Activity className="h-4 w-4 text-cyan-400 animate-pulse" />
                    <span className="text-[10px] font-black font-mono text-cyan-400 uppercase tracking-widest">System Load: 2% | Signal: 100%</span>
                </div>
            </div>

            {/* Top Stats Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <BalanceCard />
                <div className="col-span-3">
                    <PriceTicker />
                </div>
            </div>

            <StatsCards />

            {/* Main Command Center */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Equity Curve (Performance) */}
                <Card className="col-span-4 glass-card border-cyan-500/10 overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-6">
                        <div>
                            <CardTitle className="text-xl font-black uppercase tracking-tighter italic">Ledger Growth</CardTitle>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-50">Global Portfolio metrics</p>
                        </div>
                        <div className="bg-cyan-500/10 px-3 py-1 rounded text-cyan-400 text-xs font-black border border-cyan-500/20 shadow-[0_0_10px_rgba(0,255,255,0.2)]">
                            +12.4% APR
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <PerformanceChart />
                    </CardContent>
                </Card>

                {/* Real-time Order Stream */}
                <Card className="col-span-3 glass-card border-red-500/10 overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-6">
                        <div>
                            <CardTitle className="text-xl font-black uppercase tracking-tighter italic">Data Stream</CardTitle>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-50">Direct Exchange Feed</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <RecentActivity />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
