"use client";

import React, { useState } from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const Collapsible = CollapsiblePrimitive.Root;
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

const CollapsibleContent = React.forwardRef<
    React.ElementRef<typeof CollapsiblePrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <CollapsiblePrimitive.Content
        ref={ref}
        forceMount
        className="overflow-hidden transition-all data-[state=closed]:h-0 data-[state=open]:h-auto data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
        {...props}
    >
        <div className={cn("pt-4 pb-1", className)}>{children}</div>
    </CollapsiblePrimitive.Content>
));
CollapsibleContent.displayName = "CollapsibleContent";

interface CollapsibleSectionProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    className?: string;
    headerRight?: React.ReactNode;
}

/**
 * Componente modular para seções colapsáveis com animação suave.
 * Usado para organizar conteúdos extensos como listas de arquivos ou orçamentos.
 */
export function CollapsibleSection({
    title,
    icon,
    children,
    defaultOpen = false,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    className,
    headerRight
}: CollapsibleSectionProps) {
    const [internalOpen, setInternalOpen] = useState(defaultOpen);

    const isControlled = controlledOpen !== undefined;
    const currentOpen = isControlled ? controlledOpen : internalOpen;

    const handleOpenChange = (newOpen: boolean) => {
        if (!isControlled) {
            setInternalOpen(newOpen);
        }
        if (controlledOnOpenChange) {
            controlledOnOpenChange(newOpen);
        }
    };

    return (
        <Collapsible
            open={currentOpen}
            onOpenChange={handleOpenChange}
            className={cn("pt-4 border-t border-border", className)}
        >
            <div className="flex items-center justify-between group">
                <CollapsibleTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer flex-1">
                        <div className={cn(
                            "transition-transform duration-300",
                            currentOpen ? "rotate-90" : "rotate-0"
                        )}>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                        {icon && <div className="text-primary">{icon}</div>}
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground/70 group-hover:text-foreground transition-colors">
                            {title}
                        </h3>
                    </div>
                </CollapsibleTrigger>

                {headerRight && (
                    <div className="flex-shrink-0 animate-in fade-in duration-300">
                        {headerRight}
                    </div>
                )}
            </div>

            <CollapsibleContent>
                {children}
            </CollapsibleContent>
        </Collapsible>
    );
}
