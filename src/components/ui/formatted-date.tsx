"use client"

import { useEffect, useState } from 'react';

interface FormattedDateProps {
    date: string | Date | null | undefined;
    format?: 'pt-BR' | 'en-CA';
    placeholder?: string;
}

export function FormattedDate({ date, format = 'pt-BR', placeholder = '—' }: FormattedDateProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !date) {
        return <>{placeholder}</>;
    }

    try {
        const d = new Date(date);
        // Ajuste para evitar problemas com timezone em datas sem hora (YYYY-MM-DD)
        // Se a data vier apenas como data, o New Date(string) assume UTC 00:00,
        // o que pode resultar no dia anterior dependendo do fuso local.
        if (typeof date === 'string' && date.length === 10) {
            d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
        }
        
        return <>{d.toLocaleDateString(format)}</>;
    } catch (e) {
        return <>{placeholder}</>;
    }
}
