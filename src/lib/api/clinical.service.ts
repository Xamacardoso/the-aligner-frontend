import { apiClient } from './client';

export const clinicalService = {
    getUfs: (token?: string) => apiClient<any[]>('/clinical/ufs', {}, token),
    getSpecialties: (token?: string) => apiClient<any[]>('/clinical/specialties', {}, token),
    getCommunicationTypes: (token?: string) => apiClient<any[]>('/clinical/communication-types', {}, token),
    getTreatmentObjectives: (token?: string) => apiClient<any[]>('/clinical/treatment-objectives', {}, token),
    getCrowdingTypes: (token?: string) => apiClient<any[]>('/clinical/crowding-types', {}, token),
    getDegrees: (token?: string) => apiClient<any[]>('/clinical/degrees', {}, token),
};
