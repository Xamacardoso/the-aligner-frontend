/**
 * @module apiClient
 * @description Cliente HTTP centralizado para comunicação com o backend.
 *
 * Features:
 * - Adiciona automaticamente o Content-Type: application/json
 * - Injeta token JWT Bearer no header Authorization
 * - Desativa cache do Next.js por padrão (cache: 'no-store')
 * - Parseia erros do backend e relança como Error com mensagem legível
 * - Trata respostas 204 (No Content) retornando objeto vazio
 *
 * @example
 * ```ts
 * const data = await apiClient<TreatmentDetails>('/treatments/123', {}, token);
 * ```
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function apiClient<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string | null
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchOptions: RequestInit = { ...options, headers };
    if (fetchOptions.cache === undefined) {
        fetchOptions.cache = 'no-store';
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
    }

    // Handle No Content (204)
    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}
