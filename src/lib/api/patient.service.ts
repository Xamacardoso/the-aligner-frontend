import { apiClient } from './client';
import { PatientListItem, PatientDetails } from '../types';

export const patientService = {
    findByPartner: (partnerPublicId: string) =>
        apiClient<PatientListItem[]>(`/patients/partner/${partnerPublicId}`),

    findOne: (publicId: string, partnerCpf: string) =>
        apiClient<PatientDetails>(`/patients/${publicId}?partnerCpf=${partnerCpf}`),

    create: (data: any, partnerPublicId: string) =>
        apiClient<PatientDetails>(`/patients?partnerPublicId=${partnerPublicId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (publicId: string, partnerCpf: string, data: any) =>
        apiClient<PatientDetails>(`/patients/${publicId}?partnerCpf=${partnerCpf}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    remove: (publicId: string, partnerCpf: string) =>
        apiClient<void>(`/patients/${publicId}?partnerCpf=${partnerCpf}`, {
            method: 'DELETE',
        }),
};
