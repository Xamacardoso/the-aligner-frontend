import { create } from 'zustand';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

/**
 * @module AuthStore
 * @description Store Zustand responsável por gerenciar o estado global de autenticação no lado do cliente.
 */

interface User {
    cpf: string;
    nome: string;
    role: string;
    publicId: string;
}

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoaded: boolean;
    setAuth: (token: string, user: User) => void;
    clearAuth: () => void;
    initialize: () => void;
}

/**
 * Hook global que provê o estado de Autenticação atual do sistema (Token e Usuário logado).
 * Ele decodifica automaticamente o JWT em `initialize()` quando a página carrega.
 */
export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoaded: false,
    setAuth: (token, user) => {
        Cookies.set('auth_token', token, { expires: 1 }); // 1 dia
        set({ token, user, isAuthenticated: true, isLoaded: true });
    },
    clearAuth: () => {
        Cookies.remove('auth_token');
        set({ token: null, user: null, isAuthenticated: false, isLoaded: true });
    },
    initialize: () => {
        const token = Cookies.get('auth_token');
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                const user: User = {
                    cpf: decoded.sub,
                    nome: decoded.nome,
                    role: decoded.role,
                    publicId: decoded.publicId,
                };
                set({ token, user, isAuthenticated: true, isLoaded: true });
            } catch (error) {
                Cookies.remove('auth_token');
                set({ token: null, user: null, isAuthenticated: false, isLoaded: true });
            }
        } else {
            set({ isLoaded: true });
        }
    }
}));
