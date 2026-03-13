import { apiClient } from './client';
import { PartnerListItem, PartnerDetails } from '../types';

export const partnerService = {
    findAll: async (page: number = 1, limit: number = 10, search?: string, token?: string): Promise<{ items: PartnerListItem[], total: number }> => {
        const queryParams = new URLSearchParams();
        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());
        if (search) {
            queryParams.append('search', search);
        }
        return apiClient<{ items: PartnerListItem[], total: number }>(`/partners?${queryParams.toString()}`, {}, token);
    },

    findOne: (publicId: string, token?: string) =>
        apiClient<PartnerDetails>(`/partners/${publicId}`, {}, token),

    create: (data: any, token?: string) =>
        apiClient<PartnerDetails>('/partners', {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),

    update: (publicId: string, data: any, token?: string) =>
        apiClient<PartnerDetails>(`/partners/${publicId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }, token),

    remove: (cpf: string, token?: string) =>
        apiClient<void>(`/partners/${cpf}`, {
            method: 'DELETE',
        }, token),
};
