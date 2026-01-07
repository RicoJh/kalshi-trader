"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    return (
        <div className="flex min-h-screen flex-col bg-black">
            <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
            <div className="flex-1 flex overflow-hidden">
                <aside
                    className={cn(
                        "fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out border-r border-red-500/10 md:relative md:translate-x-0",
                        isSidebarOpen ? "w-[300px]" : "w-0 -translate-x-full md:w-0"
                    )}
                >
                    <div className={cn("h-full w-[300px]", !isSidebarOpen && "hidden")}>
                        <Sidebar />
                    </div>
                </aside>
                <main
                    className={cn(
                        "flex-1 flex flex-col overflow-y-auto transition-all duration-300 ease-in-out",
                        isSidebarOpen ? "md:ml-0" : "w-full"
                    )}
                >
                    <div className="p-6 h-full">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Overlay */}
            {!isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(true)}
                />
            )}
        </div>
    )
}
