import { apiClient } from './client';
import { TreatmentListItem, TreatmentDetails } from '../types';

export const treatmentService = {
    findByPatient: (patientPublicId: string, partnerPublicId: string) =>
        apiClient<TreatmentListItem[]>(`/treatments/list/${patientPublicId}?partnerPublicId=${partnerPublicId}`),

    findOne: (publicId: string) =>
        apiClient<TreatmentDetails>(`/treatments/${publicId}`),

    create: (data: any, patientPublicId: string, partnerPublicId: string) =>
        apiClient<TreatmentDetails>(`/treatments?patientPublicId=${patientPublicId}&partnerPublicId=${partnerPublicId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (publicId: string, data: any) =>
        apiClient<TreatmentDetails>(`/treatments/${publicId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    remove: (publicId: string) =>
        apiClient<void>(`/treatments/${publicId}`, {
            method: 'DELETE',
        }),

    getFiles: (publicId: string) =>
        apiClient<any[]>(`/treatments/${publicId}/files`),

    requestUpload: (publicId: string, data: { fileName: string, contentType: string }) =>
        apiClient<{ uploadUrl: string, r2key: string }>(`/treatments/${publicId}/files/request-upload`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    confirmUpload: (publicId: string, data: { r2key: string, nomeOriginal: string, formato: string }) =>
        apiClient<void>(`/treatments/${publicId}/files/confirm-upload`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    deleteFile: (r2key: string) =>
        apiClient<void>(`/treatments/file?r2key=${encodeURIComponent(r2key)}`, {
            method: 'DELETE',
        }),
};
