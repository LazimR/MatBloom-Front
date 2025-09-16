# MatBloom Frontend - Next.js

Este projeto foi migrado do Vite/React para Next.js.

## Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página inicial
│   └── login/
│       └── page.tsx       # Página de login
├── components/            # Componentes reutilizáveis
├── store/                # Redux store e slices
├── services/             # Serviços de API
├── hooks/                # Custom hooks
├── constants/            # Constantes e interfaces
├── assets/               # Imagens e recursos estáticos
└── css/                  # Arquivos CSS
```

## Principais Mudanças na Migração

### 1. Estrutura de Roteamento
- **Antes**: React Router DOM (`/src/App.tsx`)
- **Agora**: Next.js App Router (`/src/app/`)

### 2. Configuração
- **Antes**: `vite.config.ts`, `index.html`
- **Agora**: `next.config.js`, `src/app/layout.tsx`

### 3. Navegação
- **Antes**: `useNavigate()` do React Router
- **Agora**: `useRouter()` do Next.js + `Link` component

### 4. Providers
- **Antes**: Providers no `main.tsx`
- **Agora**: Providers no `src/store/Providers.tsx` + `'use client'`

## Scripts Disponíveis

```bash
npm run dev      # Inicia o servidor de desenvolvimento
npm run build    # Constrói o projeto para produção
npm run start    # Inicia o servidor de produção
npm run lint     # Executa o linter
```

## Como Usar

1. **Desenvolvimento**:
   ```bash
   npm run dev
   ```
   Acesse: http://localhost:3000

2. **Produção**:
   ```bash
   npm run build
   npm run start
   ```

## Páginas Disponíveis

- `/` - Página inicial
- `/login` - Página de login

## Componentes Migrados

- ✅ Header (atualizado para usar Next.js Link)
- ✅ Redux Store e Providers
- ✅ Componentes UI existentes
- ✅ Assets e imagens

## Próximos Passos

1. Migrar as páginas que foram apagadas para a estrutura do Next.js
2. Implementar autenticação real na página de login
3. Adicionar mais rotas conforme necessário
4. Configurar middleware de autenticação se necessário

## Tecnologias Utilizadas

- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Redux Toolkit
- Redux Persist
- Axios