"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { patientService } from '@/lib/api';
import { PatientListItem } from '@/lib/types';
import { Search, ChevronRight, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAppAuth } from '@/hooks/use-app-auth';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface DentistPatientsSectionProps {
    dentistPublicId: string;
}

export function DentistPatientsSection({ dentistPublicId }: DentistPatientsSectionProps) {
    const router = useRouter();
    const { token, isLoaded } = useAppAuth();
    const [patients, setPatients] = useState<PatientListItem[]>([]);
    const [totalPatients, setTotalPatients] = useState(0);
    const [patientPage, setPatientPage] = useState(1);
    const [patientSearch, setPatientSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const patientsPerPage = 5;

    useEffect(() => {
        const loadPatients = async () => {
            if (!isLoaded || !token) return;
            setIsLoading(true);
            try {
                const data = await patientService.findByPartner(dentistPublicId, patientPage, patientsPerPage, patientSearch, token);
                setPatients(data.items);
                setTotalPatients(data.total);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        const timer = setTimeout(loadPatients, 300);
        return () => clearTimeout(timer);
    }, [dentistPublicId, isLoaded, token, patientPage, patientSearch]);

    return (
        <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Buscar paciente deste dentista..."
                        value={patientSearch}
                        onChange={(e) => {
                            setPatientSearch(e.target.value);
                            setPatientPage(1);
                        }}
                        className="pl-9 h-9 text-xs"
                    />
                </div>
                {patientSearch && (
                    <button 
                        onClick={() => setPatientSearch('')}
                        className="text-[10px] font-bold uppercase text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Limpar
                    </button>
                )}
            </div>

            <div className="bg-muted/30 rounded-lg border border-border/50 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 flex justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    </div>
                ) : patients.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-6 text-center italic">
                        {patientSearch ? 'Nenhum paciente encontrado para esta busca.' : 'Este dentista ainda não possui pacientes cadastrados.'}
                    </p>
                ) : (
                    <div className="divide-y divide-border/40">
                        {patients.map(p => (
                            <button
                                key={p.publicId}
                                onClick={() => router.push(`/gerente/paciente/${p.publicId}`)}
                                className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{p.nome}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                            CPF: {p.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") || '—'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {totalPatients > patientsPerPage && (
                <div className="flex justify-center pt-2">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (patientPage > 1) setPatientPage(p => p - 1);
                                    }}
                                    className={patientPage === 1 ? "pointer-events-none opacity-50 scale-75" : "cursor-pointer scale-75"}
                                />
                            </PaginationItem>
                            <PaginationItem>
                                <span className="text-[10px] font-bold text-muted-foreground mx-2">
                                    Página {patientPage} de {Math.ceil(totalPatients / patientsPerPage)}
                                </span>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (patientPage < Math.ceil(totalPatients / patientsPerPage)) setPatientPage(p => p + 1);
                                    }}
                                    className={patientPage === Math.ceil(totalPatients / patientsPerPage) ? "pointer-events-none opacity-50 scale-75" : "cursor-pointer scale-75"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}
