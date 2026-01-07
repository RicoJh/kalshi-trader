import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:scale-105",
    {
        variants: {
            variant: {
                default:
                    "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20",
                secondary:
                    "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10",
                destructive:
                    "border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20",
                outline: "text-foreground border-white/20 hover:border-white/40",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
