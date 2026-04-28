/**
 * @module budgetService
 * @description Serviço de API para orçamentos.
 * Gerencia todas as chamadas REST ao backend para CRUD de orçamentos e upload de PDF.
 */
import { apiClient } from './client';
import { Budget } from '../types';

export const budgetService = {
    /** Lista orçamentos de um tratamento (ambas as roles) */
    findByTreatment: (treatmentPublicId: string, token?: string) =>
        apiClient<Budget[]>(`/budgets/treatment/${treatmentPublicId}`, {}, token),

    /** Cria um novo orçamento (somente gerente) */
    create: (data: { tratamentoPublicId: string, valor: number, descricao: string }, token?: string) =>
        apiClient<Budget>('/budgets', {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),

    /** Atualiza valor/descrição de um orçamento pendente (somente gerente) */
    update: (publicId: string, data: { valor?: number, descricao?: string }, token?: string) =>
        apiClient<Budget>(`/budgets/${publicId}/update`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }, token),

    /** Aprova um orçamento pendente (somente dentista) */
    approve: (publicId: string, token?: string) =>
        apiClient<void>(`/budgets/${publicId}/approve`, {
            method: 'POST',
        }, token),

    /** Declina um orçamento pendente (somente dentista) */
    decline: (publicId: string, token?: string) =>
        apiClient<void>(`/budgets/${publicId}/decline`, {
            method: 'POST',
        }, token),

    /** Cancela um orçamento (somente gerente) */
    cancel: (publicId: string, token?: string) =>
        apiClient<void>(`/budgets/${publicId}/cancel`, {
            method: 'POST',
        }, token),

    /** Exclui (soft-delete) um orçamento pendente (somente gerente) */
    delete: (publicId: string, token?: string) =>
        apiClient<void>(`/budgets/${publicId}`, {
            method: 'DELETE',
        }, token),

    // --- Upload/Download de PDF ---

    /** Solicita URL de upload para PDF do orçamento (somente gerente) */
    requestFileUpload: (publicId: string, data: { fileName: string, contentType: string }, token?: string) =>
        apiClient<{ uploadUrl: string, r2key: string }>(`/budgets/${publicId}/file/request-upload`, {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),

    /** Confirma upload de PDF e vincula ao orçamento (somente gerente) */
    confirmFileUpload: (publicId: string, data: { r2key: string, nomeOriginal: string }, token?: string) =>
        apiClient<void>(`/budgets/${publicId}/file/confirm-upload`, {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),

    /** Obtém URL de download do PDF do orçamento (ambos) */
    getFileUrl: (publicId: string, token?: string) =>
        apiClient<{ downloadUrl: string | null, nomeOriginal: string | null }>(`/budgets/${publicId}/file`, {}, token),
};
