import * as React from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
}

export function FormSection({ title, description, children, className, ...props }: FormSectionProps) {
    return (
        <section className={cn("space-y-4", className)} {...props}>
            <div className="flex items-center justify-between">
                <h3 className="text-base font-bold uppercase tracking-tight text-foreground/80">
                    {title}
                </h3>
                {description && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase italic">
                        {description}
                    </span>
                )}
            </div>
            <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                {children}
            </div>
        </section>
    );
}
