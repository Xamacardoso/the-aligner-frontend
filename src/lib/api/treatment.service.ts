import { apiClient } from './client';
import { TreatmentListItem, TreatmentDetails } from '../types';
import { Budget } from '../types'; // Assuming Budget type is needed for budgetService

export const treatmentService = {
    findByPatient: (patientPublicId: string, partnerPublicId: string, token?: string) =>
        apiClient<TreatmentListItem[]>(`/treatments/list/${patientPublicId}?partnerPublicId=${partnerPublicId}`, {}, token),

    findOne: (publicId: string, token?: string) =>
        apiClient<TreatmentDetails>(`/treatments/${publicId}`, {}, token),

    create: (data: any, patientPublicId: string, partnerPublicId: string, token?: string) =>
        apiClient<TreatmentDetails>(`/treatments?patientPublicId=${patientPublicId}&partnerPublicId=${partnerPublicId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),

    update: (publicId: string, data: any, token?: string) =>
        apiClient<TreatmentDetails>(`/treatments/${publicId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }, token),

    remove: (publicId: string, token?: string) =>
        apiClient<void>(`/treatments/${publicId}`, {
            method: 'DELETE',
        }, token),

    getFiles: (publicId: string, token?: string) =>
        apiClient<any[]>(`/treatments/${publicId}/files`, {}, token),

    requestUpload: (publicId: string, data: { fileName: string, contentType: string }, token?: string) =>
        apiClient<{ uploadUrl: string, r2key: string }>(`/treatments/${publicId}/files/request-upload`, {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),

    confirmUpload: (publicId: string, data: { r2key: string, nomeOriginal: string, formato: string }, token?: string) =>
        apiClient<void>(`/treatments/${publicId}/files/confirm-upload`, {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),

    deleteFile: (r2key: string, token?: string) =>
        apiClient<void>(`/treatments/file?r2key=${encodeURIComponent(r2key)}`, {
            method: 'DELETE',
        }, token),
};
