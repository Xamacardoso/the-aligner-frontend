# Visão Geral do Frontend

Bem-vindo à documentação do **TheAligner Frontend**!

## Arquitetura
Esta aplicação é construída utilizando **Next.js 15 (App Router)** e **React 19**.
Adota-se uma arquitetura modularizada para promover reuso e fácil manutenção.

### Tecnologias Principais:
- **Next.js**: Framework para renderização e rotas.
- **Tailwind CSS**: Estilização via classes utilitárias.
- **Radix UI & Shadcn**: Componentes acessíveis, não-estilizados por padrão e integrados perfeitamente com Tailwind.
- **Zustand**: Gerenciamento de estado global flexível e minimalista.
- **React Hook Form & Zod**: Controle de formulários complexos e validação rigorosa de schemas.
- **Three.js / React Three Fiber**: Utilizados para a visualização tridimensional de alinhadores e arcadas dentárias.

### Padrões e Práticas
- Utilizamos "Server Components" por padrão para otimização, e delegamos as interações do cliente a componentes "Client" (com `"use client"`).
- Componentes e lógica estão isolados nas pastas `src/components`, `src/hooks`, `src/store` e `src/lib`.
