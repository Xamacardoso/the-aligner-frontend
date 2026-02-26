"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchDentists, fetchPatients } from '@/lib/api';
import { Dentist, Patient } from '@/lib/types';
import { ChevronRight } from 'lucide-react';

export default function GerentePacientesPage() {
    const router = useRouter();
    const [dentists, setDentists] = useState<Dentist[]>([]);
    const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
    const [patients, setPatients] = useState<Patient[]>([]);

    useEffect(() => {
        const load = async () => {
            const data = await fetchDentists();
            setDentists(data);
        };
        load();
    }, []);

    useEffect(() => {
        const loadPatients = async () => {
            if (selectedDentist) {
                const data = await fetchPatients(selectedDentist.cpf);
                setPatients(data);
            } else {
                setPatients([]);
            }
        };
        loadPatients();
    }, [selectedDentist]);

    return (
        <div className="p-8">
            <h1 className="text-xl font-semibold text-foreground mb-1">Pacientes</h1>

            <div className="grid grid-cols-12 gap-6 mt-6">
                {/* Dentist list */}
                <div className="col-span-4">
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                        {dentists.map(d => (
                            <button
                                key={d.cpf}
                                onClick={() => setSelectedDentist(d)}
                                className={`w-full text-left px-4 py-3 border-b border-border last:border-b-0 flex items-center justify-between hover:bg-muted transition-colors ${selectedDentist?.cpf === d.cpf ? 'bg-muted' : ''
                                    }`}
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
                </div>

                {/* Patient list */}
                <div className="col-span-8">
                    {!selectedDentist ? (
                        <div className="bg-card rounded-lg border border-border p-8 text-center text-muted-foreground text-sm">
                            Selecione um parceiro para ver os pacientes associados.
                        </div>
                    ) : (
                        <div className="bg-card rounded-lg border border-border overflow-hidden">
                            <div className="px-4 py-3 border-b border-border">
                                <p className="text-sm font-medium text-foreground">Pacientes de {selectedDentist.nome}</p>
                            </div>
                            {patients.length === 0 ? (
                                <p className="text-sm text-muted-foreground p-4">Nenhum paciente associado.</p>
                            ) : (
                                patients.map(p => (
                                    <button
                                        key={p.cpf}
                                        onClick={() => router.push(`/gerente/paciente/${p.cpf}?partnerCpf=${selectedDentist.cpf}`)}
                                        className="w-full text-left px-4 py-3 border-b border-border last:border-b-0 flex items-center justify-between hover:bg-muted transition-colors"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{p.nome}</p>
                                            <p className="text-xs text-muted-foreground">CPF: {p.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")} • Nasc: {p.nascimento ? new Date(p.nascimento).toLocaleDateString('pt-BR') : '-'}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
}
