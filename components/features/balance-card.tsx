"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { useSettings } from "@/lib/settings-context"

export function BalanceCard() {
    const { hasKeys, isDemo } = useSettings()
    // In a real implementation effectively call a Server Action here
    // For now we mock it or show "Connect" state

    const [balance, setBalance] = useState({ available: 0, total: 0 })

    useEffect(() => {
        const fetchBalance = async () => {
            if (!hasKeys) return;

            try {
                // Dynamic import to avoid server-action issues in client component during build if not handled
                const { getUserBalanceAction } = await import("@/app/actions/kalshi");
                const res = await getUserBalanceAction();
                if (res.balance) {
                    setBalance({ available: res.balance.balance, total: res.balance.balance });
                }
            } catch (e) {
                console.error("Failed to fetch balance", e);
            }
        };

        fetchBalance();
        // Poll every 30s
        const interval = setInterval(fetchBalance, 30000);
        return () => clearInterval(interval);
    }, [hasKeys, isDemo])

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                <Icons.portfolio className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    ${(balance.total / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                    Available: ${(balance.available / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
            </CardContent>
        </Card>
    )
}
