import { apiClient } from './client';
import { PatientListItem, PatientDetails } from '../types';

export const patientService = {
    findByPartner: (partnerPublicId: string, page: number = 1, limit: number = 10, search?: string, token?: string) => {
        const queryParams = new URLSearchParams();
        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());
        if (search) {
            queryParams.append('search', search);
        }
        return apiClient<{ items: PatientListItem[], total: number }>(`/patients/partner/${partnerPublicId}?${queryParams.toString()}`, {}, token);
    },

    findMyPatients: (page: number = 1, limit: number = 10, search?: string, token?: string) => {
        const queryParams = new URLSearchParams();
        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());
        if (search) {
            queryParams.append('search', search);
        }
        return apiClient<{ items: PatientListItem[], total: number }>(`/patients/my-patients?${queryParams.toString()}`, {}, token);
    },

    findOne: (publicId: string, token?: string) =>
        apiClient<PatientDetails>(`/patients/${publicId}`, {}, token),

    create: (data: any, partnerPublicId: string, token?: string) =>
        apiClient<PatientDetails>(`/patients?partnerPublicId=${partnerPublicId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),

    update: (publicId: string, data: any, token?: string) =>
        apiClient<PatientDetails>(`/patients/${publicId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }, token),

    remove: (publicId: string, token?: string) =>
        apiClient<void>(`/patients/${publicId}`, {
            method: 'DELETE',
        }, token),
};
