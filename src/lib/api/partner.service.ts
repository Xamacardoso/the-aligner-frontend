import { apiClient } from './client';
import { PartnerListItem, PartnerDetails } from '../types';

export const partnerService = {
    findAll: () =>
        apiClient<PartnerListItem[]>('/partners'),

    findOne: (publicId: string) =>
        apiClient<PartnerDetails>(`/partners/${publicId}`),

    create: (data: any) =>
        apiClient<PartnerDetails>('/partners', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (cpf: string, data: any) =>
        apiClient<PartnerDetails>(`/partners/${cpf}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    remove: (cpf: string) =>
        apiClient<void>(`/partners/${cpf}`, {
            method: 'DELETE',
        }),
};
