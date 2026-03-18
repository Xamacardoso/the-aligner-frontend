import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCpf(value: string | undefined | null) {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return cleaned.replace(/(\d{3})(\d{1,})/, '$1.$2');
  if (cleaned.length <= 9) return cleaned.replace(/(\d{3})(\d{3})(\d{1,})/, '$1.$2.$3');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
}

export function formatPhone(value: string | undefined | null) {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 6) return cleaned.replace(/(\d{2})(\d{1,})/, '($1) $2');
  if (cleaned.length <= 10) return cleaned.replace(/(\d{2})(\d{4})(\d{1,})/, '($1) $2-$3');
  return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

export function formatCnpj(value: string | undefined | null) {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '').slice(0, 14);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return cleaned.replace(/(\d{2})(\d{1,})/, '$1.$2');
  if (cleaned.length <= 8) return cleaned.replace(/(\d{2})(\d{3})(\d{1,})/, '$1.$2.$3');
  if (cleaned.length <= 12) return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{1,})/, '$1.$2.$3/$4');
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5');
}

export function formatCep(value: string | undefined | null) {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '').slice(0, 8);
  if (cleaned.length <= 5) return cleaned;
  return cleaned.replace(/(\d{5})(\d{1,3})/, '$1-$2');
}
