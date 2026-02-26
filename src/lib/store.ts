import { Dentist, Patient, Budget, PatientDocument } from './types';

const DENTISTS_KEY = 'thealign_dentists';
const PATIENTS_KEY = 'thealign_patients';
const BUDGETS_KEY = 'thealign_budgets';
const DOCUMENTS_KEY = 'thealign_documents';

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Seed default data if empty
function seedData() {
  const dentists = getItem<Dentist[]>(DENTISTS_KEY, []);
  if (dentists.length === 0) {
    const seed: Dentist[] = [
      { cpf: '12345678901', nome: 'Dr. Carlos Mendes', cro: '12345', croUf: 'SP', email: 'dentista@thealign.com', telefone: '11987654321', tipoUsuarioId: 2, especialidadeId: 1, titulacaoId: 1, cnpj: '12345678000199', razaoSocial: 'Clinica Mendes Ltda', endereco: 'Rua das Flores, 123', bairro: 'Centro', cidade: 'São Paulo', uf_estabelecimento: 'SP', cep: '01000000' },
      { cpf: '98765432109', nome: 'Dra. Ana Souza', cro: '67890', croUf: 'SP', email: 'ana@thealign.com', telefone: '11912345678', tipoUsuarioId: 2 },
    ];
    setItem(DENTISTS_KEY, seed);
  }

  const patients = getItem<Patient[]>(PATIENTS_KEY, []);
  if (patients.length === 0) {
    const seed: Patient[] = [
      {
        cpf: '98765432100',
        cpfParceiro: '12345678901',
        nome: 'Maria Silva',
        nascimento: '1990-05-15',
        queixaPrincipal: 'Dentes desalinhados',
        observacoes: 'Paciente ansiosa, solicitou contenção estética',
        descricaoObjetivosTratamento: 'Alinhamento completo e fechamento de diastemas',
        objetivoTratamento: 'Corrigir linha média e overjet',
        apinhamento: 'Leve apinhamento inferior',
        inicioTratamento: '2023-11-01'
      },
    ];
    setItem(PATIENTS_KEY, seed);
  }
}

seedData();

// --- Dentists ---
export function getDentists(): Dentist[] {
  return getItem<Dentist[]>(DENTISTS_KEY, []);
}
export function saveDentist(dentist: Dentist): void {
  const list = getDentists();
  const idx = list.findIndex(d => d.cpf === dentist.cpf);
  if (idx >= 0) list[idx] = dentist;
  else list.push(dentist);
  setItem(DENTISTS_KEY, list);
}
export function deleteDentist(cpf: string): void {
  setItem(DENTISTS_KEY, getDentists().filter(d => d.cpf !== cpf));
}

// --- Patients ---
export function getPatients(): Patient[] {
  return getItem<Patient[]>(PATIENTS_KEY, []);
}
export function getPatientsByDentist(dentistCpf: string): Patient[] {
  return getPatients().filter(p => p.cpfParceiro === dentistCpf);
}
export function savePatient(patient: Patient): void {
  const list = getPatients();
  const idx = list.findIndex(p => p.cpf === patient.cpf);
  if (idx >= 0) list[idx] = patient;
  else list.push(patient);
  setItem(PATIENTS_KEY, list);
}
export function deletePatient(cpf: string): void {
  setItem(PATIENTS_KEY, getPatients().filter(p => p.cpf !== cpf));
}

// --- Budgets ---
export function getBudgets(): Budget[] {
  return getItem<Budget[]>(BUDGETS_KEY, []);
}
export function getBudgetsByPatient(patientId: string): Budget[] {
  return getBudgets().filter(b => b.patientId === patientId);
}
export function saveBudget(budget: Budget): void {
  const list = getBudgets();
  const idx = list.findIndex(b => b.id === budget.id);
  if (idx >= 0) list[idx] = budget;
  else list.push(budget);
  setItem(BUDGETS_KEY, list);
}
export function deleteBudget(id: string): void {
  setItem(BUDGETS_KEY, getBudgets().filter(b => b.id !== id));
}

// --- Documents ---
export function getDocuments(): PatientDocument[] {
  return getItem<PatientDocument[]>(DOCUMENTS_KEY, []);
}
export function getDocumentsByPatient(patientId: string): PatientDocument[] {
  return getDocuments().filter(d => d.patientId === patientId);
}
export function saveDocument(doc: PatientDocument): void {
  const list = getDocuments();
  list.push(doc);
  setItem(DOCUMENTS_KEY, list);
}
export function deleteDocument(id: string): void {
  setItem(DOCUMENTS_KEY, getDocuments().filter(d => d.id !== id));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
