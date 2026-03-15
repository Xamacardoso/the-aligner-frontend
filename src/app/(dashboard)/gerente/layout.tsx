"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useAppAuth } from "@/hooks/use-app-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function GerenteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoaded } = useAppAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && user && user.role !== 'gerente') {
            router.push('/dentista/pacientes');
        }
    }, [isLoaded, user, router]);

    if (!isLoaded) return null;

    return <DashboardLayout role="gerente">{children}</DashboardLayout>;
}
