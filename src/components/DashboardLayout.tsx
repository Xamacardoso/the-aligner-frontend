"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Users, UserCheck } from 'lucide-react';
import { UserRole } from '@/lib/types';

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
}

const gerenteNav: NavItem[] = [
    { label: 'Dentistas', path: '/gerente/dentistas', icon: <UserCheck className="h-4 w-4" /> },
    { label: 'Pacientes', path: '/gerente/pacientes', icon: <Users className="h-4 w-4" /> },
];

const dentistaNav: NavItem[] = [
    { label: 'Pacientes', path: '/dentista/pacientes', icon: <Users className="h-4 w-4" /> },
];

interface DashboardLayoutProps {
    children: React.ReactNode;
    role: UserRole;
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setTimeout(() => setMounted(true), 0);
    }, []);

    const navItems = role === 'gerente' ? gerenteNav : dentistaNav;

    if (!mounted) return null;

    return (
        <div className="flex min-h-screen bg-secondary">
            {/* Sidebar */}
            <aside className="w-56 bg-card border-r border-border flex flex-col">
                {/* Logo */}
                <div className="px-5 py-5 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="relative w-7 h-7 flex-shrink-0 overflow-hidden">
                            <Image src="/thealign_logo2.jpeg" alt="The Aligner" fill className="object-cover" />
                        </div>
                        <span className="font-bold text-foreground">TheAlign</span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map(item => {
                        const active = pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${active
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User info + logout */}
                <div className="px-4 py-4 border-t border-border">
                    <p className="text-xs font-medium text-foreground truncate">{role === 'gerente' ? 'Gerente Teste' : 'Dentista Teste'}</p>
                    <p className="text-xs text-muted-foreground capitalize mb-3">{role}</p>
                    <Button variant="outline" size="sm" className="w-full gap-1.5">
                        <LogOut className="h-3.5 w-3.5" />
                        Sair (Desativado)
                    </Button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
