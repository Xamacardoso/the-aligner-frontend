/**
 * @module Logger
 * @description Utilitário de log estruturado para o frontend.
 * Em desenvolvimento, exibe logs formatados no console.
 * Em produção, pode ser estendido para enviar logs a um serviço externo (ex: Sentry, custom endpoint).
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    metadata?: Record<string, any>;
    path?: string;
}

class FrontendLogger {
    private isProduction = process.env.NODE_ENV === 'production';

    private formatEntry(level: LogLevel, message: string, metadata?: Record<string, any>): LogEntry {
        return {
            level,
            message,
            timestamp: new Date().toISOString(),
            metadata,
            path: typeof window !== 'undefined' ? window.location.pathname : undefined,
        };
    }

    private print(entry: LogEntry) {
        if (this.isProduction && entry.level === 'debug') return;

        const colors = {
            info: 'color: #0070f3; font-weight: bold',
            warn: 'color: #f5a623; font-weight: bold',
            error: 'color: #ff0000; font-weight: bold',
            debug: 'color: #777777; font-weight: bold',
        };

        const label = `[${entry.level.toUpperCase()}]`;
        
        if (!this.isProduction) {
            console.log(
                `%c${label} %c${entry.message}`, 
                colors[entry.level], 
                'color: inherit; font-weight: normal',
                entry.metadata || ''
            );
        } else {
            // Em produção, logs de erro e avisos importantes são enviados ao console de forma estruturada
            if (entry.level === 'error' || entry.level === 'warn') {
                console[entry.level](JSON.stringify(entry));
            }
        }
    }

    info(message: string, metadata?: Record<string, any>) {
        this.print(this.formatEntry('info', message, metadata));
    }

    warn(message: string, metadata?: Record<string, any>) {
        this.print(this.formatEntry('warn', message, metadata));
    }

    error(message: string, metadata?: Record<string, any>) {
        this.print(this.formatEntry('error', message, metadata));
    }

    debug(message: string, metadata?: Record<string, any>) {
        this.print(this.formatEntry('debug', message, metadata));
    }
}

export const logger = new FrontendLogger();
