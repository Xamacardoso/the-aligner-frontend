import { Dentist, Patient, Budget } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ==========================================
// DENTISTS (partners + Usuarios)
// ==========================================

export async function fetchDentists(): Promise<Dentist[]> {
    try {
        const res = await fetch(`${API_BASE_URL}/admin/partners`);
        if (!res.ok) throw new Error('Failed to fetch dentists');

        // The backend returns an array of partners, some fields are in 'usuario' relation.
        // We map things to our flat 'Dentist' type.
        const data = await res.json();
        return data.map((d: any) => ({
            ...d,
            nome: d.nome || 'Sem Nome',
            email: d.email || '',
            tipoUsuarioId: d.tipoUsuarioId || null,
            cro: d.cro || '',
            croUf: d.croUf || '',
        })) as Dentist[];
    } catch (err) {
        console.error('Error fetching dentists:', err);
        return [];
    }
}

export async function createDentist(dentist: Dentist): Promise<Dentist | null> {
    const payload = {
        // O backend (CreatePartnerDto) espera os dados de forma plana
        cpf: dentist.cpf,
        nome: dentist.nome,
        email: dentist.email,
        senha: dentist.senha,
        tipoUsuarioId: dentist.tipoUsuarioId,
        cro: dentist.cro,
        croUf: dentist.croUf,
        telefone: dentist.telefone,
        especialidadeId: dentist.especialidadeId,
        titulacaoId: dentist.titulacaoId,
        cnpj: dentist.cnpj,
        razaoSocial: dentist.razaoSocial,
        endereco: dentist.endereco,
        telefone_estabelecimento: dentist.telefone_estabelecimento,
        complemento: dentist.complemento,
        cep: dentist.cep,
        bairro: dentist.bairro,
        cidade: dentist.cidade,
        uf_estabelecimento: dentist.uf_estabelecimento,
    };

    try {
        const res = await fetch(`${API_BASE_URL}/admin/partners`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create dentist');
        return await res.json();
    } catch (err) {
        console.error('Error creating dentist:', err);
        return null;
    }
}

export async function updateDentist(cpf: string, updates: Partial<Dentist>): Promise<Dentist | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/admin/partners/${cpf}`, {
            method: 'PATCH', // or PUT depending on your backend
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error('Failed to update dentist');
        return await res.json();
    } catch (err) {
        console.error(`Error updating dentist ${cpf}:`, err);
        return null;
    }
}

export async function removeDentist(cpf: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE_URL}/admin/partners/${cpf}`, {
            method: 'DELETE',
        });
        return res.ok;
    } catch (err) {
        console.error(`Error deleting dentist ${cpf}:`, err);
        return false;
    }
}

// ==========================================
// PATIENTS
// ==========================================

export async function fetchPatients(dentistCpf?: string): Promise<Patient[]> {
    try {
        const url = dentistCpf ? `${API_BASE_URL}/partners/patients/dentist/${dentistCpf}` : `${API_BASE_URL}/partners/patients`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch patients');
        return await res.json();
    } catch (err) {
        console.error('Error fetching patients:', err);
        return [];
    }
}

export async function fetchPatient(cpf: string, partnerCpf?: string): Promise<Patient | null> {
    try {
        const url = partnerCpf
            ? `${API_BASE_URL}/partners/patients/${cpf}?partnerCpf=${partnerCpf}`
            : `${API_BASE_URL}/partners/patients/${cpf}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch patient');
        return await res.json();
    } catch (err) {
        console.error(`Error fetching patient ${cpf}:`, err);
        return null;
    }
}

export async function createPatient(patient: Patient): Promise<Patient | null> {
    const payload = {
        cpfParceiro: patient.cpfParceiro,
        cnpjParceiro: patient.cnpjParceiro,
        cpfPaciente: patient.cpf,
        nomePaciente: patient.nome,
        dataNascimento: patient.nascimento,
        descricaoQueixaPrincipal: patient.queixaPrincipal || '',
        descricaoObservacoes: patient.descricaoCaso || '',
        descricaoObjetivosTratamento: patient.descricaoObjetivosTratamento || '',
        objetivosTratamento: patient.objetivoTratamento || '',
        apinhamento: patient.apinhamento || '',
        outrasObservacoes: patient.observacoes || ''
    };

    try {
        const res = await fetch(`${API_BASE_URL}/partners/patients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create patient');
        return await res.json();
    } catch (err) {
        console.error('Error creating patient:', err);
        return null;
    }
}

export async function updatePatient(cpf: string, updates: Partial<Patient>): Promise<Patient | null> {
    const payload = {
        ...(updates.cpf && { cpfPaciente: updates.cpf }),
        ...(updates.nome && { nomePaciente: updates.nome }),
        ...(updates.nascimento && { dataNascimento: updates.nascimento }),
        ...(updates.queixaPrincipal !== undefined && { descricaoQueixaPrincipal: updates.queixaPrincipal }),
        ...(updates.descricaoCaso !== undefined && { descricaoObservacoes: updates.descricaoCaso }),
        ...(updates.descricaoObjetivosTratamento !== undefined && { descricaoObjetivosTratamento: updates.descricaoObjetivosTratamento }),
        ...(updates.objetivoTratamento !== undefined && { objetivosTratamento: updates.objetivoTratamento }),
        ...(updates.apinhamento !== undefined && { apinhamento: updates.apinhamento }),
        ...(updates.observacoes !== undefined && { outrasObservacoes: updates.observacoes })
    };

    try {
        const res = await fetch(`${API_BASE_URL}/partners/patients/${cpf}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update patient');
        return await res.json();
    } catch (err) {
        console.error(`Error updating patient ${cpf}:`, err);
        return null;
    }
}

export async function removePatient(cpf: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE_URL}/partners/patients/${cpf}`, {
            method: 'DELETE',
        });
        return res.ok;
    } catch (err) {
        console.error(`Error deleting patient ${cpf}:`, err);
        return false;
    }
}

// ==========================================
// BUDGETS 
// ==========================================

export async function fetchBudgets(patientCpf?: string): Promise<Budget[]> {
    try {
        const url = patientCpf ? `${API_BASE_URL}/budgets/patient/${patientCpf}` : `${API_BASE_URL}/budgets`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch budgets');
        const data = await res.json();
        return data.map((b: any) => ({
            id: String(b.id),
            patientId: b.pacienteCpf || patientCpf || '',
            procedures: [], // Mapped when procedures are implemented in backend
            totalValue: Number(b.valor) || 0,
            observations: b.descricao || '',
            status: b.status || 'pendente',
            createdAt: b.dataCriacao ? new Date(b.dataCriacao).toLocaleDateString('pt-BR') : '',
        })) as Budget[];
    } catch (err) {
        console.error('Error fetching budgets:', err);
        return [];
    }
}

export async function createBudget(data: { pacienteCpf: string, valor: number, descricao: string }): Promise<any> {
    try {
        const res = await fetch(`${API_BASE_URL}/budgets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create budget');
        return await res.json();
    } catch (err) {
        console.error('Error creating budget:', err);
        return null;
    }
}

export async function deleteBudget(id: string): Promise<boolean> {
    try {
        // Backend cancelling endpoint
        const res = await fetch(`${API_BASE_URL}/budgets/${id}/cancel`, {
            method: 'POST',
        });
        return res.ok;
    } catch (err) {
        console.error(`Error deleting/canceling budget ${id}:`, err);
        return false;
    }
}
