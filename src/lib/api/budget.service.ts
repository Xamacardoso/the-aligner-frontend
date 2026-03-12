import { apiClient } from './client';
import { Budget } from '../types';

export const budgetService = {
    findByTreatment: (treatmentPublicId: string, token?: string) =>
        apiClient<Budget[]>(`/budgets/treatment/${treatmentPublicId}`, {}, token),

    create: (data: { tratamentoPublicId: string, valor: number, descricao: string }, token?: string) =>
        apiClient<Budget>('/budgets', {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),

    update: (publicId: string, data: { valor?: number, descricao?: string }, token?: string) =>
        apiClient<Budget>(`/budgets/${publicId}/update`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }, token),

    approve: (publicId: string, token?: string) =>
        apiClient<void>(`/budgets/${publicId}/approve`, {
            method: 'POST',
        }, token),

    decline: (publicId: string, token?: string) =>
        apiClient<void>(`/budgets/${publicId}/decline`, {
            method: 'POST',
        }, token),

    cancel: (publicId: string, token?: string) =>
        apiClient<void>(`/budgets/${publicId}/cancel`, {
            method: 'POST',
        }, token),
};
