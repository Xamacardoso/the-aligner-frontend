import { apiClient } from './client';
import { PatientListItem, PatientDetails } from '../types';

export const patientService = {
    findByPartner: (partnerPublicId: string, token?: string) =>
        apiClient<PatientListItem[]>(`/patients/partner/${partnerPublicId}`, {}, token),

    findMyPatients: (token?: string) =>
        apiClient<PatientListItem[]>(`/patients/my-patients`, {}, token),

    findOne: (publicId: string, partnerCpf: string, token?: string) =>
        apiClient<PatientDetails>(`/patients/${publicId}?partnerCpf=${partnerCpf}`, {}, token),

    create: (data: any, partnerPublicId: string, token?: string) =>
        apiClient<PatientDetails>(`/patients?partnerPublicId=${partnerPublicId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),

    update: (publicId: string, partnerCpf: string, data: any, token?: string) =>
        apiClient<PatientDetails>(`/patients/${publicId}?partnerCpf=${partnerCpf}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }, token),

    remove: (publicId: string, partnerCpf: string, token?: string) =>
        apiClient<void>(`/patients/${publicId}?partnerCpf=${partnerCpf}`, {
            method: 'DELETE',
        }, token),
};
