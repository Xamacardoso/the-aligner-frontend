import { apiClient } from './client';

export const clinicalService = {
    getUfs: () => apiClient<any[]>('/clinical/ufs'),
    getSpecialties: () => apiClient<any[]>('/clinical/specialties'),
    getCommunicationTypes: () => apiClient<any[]>('/clinical/communication-types'),
    getTreatmentObjectives: () => apiClient<any[]>('/clinical/treatment-objectives'),
    getCrowdingTypes: () => apiClient<any[]>('/clinical/crowding-types'),
};
