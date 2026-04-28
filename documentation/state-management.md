# Gerenciamento de Estado

O frontend do TheAligner possui cenários onde dados necessitam ser acessados e mutados através de vários componentes desvinculados na árvore do DOM.

Para solucionar isso, utilizamos a biblioteca **Zustand**.

## Por que Zustand?
Diferente de Redux, o Zustand fornece uma API mais leve, necessitando de menos boilerplate e integrando de maneira mais próxima com os Hooks do React.

## Onde encontrar?
Os arquivos de Store estão contidos na pasta `src/store`.

Geralmente, uma store se divide nas seguintes partes lógicas:
1. **Definição de Tipos (State e Actions)**.
2. **Criação da Store** usando `create()`.
3. **Uso nos Componentes** injetando a propriedade desejada.

*Exemplo de uso:*
```tsx
const nomePaciente = usePatientStore((state) => state.nome);
const atualizarNome = usePatientStore((state) => state.atualizarNome);
```
O uso via destruturação de objeto inteiriço (`usePatientStore()`) não é encorajado para evitar re-renders desnecessários.
