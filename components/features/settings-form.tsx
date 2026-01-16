"use client"

import { useState } from "react"
import { useSettings } from "@/lib/settings-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export function SettingsForm() {
    const { keyId, privateKey, isDemo, botConfig, updateSettings, hasKeys } = useSettings()

    // Local state for form fields to avoid constant context updates on every keystroke
    const [formData, setFormData] = useState({
        keyId: keyId,
        privateKey: privateKey,
        isDemo: isDemo,
        pollInterval: botConfig.pollInterval,
        minEdge: botConfig.minEdge,
        maxShares: botConfig.maxShares,
        maxDailyLoss: botConfig.maxDailyLoss,
        maxBudget: botConfig.maxBudget
    })

    // Sync local state when context loads (if needed, but usually context is fast enough or empty initially)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }))
    }

    const handleSwitchChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, isDemo: checked }))
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await updateSettings({
                keyId: formData.keyId,
                privateKey: formData.privateKey,
                isDemo: formData.isDemo,
                botConfig: {
                    pollInterval: formData.pollInterval,
                    minEdge: formData.minEdge,
                    maxShares: formData.maxShares,
                    maxDailyLoss: formData.maxDailyLoss,
                    maxBudget: formData.maxBudget
                }
            })
            toast.success("Settings saved successfully")
        } catch (error) {
            toast.error("Failed to save settings")
        }
    }

    return (
        <form onSubmit={handleSave} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Kalshi Verification</CardTitle>
                    <CardDescription>
                        Enter your API keys from the Dashboard by clicking here..
                        Keys are stored locally and in HTTP-only cookies.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="keyId">Key ID (Access Key)</Label>
                        <Input
                            id="keyId"
                            name="keyId"
                            value={formData.keyId}
                            onChange={handleChange}
                            placeholder="KK-..."
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="privateKey">Private Key</Label>
                        <Input
                            id="privateKey"
                            name="privateKey"
                            value={formData.privateKey}
                            onChange={handleChange}
                            placeholder="MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKY..."
                            type="password"
                            required
                        />
                        <p className="text-[0.8rem] text-muted-foreground">
                            Paste the full RSA private key (Base64 encoded PEM).
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="isDemo"
                            checked={formData.isDemo}
                            onCheckedChange={handleSwitchChange}
                        />
                        <Label htmlFor="isDemo">Demo Mode</Label>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Bot Configuration</CardTitle>
                    <CardDescription>
                        Risk parameters for the automated trading bot.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="pollInterval">Poll Interval (seconds)</Label>
                            <Input
                                type="number"
                                id="pollInterval"
                                name="pollInterval"
                                value={formData.pollInterval}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="minEdge">Min Edge %</Label>
                            <Input
                                type="number"
                                id="minEdge"
                                name="minEdge"
                                value={formData.minEdge}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxShares">Max Shares Per Trade</Label>
                            <Input
                                type="number"
                                id="maxShares"
                                name="maxShares"
                                value={formData.maxShares}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxDailyLoss">Max Daily Loss %</Label>
                            <Input
                                type="number"
                                id="maxDailyLoss"
                                name="maxDailyLoss"
                                value={formData.maxDailyLoss}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxBudget">Max Budget ($)</Label>
                            <Input
                                type="number"
                                id="maxBudget"
                                name="maxBudget"
                                value={formData.maxBudget}
                                onChange={handleChange}
                                placeholder="10"
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                Maximum dollar amount to be actively invested across all trades.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Button type="submit">Save Changes</Button>
        </form>
    )
}
