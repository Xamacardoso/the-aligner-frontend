export type UserRole = 'gerente' | 'dentista';

export interface User {
  id: string; // fallback
  name: string;
  email: string;
  role: UserRole;
}

export interface Dentist {
  cpf: string;
  nome: string;
  senha?: string; // only for creation, don't expose otherwise
  tipoUsuarioId: number;
  cro: string;
  croUf: string;
  email: string;
  telefone: string;
  especialidadeId?: number;
  titulacaoId?: number;
  cnpj?: string;
  razaoSocial?: string;
  endereco?: string;
  telefone_estabelecimento?: string;
  complemento?: string;
  cep?: string;
  bairro?: string;
  cidade?: string;
  uf_estabelecimento?: string;
}

export type TreatmentObjectiveOption = 'manter' | 'corrigir' | null;
export type CrowdingOption = 'projetar_expandir' | 'inclinar' | 'ipr' | null;

export interface TreatmentObjectives {
  linhaMediaSuperior: TreatmentObjectiveOption;
  linhaMeidaInferior: TreatmentObjectiveOption;
  overjet: TreatmentObjectiveOption;
  overbite: TreatmentObjectiveOption;
  formaArcoSuperior: TreatmentObjectiveOption;
  formaArcoInferior: TreatmentObjectiveOption;
}

export interface Crowding {
  superiorAnterior: CrowdingOption;
  superiorPosterior: CrowdingOption;
  inferiorAnterior: CrowdingOption;
  inferiorPosterior: CrowdingOption;
}

export interface Patient {
  cpf: string;
  nome: string;
  nascimento?: string;
  cpfParceiro: string;
  cnpjParceiro?: string;
  queixaPrincipal?: string;
  descricaoCaso?: string;
  descricaoObjetivosTratamento?: string;
  objetivoTratamento?: string;
  apinhamento?: string;
  observacoes?: string;
  inicioTratamento?: string;

  objetivosTratamentoObj?: TreatmentObjectives;
  apinhamentoObj?: Crowding;
}

export interface BudgetProcedure {
  id: string;
  name: string;
  value: number;
}

export type BudgetStatus = 'pendente' | 'deferido' | 'indeferido';

export interface Budget {
  id: string;
  patientId: string;
  procedures: BudgetProcedure[];
  totalValue: number;
  observations: string;
  status: BudgetStatus;
  justification?: string;
  createdAt: string;
}

export interface PatientDocument {
  id?: number;
  patientCpf: string;
  name: string;
  format: string;
  r2key: string;
  downloadUrl?: string;
  createdAt: string;
}
