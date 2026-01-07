"use client"

import { useTheme } from "next-themes"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { useSettings } from "@/lib/settings-context"
import { Badge } from "@/components/ui/badge"
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react"

interface HeaderProps {
    onToggleSidebar: () => void
    isSidebarOpen: boolean
}

export function Header({ onToggleSidebar, isSidebarOpen }: HeaderProps) {
    const { setTheme, theme } = useTheme()
    const { isDemo } = useSettings()

    return (
        <header className="sticky top-0 z-50 w-full border-b border-red-500/10 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
            <div className="container flex h-16 items-center">
                <div className="flex items-center gap-4 mr-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleSidebar}
                        className="text-cyan-400 hover:text-red-500 hover:bg-white/5"
                    >
                        {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                    </Button>
                    <a className="flex items-center space-x-2" href="/">
                        <Icons.bot className="h-6 w-6 text-red-500" />
                        <span className="hidden font-black uppercase italic tracking-tighter sm:inline-block">
                            SOLUS <span className="text-cyan-400">X</span>
                        </span>
                    </a>
                </div>

                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        {isDemo && (
                            <Badge variant="outline" className="border-red-500 text-red-500 bg-red-500/10 font-black">
                                SIMULATION ACTIVE
                            </Badge>
                        )}
                    </div>
                    <nav className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                            className="text-cyan-400 hover:text-red-500 hover:bg-white/5"
                        >
                            <Icons.sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Icons.moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    </nav>
                </div>
            </div>
        </header>
    )
}
