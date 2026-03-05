export type UserRole = 'gerente' | 'dentista';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// ==========================================
// PARTNER / DENTIST
// ==========================================

export interface PartnerListItem {
  publicId: string;
  nome: string;
  cpf: string;
  cro: string;
  croUf: string;
  email?: string | null;
  telefone?: string | null;
}

export interface PartnerDetails extends PartnerListItem {
  titulacao?: string | null;
  especialidades?: string[] | null;
  cnpj?: string | null;
  razaoSocial?: string | null;
  endereco?: string | null;
  telefone_estabelecimento?: string | null;
  complemento?: string | null;
  cep?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf_estabelecimento?: string | null;
  comunicacoes: string[];
}

// Legacy support or fallback if needed
export type Dentist = PartnerDetails;

// ==========================================
// PATIENT
// ==========================================

export interface PatientListItem {
  publicId: string;
  nome: string;
  cpf: string;
  nascimento?: string | Date | null;
}

export interface PatientDetails extends PatientListItem {
  cpfParceiro: string;
  partnerPublicId: string;
  tratamentos?: TreatmentListItem[];
}

// Legacy support
export interface Patient extends PatientDetails {
  // These fields are now mainly in TreatmentDetails but keeping for compatibility during migration
  queixaPrincipal?: string;
  descricaoCaso?: string;
  descricaoObjetivosTratamento?: string;
  objetivoTratamento?: string;
  apinhamento?: string;
  observacoes?: string;
  inicioTratamento?: string;
}

// ==========================================
// TREATMENT
// ==========================================

export interface TreatmentListItem {
  publicId: string;
  queixaPrincipal?: string | null;
  dataInicio: string | Date | null;
}

export interface TreatmentDetails extends TreatmentListItem {
  descricaoCaso?: string | null;
  observacoesAdicionais?: string | null;
  objetivos: any[];
  apinhamentos: any[];
  arquivos?: TreatmentFile[] | null;
}

export interface TreatmentFile {
  publicId: string;
  formato: string;
  r2key: string;
  nomeOriginal: string;
  dataCriacao: string | Date;
  downloadUrl?: string;
}

// ==========================================
// BUDGET
// ==========================================

export type BudgetStatus = 'pendente' | 'aprovado' | 'declinado' | 'cancelado';

export interface Budget {
  publicId: string;
  tratamentoPublicId: string;
  valor: number;
  descricao: string;
  status: BudgetStatus;
  dataCriacao: string | Date;
}

// Legacy support
export interface PatientDocument extends TreatmentFile {
  patientCpf: string; // fallback
}
