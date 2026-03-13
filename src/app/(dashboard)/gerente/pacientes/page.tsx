"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { partnerService, patientService } from '@/lib/api';
import { PartnerListItem, PatientListItem } from '@/lib/types';
import { ChevronRight, Search } from 'lucide-react';
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

export default function GerentePacientesPage() {
    const router = useRouter();
    const [dentists, setDentists] = useState<PartnerListItem[]>([]);
    const [selectedDentist, setSelectedDentist] = useState<PartnerListItem | null>(null);
    const [patients, setPatients] = useState<PatientListItem[]>([]);
    const { token, isLoaded } = useAppAuth();

    // Dentists Pagination & Search
    const [dentistPage, setDentistPage] = useState(1);
    const [totalDentists, setTotalDentists] = useState(0);
    const [dentistSearch, setDentistSearch] = useState('');
    const dentistsPerPage = 9;

    // Patients Pagination & Search
    const [patientPage, setPatientPage] = useState(1);
    const [totalPatients, setTotalPatients] = useState(0);
    const [patientSearch, setPatientSearch] = useState('');
    const patientsPerPage = 9;

    useEffect(() => {
        const load = async () => {
            if (!isLoaded || !token) return;
            try {
                const data = await partnerService.findAll(dentistPage, dentistsPerPage, dentistSearch, token);
                setDentists(data.items);
                setTotalDentists(data.total);
            } catch (err) {
                console.error(err);
            }
        };
        const timer = setTimeout(load, 300);
        return () => clearTimeout(timer);
    }, [isLoaded, token, dentistPage, dentistSearch]);

    useEffect(() => {
        const loadPatients = async () => {
            if (!isLoaded || !token) return;
            try {
                if (selectedDentist) {
                    const data = await patientService.findByPartner(selectedDentist.publicId, patientPage, patientsPerPage, patientSearch, token);
                    setPatients(data.items);
                    setTotalPatients(data.total);
                } else {
                    setPatients([]);
                    setTotalPatients(0);
                }
            } catch (err) {
                console.error(err);
            }
        };
        const timer = setTimeout(loadPatients, 300);
        return () => clearTimeout(timer);
    }, [selectedDentist, isLoaded, token, patientPage, patientSearch]);

    return (
        <div className="p-8">
            <h1 className="text-xl font-semibold text-foreground mb-1">Pacientes</h1>

            <div className="grid grid-cols-12 gap-6 mt-6">
                {/* Dentist list */}
                <div className="col-span-4 flex flex-col gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar dentista..."
                            value={dentistSearch}
                            onChange={(e) => {
                                setDentistSearch(e.target.value);
                                setDentistPage(1);
                            }}
                            className="pl-9 h-10"
                        />
                    </div>
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                        {dentists.map(d => (
                            <button
                                key={d.publicId}
                                onClick={() => {
                                    setSelectedDentist(d);
                                    setPatientPage(1);
                                }}
                                className={`w-full text-left px-4 py-3 border-b border-border last:border-b-0 flex items-center justify-between hover:bg-muted transition-colors ${selectedDentist?.publicId === d.publicId ? 'bg-muted' : ''
                                    }`}
                                title="Ver pacientes deste dentista"
                            >
                                <div>
                                    <p className="text-sm font-medium text-foreground">{d.nome}</p>
                                    <p className="text-xs text-muted-foreground">{d.cro}-{d.croUf}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </button>
                        ))}
                        {dentists.length === 0 && (
                            <p className="text-sm text-muted-foreground p-4">Nenhum parceiro cadastrado.</p>
                        )}
                    </div>
                    {totalDentists > dentistsPerPage && (
                        <div className="flex justify-center">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (dentistPage > 1) setDentistPage(p => p - 1);
                                            }}
                                            className={dentistPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer scale-75"}
                                        />
                                    </PaginationItem>
                                    {Array.from({ length: Math.ceil(totalDentists / dentistsPerPage) }).map((_, i) => (
                                        <PaginationItem key={i}>
                                            <PaginationLink
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setDentistPage(i + 1);
                                                }}
                                                isActive={dentistPage === i + 1}
                                                className="scale-75"
                                            >
                                                {i + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (dentistPage < Math.ceil(totalDentists / dentistsPerPage)) setDentistPage(p => p + 1);
                                            }}
                                            className={dentistPage === Math.ceil(totalDentists / dentistsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer scale-75"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </div>

                {/* Patient list */}
                <div className="col-span-8 flex flex-col gap-4">
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-4">
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                    {selectedDentist ? `Pacientes de ${selectedDentist.nome}` : 'Selecione um dentista'}
                                </p>
                            </div>
                            
                            {selectedDentist && (
                                <div className="flex items-center gap-3 flex-1 justify-end">
                                    <div className="relative w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar paciente..."
                                            value={patientSearch}
                                            onChange={(e) => {
                                                setPatientSearch(e.target.value);
                                                setPatientPage(1);
                                            }}
                                            className="pl-9 h-8 text-xs font-normal"
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedDentist(null);
                                            setPatients([]);
                                            setTotalPatients(0);
                                            setPatientSearch('');
                                        }}
                                        className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
                                    >
                                        Limpar seleção
                                    </button>
                                </div>
                            )}
                        </div>
                        {patients.length === 0 ? (
                            <p className="text-sm text-muted-foreground p-4">
                                {selectedDentist ? 'Nenhum paciente encontrado para este dentista.' : 'Selecione um dentista na lista ao lado para ver seus pacientes.'}
                            </p>
                        ) : (
                            patients.map(p => (
                                <button
                                    key={p.publicId}
                                    onClick={() => router.push(`/gerente/paciente/${p.publicId}`)}
                                    className="w-full text-left px-4 py-3 border-b border-border last:border-b-0 flex items-center justify-between hover:bg-muted transition-colors"
                                    title="Ver detalhes do paciente"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{p.nome}</p>
                                        <p className="text-xs text-muted-foreground">CPF: {p.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")} • Nasc: {p.nascimento ? new Date(p.nascimento).toLocaleDateString('pt-BR') : '-'}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </button>
                            ))
                        )}
                    </div>
                    {totalPatients > patientsPerPage && (
                        <div className="flex justify-center">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (patientPage > 1) setPatientPage(p => p - 1);
                                            }}
                                            className={patientPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                    {Array.from({ length: Math.ceil(totalPatients / patientsPerPage) }).map((_, i) => (
                                        <PaginationItem key={i}>
                                            <PaginationLink
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setPatientPage(i + 1);
                                                }}
                                                isActive={patientPage === i + 1}
                                            >
                                                {i + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (patientPage < Math.ceil(totalPatients / patientsPerPage)) setPatientPage(p => p + 1);
                                            }}
                                            className={patientPage === Math.ceil(totalPatients / patientsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
}
