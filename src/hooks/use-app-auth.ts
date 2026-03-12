"use client";

import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api/client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Modular Auth Hook
 * This now uses our custom local authentication system.
 */
export function useAppAuth() {
    const { 
        token, 
        user, 
        isAuthenticated, 
        isLoaded, 
        initialize, 
        clearAuth,
        setAuth
    } = useAuthStore();
    
    const router = useRouter();

    useEffect(() => {
        if (!isLoaded) {
            initialize();
        }
    }, [isLoaded, initialize]);

    return {
        // State
        isLoaded,
        isAuthenticated,
        token,
        user: user ? {
            id: user.cpf,
            publicId: user.publicId,
            fullName: user.nome,
            email: "", 
            imageUrl: null,
            role: user.role,
        } : null,
        userId: user?.cpf,

        // Actions
        getAccessToken: async () => token,
        signOut: () => {
            clearAuth();
            router.push("/sign-in");
        },
        login: (token: string, userData: any) => {
            setAuth(token, userData);
        },

        /**
         * Authenticated API call helper
         */
        api: async <T>(endpoint: string, options: RequestInit = {}) => {
            return apiClient<T>(endpoint, options, token || undefined);
        },

        // Metadata / Roles
        hasRole: (role: string) => user?.role === role,
    };
}
