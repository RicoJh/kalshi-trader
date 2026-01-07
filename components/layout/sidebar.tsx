"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"
import { Badge } from "@/components/ui/badge"

export function Sidebar() {
    const pathname = usePathname()

    const items = [
        {
            title: "Insights",
            href: "/",
            icon: "dashboard",
            label: "HQ"
        },
        {
            title: "Exchange",
            href: "/markets",
            icon: "markets",
        },
        {
            title: "Vault",
            href: "/portfolio",
            icon: "portfolio",
        },
        {
            title: "Terminal",
            href: "/bot",
            icon: "bot",
            label: "Live"
        },
        {
            title: "Hardware",
            href: "/settings",
            icon: "settings",
        },
    ]

    return (
        <nav className="h-full bg-black flex flex-col pt-12">
            <div className="flex flex-col h-full py-4">
                <div className="px-6 mb-12">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-6 w-6 bg-red-500 rounded-sm flex items-center justify-center shadow-[0_0_10px_rgba(255,0,0,0.5)]">
                            <Icons.bot className="h-4 w-4 text-black" />
                        </div>
                        <h2 className="text-xl font-black tracking-tighter uppercase italic">
                            Solus <span className="text-cyan-400">X</span>
                        </h2>
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-30">
                        Solus v5.Cyber
                    </p>
                </div>

                <div className="px-4 space-y-6 flex-1">
                    <div className="space-y-1">
                        {items.map((item) => {
                            const Icon = Icons[item.icon as keyof typeof Icons]
                            const isActive = pathname === item.href
                            return (
                                <Link key={item.title} href={item.href}>
                                    <div className={cn(
                                        "group flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer",
                                        isActive
                                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(0,255,255,0.05)]"
                                            : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                    )}>
                                        <div className="flex items-center">
                                            <Icon className={cn("mr-3 h-4 w-4 transition-colors", isActive ? "text-cyan-400" : "text-muted-foreground group-hover:text-red-500")} />
                                            <span className="text-sm font-bold tracking-wide">
                                                {item.title}
                                            </span>
                                        </div>
                                        {item.label && (
                                            <Badge className={cn(
                                                "text-[9px] px-1.5 h-4 bg-transparent border uppercase tracking-widest font-black shrink-0",
                                                isActive ? "border-cyan-400 text-cyan-400" : "border-muted-foreground/30 text-muted-foreground"
                                            )}>
                                                {item.label}
                                            </Badge>
                                        )}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>

                <div className="mt-auto px-6 py-8">
                    <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Core Status</span>
                            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
                        </div>
                        <div className="text-xs font-mono text-cyan-400/50">ENCRYPTED.CONN.01</div>
                    </div>
                </div>
            </div>
        </nav>
    )
}
