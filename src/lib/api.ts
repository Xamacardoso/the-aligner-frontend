import { partnerService } from './api/partner.service';
import { patientService } from './api/patient.service';
import { treatmentService } from './api/treatment.service';
import { budgetService } from './api/budget.service';
import { clinicalService } from './api/clinical.service';
import { PartnerListItem, PartnerDetails, PatientListItem, PatientDetails, Budget, TreatmentListItem, TreatmentDetails } from './types';

export * from './api/partner.service';
export * from './api/patient.service';
export * from './api/treatment.service';
export * from './api/budget.service';
export * from './api/clinical.service';

// Legacy Mappings for backward compatibility
// These will help the app continue working while we update the components one by one

export async function fetchDentists(): Promise<any[]> {
    const data = await partnerService.findAll();
    return data.items;
}

export async function createDentist(data: any) {
    return partnerService.create(data);
}

export async function updateDentist(cpf: string, data: any) {
    return partnerService.update(cpf, data);
}

export async function removeDentist(cpf: string) {
    return partnerService.remove(cpf);
}

export async function fetchPatients(partnerPublicId?: string): Promise<any[]> {
    if (!partnerPublicId) return [];
    const data = await patientService.findByPartner(partnerPublicId);
    return data.items;
}

export async function fetchPatient(publicId: string, partnerCpf: string) {
    return patientService.findOne(publicId, partnerCpf);
}

export async function createPatient(data: any) {
    // Note: This might need partnerPublicId in the new logic
    // For now we try to extract or expect it in the component update
    return patientService.create(data, data.partnerPublicId);
}

export async function updatePatient(publicId: string, partnerCpf: string, data: any) {
    return patientService.update(publicId, partnerCpf, data);
}

export async function removePatient(publicId: string, partnerCpf: string) {
    return patientService.remove(publicId, partnerCpf);
}

export async function fetchBudgets(treatmentPublicId: string) {
    return budgetService.findByTreatment(treatmentPublicId);
}

export async function createBudget(data: any) {
    return budgetService.create(data);
}

export async function fetchPatientDocuments(treatmentPublicId: string) {
    return treatmentService.getFiles(treatmentPublicId);
}

export async function requestFileUpload(treatmentPublicId: string, fileName: string, contentType: string) {
    return treatmentService.requestUpload(treatmentPublicId, { fileName, contentType });
}

export async function confirmFileUpload(treatmentPublicId: string, fileName: string, r2key: string) {
    const format = fileName.split('.').pop() || '';
    return treatmentService.confirmUpload(treatmentPublicId, { r2key, nomeOriginal: fileName, formato: format });
}
