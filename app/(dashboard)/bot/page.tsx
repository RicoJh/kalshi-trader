import { BotControls } from "@/components/features/bot-logs"

export default function BotPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Solus Bot</h2>
            </div>
            <div className="alert alert-warning bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                <p className="font-bold">Warning</p>
                <p>This bot places REAL orders if not in Demo mode. Use at your own risk.</p>
            </div>
            <BotControls />
        </div>
    )
}
