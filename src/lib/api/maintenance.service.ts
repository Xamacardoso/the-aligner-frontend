import { apiClient } from './client';

export interface AuxiliaryItem {
    id: number;
    nome?: string;
    descricao?: string;
    sigla?: string;
}

export const maintenanceService = {
    // Especialidades
    getSpecialties: (token?: string) => apiClient<AuxiliaryItem[]>('/maintenance/specialties', {}, token),
    createSpecialty: (data: { nome: string }, token?: string) => 
        apiClient('/maintenance/specialties', { method: 'POST', body: JSON.stringify(data) }, token),
    updateSpecialty: (id: number, data: { nome: string }, token?: string) => 
        apiClient(`/maintenance/specialties/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
    deleteSpecialty: (id: number, token?: string) => 
        apiClient(`/maintenance/specialties/${id}`, { method: 'DELETE' }, token),
    restoreSpecialty: (id: number, token?: string) => 
        apiClient(`/maintenance/specialties/${id}/restore`, { method: 'PATCH' }, token),

    // Objetivos
    getObjectives: (token?: string) => apiClient<AuxiliaryItem[]>('/maintenance/objectives', {}, token),
    createObjective: (data: { nome: string }, token?: string) => 
        apiClient('/maintenance/objectives', { method: 'POST', body: JSON.stringify(data) }, token),
    updateObjective: (id: number, data: { nome: string }, token?: string) => 
        apiClient(`/maintenance/objectives/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
    deleteObjective: (id: number, token?: string) => 
        apiClient(`/maintenance/objectives/${id}`, { method: 'DELETE' }, token),
    restoreObjective: (id: number, token?: string) => 
        apiClient(`/maintenance/objectives/${id}/restore`, { method: 'PATCH' }, token),

    // Apinhamentos
    getCrowding: (token?: string) => apiClient<AuxiliaryItem[]>('/maintenance/crowding', {}, token),
    createCrowding: (data: { nome: string }, token?: string) => 
        apiClient('/maintenance/crowding', { method: 'POST', body: JSON.stringify(data) }, token),
    updateCrowding: (id: number, data: { nome: string }, token?: string) => 
        apiClient(`/maintenance/crowding/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
    deleteCrowding: (id: number, token?: string) => 
        apiClient(`/maintenance/crowding/${id}`, { method: 'DELETE' }, token),
    restoreCrowding: (id: number, token?: string) => 
        apiClient(`/maintenance/crowding/${id}/restore`, { method: 'PATCH' }, token),

    // Graus/Titulações
    getDegrees: (token?: string) => apiClient<AuxiliaryItem[]>('/maintenance/degrees', {}, token),
    createDegree: (data: { nome: string }, token?: string) => 
        apiClient('/maintenance/degrees', { method: 'POST', body: JSON.stringify(data) }, token),
    updateDegree: (id: number, data: { nome: string }, token?: string) => 
        apiClient(`/maintenance/degrees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
    deleteDegree: (id: number, token?: string) => 
        apiClient(`/maintenance/degrees/${id}`, { method: 'DELETE' }, token),
    restoreDegree: (id: number, token?: string) => 
        apiClient(`/maintenance/degrees/${id}/restore`, { method: 'PATCH' }, token),

    // Comunicação
    getCommunication: (token?: string) => apiClient<AuxiliaryItem[]>('/maintenance/communication', {}, token),
    createCommunication: (data: { descricao: string }, token?: string) => 
        apiClient('/maintenance/communication', { method: 'POST', body: JSON.stringify(data) }, token),
    updateCommunication: (id: number, data: { descricao: string }, token?: string) => 
        apiClient(`/maintenance/communication/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
    deleteCommunication: (id: number, token?: string) => 
        apiClient(`/maintenance/communication/${id}`, { method: 'DELETE' }, token),
    restoreCommunication: (id: number, token?: string) => 
        apiClient(`/maintenance/communication/${id}/restore`, { method: 'PATCH' }, token),

    // UFs
    getUfs: (token?: string) => apiClient<AuxiliaryItem[]>('/maintenance/ufs', {}, token),
    createUf: (data: { nome: string; sigla: string }, token?: string) => 
        apiClient('/maintenance/ufs', { method: 'POST', body: JSON.stringify(data) }, token),
    updateUf: (id: number, data: { nome: string; sigla: string }, token?: string) => 
        apiClient(`/maintenance/ufs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
    deleteUf: (id: number, token?: string) => 
        apiClient(`/maintenance/ufs/${id}`, { method: 'DELETE' }, token),
    restoreUf: (id: number, token?: string) => 
        apiClient(`/maintenance/ufs/${id}/restore`, { method: 'PATCH' }, token),
};
