/**
 * @module types
 * @description Tipos TypeScript compartilhados por toda a aplicação frontend.
 * Espelham as entidades do backend e são usados nos services, componentes e páginas.
 */

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

/** Dados resumidos de um parceiro (dentista) para listagem */
export interface PartnerListItem {
  publicId: string;
  nome: string;
  cpf: string;
  cro: string;
  croUf: string;
  email?: string | null;
  telefone?: string | null;
}

/** Dados completos de um parceiro */
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

/** Dados resumidos de um paciente para listagem */
export interface PatientListItem {
  publicId: string;
  nome: string;
  cpf: string;
  nascimento?: string | Date | null;
}

/** Dados completos de um paciente */
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

/** Dados resumidos de um tratamento para listagem */
export interface TreatmentListItem {
  publicId: string;
  queixaPrincipal?: string | null;
  dataInicio: string | Date | null;
}

/** Dados completos de um tratamento */
export interface TreatmentDetails extends TreatmentListItem {
  descricaoCaso?: string | null;
  observacoesAdicionais?: string | null;
  objetivos: any[];
  apinhamentos: any[];
  arquivos?: TreatmentFile[] | null;
}

/**
 * Arquivo vinculado a um tratamento.
 * Categorias:
 * - 'exames': Exames Ortodônticos e Modelos Digitais (ambos podem ler/escrever)
 * - 'setup': Setups do Paciente (somente gerente)
 * - 'final': Documentos Finais (gerente controla, dentista visualiza)
 */
export interface TreatmentFile {
  publicId: string;
  formato: string;
  r2key: string;
  nomeOriginal: string;
  tipo: 'exames' | 'setup' | 'final';
  dataCriacao: string | Date;
  downloadUrl?: string;
}

// ==========================================
// BUDGET
// ==========================================

export type BudgetStatus = 'pendente' | 'aprovado' | 'declinado' | 'cancelado';

/**
 * Orçamento vinculado a um tratamento.
 * - Criado pelo GERENTE
 * - Aprovado/Declinado pelo DENTISTA
 * - Pode ter um PDF anexado (pelo gerente)
 */
export interface Budget {
  publicId: string;
  tratamentoPublicId: string;
  valor: number;
  descricao: string;
  status: BudgetStatus;
  dataCriacao: string | Date;
  /** Lista de arquivos anexados ao orçamento */
  arquivos?: BudgetFile[];
}

export interface BudgetFile {
  publicId: string;
  r2key: string;
  nomeOriginal: string;
  formato: string;
  dataCriacao: string | Date;
  downloadUrl?: string;
}

// Legacy support
export interface PatientDocument extends TreatmentFile {
  patientCpf: string; // fallback
}
