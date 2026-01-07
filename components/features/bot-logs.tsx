"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Terminal, Zap, ShieldAlert, Copy, Check, Trash2 } from "lucide-react"
import { toast } from "sonner"

export function BotControls() {
    const [running, setRunning] = useState(false)
    const [logs, setLogs] = useState<string[]>([])
    const [copied, setCopied] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    const runOneCycle = async () => {
        try {
            const res = await fetch('/api/bot/run', { method: 'POST' });
            const data = await res.json();
            if (data.logs) {
                // Filter out too many "Initializing/Done" messages to reduce noise if no actions were taken
                // Actually, keep them but make them very subtle.
                const timeStr = new Date().toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });

                const newLogs = data.logs.map((l: string) => `[${timeStr}] ${l}`);
                setLogs(prev => [...newLogs, ...prev].slice(0, 200)); // Increased buffer to 200
            }
        } catch (e) {
            setLogs(prev => [`[${new Date().toLocaleTimeString()}] ERROR: Transmission Interrupted.`, ...prev]);
        }
    }

    const toggleBot = () => {
        if (running) {
            setRunning(false)
            if (timerRef.current) clearInterval(timerRef.current)
            setLogs(prev => [`[${new Date().toLocaleTimeString()}] >>> CORE TERMINATED.`, ...prev]);
        } else {
            setRunning(true)
            setLogs(prev => [`[${new Date().toLocaleTimeString()}] >>> INITIATING CORE...`, ...prev]);
            runOneCycle();
            timerRef.current = setInterval(runOneCycle, 10000)
        }
    }

    const copyLogs = () => {
        if (logs.length === 0) return;
        const text = logs.join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Ledger copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    }

    const clearLogs = () => {
        setLogs([]);
        toast.success("Terminal buffer cleared");
    }

    const getLogColor = (log: string) => {
        const content = log.toUpperCase();
        if (content.includes('ERROR') || content.includes('FAILED') || content.includes('❌') || content.includes('CRITICAL')) return 'text-red-500 font-bold';
        if (content.includes('SUCCESS') || content.includes('FILLED') || content.includes('>>>') || content.includes('CONFIRMED')) return 'text-cyan-400 font-bold';
        if (content.includes('TRADING') || content.includes('ENTRY') || content.includes('VIGILANT:') || content.includes('NEURAL:')) return 'text-yellow-400 font-black italic underline';
        if (content.includes('TREND:') || content.includes('SENTIMENT:')) return 'text-purple-400 font-bold';
        if (content.includes('TEMPORAL TRACE') || content.includes('SCAN') || content.includes('HORIZON')) return 'text-slate-500 font-mono text-[10px]';
        if (content.includes('VAULT') || content.includes('SYNC')) return 'text-white/60';
        if (content.includes('SHIELD ACTIVE') || content.includes('WAITING') || content.includes('INSUFFICIENT')) return 'text-orange-500/80 italic';
        if (content.includes('INITIALIZING') || content.includes('SOLUS') || content.includes('CYCLE DONE')) return 'text-white/20 italic';
        return 'text-white/40';
    }

    return (
        <div className="space-y-6">
            {/* Status Header */}
            <div className="flex items-center justify-between bg-white/[0.02] p-6 rounded-xl border border-white/5 backdrop-blur-xl">
                <div className="space-y-1">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                        <Zap className={running ? "text-cyan-400 fill-cyan-400 animate-pulse" : "text-muted-foreground"} size={20} />
                        SolusX Core
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${running ? 'bg-cyan-400 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em]">
                            {running ? "Neural link active" : "Core Offline"}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        variant={running ? "destructive" : "default"}
                        onClick={toggleBot}
                        className={`w-48 h-12 text-sm font-black uppercase tracking-widest transition-all duration-300 ${!running && 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_30px_rgba(0,255,255,0.2)]'}`}
                    >
                        {running ? (
                            <>
                                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                Terminate
                            </>
                        ) : (
                            <>
                                <Icons.bot className="mr-2 h-4 w-4" />
                                Initiate
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Terminal Card */}
            <Card className="glass-card border-white/5 overflow-hidden flex flex-col h-[600px] shadow-2xl relative">
                <CardHeader className="border-b border-white/5 bg-white/5 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Terminal size={16} className="text-cyan-400" />
                            <CardTitle className="text-xs font-black uppercase tracking-[0.3em] italic">Encrypted Ledger</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={clearLogs}
                                disabled={logs.length === 0}
                                className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                title="Clear Terminal"
                            >
                                <Trash2 size={14} />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyLogs}
                                disabled={logs.length === 0}
                                className="h-8 px-3 border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest gap-2"
                            >
                                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                {copied ? 'Extracted' : 'Extract'}
                            </Button>
                            <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400 font-black animate-pulse bg-cyan-500/5">
                                LIVE
                            </Badge>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-auto bg-[#020202] p-0 font-mono scrollbar-hide">
                    {logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-10">
                            <ShieldAlert size={64} />
                            <p className="text-[10px] uppercase tracking-[0.5em] font-black">Link Pending...</p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-1">
                            {logs.map((log, i) => (
                                <div key={i} className={`text-[11px] leading-relaxed group flex items-start gap-3 transition-all duration-300 ${getLogColor(log)}`}>
                                    <span className="opacity-10 text-[9px] min-w-[30px] select-none">{(logs.length - i).toString().padStart(3, '0')}</span>
                                    <span className="flex-1 break-all">{log}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>

                <div className="bg-white/5 border-t border-white/5 p-3 px-6 flex justify-between items-center text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <Icons.spinner className={`h-2 w-2 ${running ? 'animate-spin text-cyan-400' : 'hidden'}`} />
                            Buffer: {logs.length}/200
                        </span>
                    </div>
                    <span className="text-cyan-400/30 italic">Solus Encryption Active</span>
                </div>
            </Card>
        </div>
    )
}
