/**
 * @module treatmentService
 * @description Serviço de API para tratamentos clínicos.
 * Gerencia todas as chamadas REST ao backend para CRUD de tratamentos
 * e gestão de arquivos (exames, setups, documentos finais).
 *
 * Categorias de arquivo:
 * - 'exames': Exames Ortodônticos e Modelos Digitais
 * - 'setup': Setups do Paciente (somente gerente)
 * - 'final': Documentos Finais (gerente controla, dentista visualiza)
 */
import { apiClient } from './client';
import { TreatmentListItem, TreatmentDetails } from '../types';

export const treatmentService = {
    /** Lista tratamentos resumidos de um paciente */
    findByPatient: (patientPublicId: string, partnerPublicId: string, token?: string) =>
        apiClient<TreatmentListItem[]>(`/treatments/list/${patientPublicId}?partnerPublicId=${partnerPublicId}`, {}, token),

    /** Busca detalhes completos de um tratamento */
    findOne: (publicId: string, token?: string) =>
        apiClient<TreatmentDetails>(`/treatments/${publicId}`, {}, token),

    /** Cria um novo tratamento (somente dentista) */
    create: (data: any, patientPublicId: string, partnerPublicId: string, token?: string) =>
        apiClient<TreatmentDetails>(`/treatments?patientPublicId=${patientPublicId}&partnerPublicId=${partnerPublicId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),

    /** Atualiza um tratamento existente (somente dentista) */
    update: (publicId: string, data: any, token?: string) =>
        apiClient<TreatmentDetails>(`/treatments/${publicId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }, token),

    /** Exclui um tratamento (somente dentista) */
    remove: (publicId: string, token?: string) =>
        apiClient<void>(`/treatments/${publicId}`, {
            method: 'DELETE',
        }, token),

    /** Lista arquivos de um tratamento, filtrados por tipo */
    getFiles: (publicId: string, tipo?: string, token?: string) => {
        const url = tipo ? `/treatments/${publicId}/files?tipo=${tipo}` : `/treatments/${publicId}/files`;
        return apiClient<any[]>(url, {}, token);
    },

    /** Solicita URL de upload para arquivo de tratamento */
    requestUpload: (publicId: string, data: { fileName: string, contentType: string, tipo: string }, token?: string) =>
        apiClient<{ uploadUrl: string, r2key: string }>(`/treatments/${publicId}/files/request-upload`, {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),

    /** Confirma upload de arquivo e salva metadados no backend */
    confirmUpload: (publicId: string, data: { r2key: string, nomeOriginal: string, formato: string, tipo: string }, token?: string) =>
        apiClient<void>(`/treatments/${publicId}/files/confirm-upload`, {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),

    /** Exclui um arquivo de tratamento pelo r2key */
    deleteFile: (r2key: string, token?: string) =>
        apiClient<void>(`/treatments/file?r2key=${encodeURIComponent(r2key)}`, {
            method: 'DELETE',
        }, token),
};
