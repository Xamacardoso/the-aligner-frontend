import { apiClient } from './client';
import { Budget } from '../types';

export const budgetService = {
    findByTreatment: (treatmentPublicId: string) =>
        apiClient<Budget[]>(`/budgets/treatment/${treatmentPublicId}`),

    create: (data: { tratamentoPublicId: string, valor: number, descricao: string }) =>
        apiClient<Budget>('/budgets', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (publicId: string, data: { valor?: number, descricao?: string }) =>
        apiClient<Budget>(`/budgets/${publicId}/update`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    approve: (publicId: string) =>
        apiClient<void>(`/budgets/${publicId}/approve`, {
            method: 'POST',
        }),

    decline: (publicId: string) =>
        apiClient<void>(`/budgets/${publicId}/decline`, {
            method: 'POST',
        }),

    cancel: (publicId: string) =>
        apiClient<void>(`/budgets/${publicId}/cancel`, {
            method: 'POST',
        }),
};
