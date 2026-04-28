# Componentes e Estilização

Nossa camada de visualização é construída de maneira moderna utilizando **Tailwind CSS**.

## Componentes UI Base
Os componentes essenciais da interface (Botões, Inputs, Modais, Dropdowns) localizados em `src/components/ui/` seguem o padrão inspirado pelo **shadcn/ui**.
Isso significa que esses componentes **não são empacotados como dependências npm**. Em vez disso, o código fonte desses componentes pertence à aplicação.

Eles utilizam fortemente os primitivos acessíveis da **Radix UI**, garantindo WAI-ARIA para acessibilidade de teclados e leitores de tela.

## Agrupamento Condicional de Classes
Para construir variações de componentes (como `Button` primário vs secundário, ou pequeno vs grande), é empregada a biblioteca **class-variance-authority (CVA)**, em conjunto com o `clsx` e `tailwind-merge` (`cn` utility) para mesclar classes Tailwind sem colisões de prioridade de CSS.
