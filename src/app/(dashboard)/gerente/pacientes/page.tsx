"use client"

import { useState, useEffect } from 'react';
import { partnerService } from '@/lib/api';
import { PartnerListItem } from '@/lib/types';
import { Search, UserRound, GraduationCap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAppAuth } from '@/hooks/use-app-auth';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { DentistPatientsSection } from '@/components/partner/DentistPatientsSection';
import { Badge } from '@/components/ui/badge';

export default function GerentePacientesPage() {
    const [dentists, setDentists] = useState<PartnerListItem[]>([]);
    const [selectedDentistId, setSelectedDentistId] = useState<string | null>(null);
    const { token, isLoaded } = useAppAuth();

    // Dentists Pagination & Search
    const [dentistPage, setDentistPage] = useState(1);
    const [totalDentists, setTotalDentists] = useState(0);
    const [dentistSearch, setDentistSearch] = useState('');
    const [error, setError] = useState<string | null>(null);
    const dentistsPerPage = 8;

    useEffect(() => {
        const load = async () => {
            if (!isLoaded || !token) return;
            try {
                const data = await partnerService.findAll(dentistPage, dentistsPerPage, dentistSearch, token);
                setDentists(data.items);
                setTotalDentists(data.total);
                setError(null);
            } catch (err: any) {
                console.error(err);
                if (err.message.includes('403')) {
                    setError('Você não tem permissão para acessar esta lista.');
                } else {
                    setError('Ocorreu um erro ao carregar os dentistas.');
                }
            }
        };
        const timer = setTimeout(load, 300);
        return () => clearTimeout(timer);
    }, [isLoaded, token, dentistPage, dentistSearch]);

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Gestão de Pacientes</h1>
                    <p className="text-sm text-muted-foreground">Visualize os pacientes agrupados por dentista parceiro</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar dentista por nome ou CRO..."
                        value={dentistSearch}
                        onChange={(e) => {
                            setDentistSearch(e.target.value);
                            setDentistPage(1);
                        }}
                        className="pl-9 h-11 shadow-sm border-primary/20 focus:border-primary transition-all"
                    />
                </div>
            </div>

            <div className="space-y-6">
                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                <Accordion 
                    type="single" 
                    collapsible 
                    value={selectedDentistId || ""} 
                    onValueChange={setSelectedDentistId}
                    className="space-y-4"
                >
                    {dentists.map(d => (
                        <AccordionItem 
                            key={d.publicId} 
                            value={d.publicId}
                            className="bg-card border border-border rounded-xl px-5 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 data-[state=open]:ring-1 data-[state=open]:ring-primary/20 data-[state=open]:border-primary/30"
                        >
                            <AccordionTrigger className="hover:no-underline py-5 group">
                                <div className="flex items-center gap-5 text-left w-full">
                                    <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center text-primary border border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                        <UserRound className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-base font-bold text-foreground leading-tight truncate">
                                                {d.nome}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                                <GraduationCap className="h-3.5 w-3.5" />
                                                {d.cro}-{d.croUf}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-6">
                                <div className="mt-2 border-t border-border/40 pt-6">
                                    <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        <UserRound className="h-3.5 w-3.5" /> Lista de Pacientes
                                    </div>
                                    <DentistPatientsSection dentistPublicId={d.publicId} />
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>

                {dentists.length === 0 && (
                    <div className="bg-muted/10 rounded-2xl border border-dashed border-border p-12 text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                            <Search className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Nenhum dentista encontrado</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">Tente ajustar seus termos de busca ou filtros para encontrar o parceiro desejado.</p>
                    </div>
                )}

                {totalDentists > dentistsPerPage && (
                    <div className="flex justify-center pt-8">
                        <Pagination>
                            <PaginationContent className="bg-card border border-border rounded-full px-2 py-1 shadow-sm">
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (dentistPage > 1) setDentistPage(p => p - 1);
                                        }}
                                        className={dentistPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                                {Array.from({ length: Math.ceil(totalDentists / dentistsPerPage) }).map((_, i) => {
                                    if (Math.abs(dentistPage - (i + 1)) > 2 && i !== 0 && i !== Math.ceil(totalDentists / dentistsPerPage) - 1) return null;
                                    return (
                                        <PaginationItem key={i}>
                                            <PaginationLink
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setDentistPage(i + 1);
                                                }}
                                                isActive={dentistPage === i + 1}
                                            >
                                                {i + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                })}
                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (dentistPage < Math.ceil(totalDentists / dentistsPerPage)) setDentistPage(p => p + 1);
                                        }}
                                        className={dentistPage === Math.ceil(totalDentists / dentistsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </div>
        </div>
    );
}
