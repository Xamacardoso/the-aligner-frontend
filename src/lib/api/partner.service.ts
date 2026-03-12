import { apiClient } from './client';
import { PartnerListItem, PartnerDetails } from '../types';

export const partnerService = {
    findAll: (token?: string) =>
        apiClient<PartnerListItem[]>('/partners', {}, token),

    findOne: (publicId: string, token?: string) =>
        apiClient<PartnerDetails>(`/partners/${publicId}`, {}, token),

    create: (data: any, token?: string) =>
        apiClient<PartnerDetails>('/partners', {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),

    update: (cpf: string, data: any, token?: string) =>
        apiClient<PartnerDetails>(`/partners/${cpf}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }, token),

    remove: (cpf: string, token?: string) =>
        apiClient<void>(`/partners/${cpf}`, {
            method: 'DELETE',
        }, token),
};
