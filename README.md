# The Aligner — Frontend

Interface web moderna para o sistema de gestão odontológica The Aligner, construída com Next.js 16 e Shadcn UI.

## 🏗 Stack

| Camada | Tecnologia |
|:-------|:-----------|
| Framework | Next.js 16 (App Router + Turbopack) |
| UI Components | Shadcn UI + Radix Primitives |
| Styling | Tailwind CSS |
| Estado | React Context + `useState` |
| HTTP | Fetch nativo + apiClient centralizado |
| Tipagem | TypeScript |
| Visualização 3D | Three.js (STL Viewer) |
| Documentação | TypeDoc |

## 📁 Estrutura de Pastas

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── dentista/          # Páginas do Dentista
│   │   │   ├── paciente/[id]/ # Detalhe do paciente (dentista)
│   │   │   └── pacientes/     # Lista de pacientes
│   │   └── gerente/           # Páginas do Gerente
│   │       ├── paciente/[id]/ # Detalhe do paciente (gerente)
│   │       ├── pacientes/     # Gestão de pacientes
│   │       ├── dentistas/     # Gestão de dentistas
│   │       └── manutencao/    # Painel de manutenção
│   ├── sign-in/               # Página de login
│   └── visualizador-3d/       # Viewer 3D para arquivos STL
├── components/
│   ├── treatment/
│   │   ├── TreatmentAccordion.tsx  # Accordion principal de tratamentos
│   │   ├── TreatmentForm.tsx       # Formulário de criação/edição
│   │   └── ClinicalVisualizer.tsx  # Visualizador de objetivos/apinhamentos
│   ├── FileManagement.tsx      # Componente de upload/download de arquivos
│   ├── CollapsibleSection.tsx  # Seção colapsável reutilizável
│   ├── ConfirmActionDialog.tsx # Modal de confirmação
│   └── ui/                     # Componentes Shadcn UI
├── hooks/
│   └── use-app-auth.ts         # Hook de autenticação
└── lib/
    ├── api/
    │   ├── client.ts           # Cliente HTTP centralizado
    │   ├── treatment.service.ts
    │   ├── budget.service.ts
    │   ├── patient.service.ts
    │   ├── partner.service.ts
    │   ├── clinical.service.ts
    │   └── maintenance.service.ts
    ├── types.ts                # Tipos TypeScript globais
    └── utils.ts                # Utilidades (cn, etc)
```

## 🔐 Autenticação

O sistema usa JWT com o seguinte fluxo:

1. Usuário faz login com CPF + Senha
2. Backend retorna `access_token` (JWT)
3. Frontend armazena no `localStorage`
4. O hook `useAppAuth()` fornece `token`, `user` e `isLoaded`
5. Todas as chamadas API incluem `Authorization: Bearer <token>`

## 🎨 Controle de Acesso por Role

### Dentista (`/dentista/`)
- ✅ Cria, edita e exclui tratamentos
- ✅ Aprova e declina orçamentos
- ✅ Upload/download de Exames Ortodônticos
- ✅ Download de Documentos Finais (somente leitura)
- ❌ **Não** cria orçamentos
- ❌ **Não** acessa Setups do Paciente

### Gerente (`/gerente/`)
- ✅ Cria orçamentos e anexa PDF
- ✅ Exclui orçamentos pendentes
- ✅ Upload/download em todas as 3 seções de arquivos
- ❌ **Não** aprova/declina orçamentos
- ❌ **Não** cria/edita/exclui tratamentos

## ⚡ Setup Rápido

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Iniciar em desenvolvimento
```bash
npm run dev
```

O frontend estará disponível em `http://localhost:3000`.

## 📖 Documentação

### TypeDoc (Código-fonte)
```bash
npm run docs
```
Os arquivos ficam em `documentation/` — abra `index.html` no navegador.

## 🧪 Scripts Disponíveis

| Script | Descrição |
|:-------|:----------|
| `npm run dev` | Desenvolvimento com Turbopack |
| `npm run build` | Build de produção |
| `npm run start` | Servir build de produção |
| `npm run docs` | Gerar documentação TypeDoc |

## 📦 Componentes Principais

### `TreatmentAccordion`
Accordion que exibe tratamentos com 3 seções de arquivos e orçamentos. Recebe `userRole` para controlar visibilidade.

### `FileManagement`
Componente de upload/download com controle de acesso. Props `readOnly` e `canDelete` controlam botões visíveis.

### `CollapsibleSection`
Seção colapsável com animação suave. Suporta modo controlado e não-controlado.

### `ConfirmActionDialog`
Modal de confirmação reutilizável com loading state.