# MatBloom Front

Interface web do MatBloom para cadastro de questões, gestão de turmas e alunos, criação de provas e acompanhamento do desempenho. O front utiliza a [MatBloom API](../MatBloom-API/readme.MD) para autenticação, classificação de questões e acesso aos dados.

## Tecnologias

- Next.js 15 com App Router, React 18 e TypeScript
- Tailwind CSS e componentes Radix UI
- Redux Toolkit e Redux Persist
- Axios para requisições à API

## Funcionalidades

- Login e navegação conforme o perfil do usuário.
- Cadastro individual e importação de questões em JSON, com classificação de Bloom feita pela API. A lista permite pesquisa, filtros e correção manual do nível.
- Cadastro e edição de turmas e alunos por diretores e administradores; gerenciamento de usuários e vínculo de professores às turmas conforme as permissões do perfil.
- Montagem de provas com seleção manual, sorteio por conteúdo ou sugestões com base nos erros da turma ou do aluno; download de provas e gabaritos gerados pela API.
- Correção de gabaritos a partir das páginas de turma e aluno, com prévia e possibilidade de editar as alternativas lidas antes de registrar. A aplicação pode ser configurada para contar ou não na média.
- Análises por turma e aluno, incluindo dificuldades por conteúdo e por nível cognitivo.

## Execução local

Pré-requisitos: Node.js e npm. O Dockerfile do projeto utiliza Node.js 22. A API deve estar em execução e acessível pelo navegador.

```bash
npm ci
```

Configure a URL da API em `.env.local`, caso seja diferente do padrão:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Inicie o servidor:

```bash
npm run dev
```

Acesse <http://localhost:3000>. Por padrão, o front envia requisições para `http://localhost:8000`. A URL deve ser acessível **no navegador** de quem usa o sistema. A API precisa permitir a origem do front em `FRONTEND_ORIGINS` e a sessão usa cookie HTTP-only.

Para testar uma build de produção local:

```bash
npm run build
npm run start
```

Para subir front, API e PostgreSQL com Docker, consulte o [README do projeto principal](../readme.MD). No Docker, `NEXT_PUBLIC_API_URL` é incorporada durante a build do Next.js; após alterá-la, reconstrua a imagem do front.

## Páginas principais

- `/login` — autenticação
- `/dashboard` — visão geral
- `/turmas` e `/turmas/[classroomId]` — turmas, análise e correção de gabaritos
- `/gerenciarEstudantes` e `/alunos/[studentId]` — alunos e análise individual
- `/gerenciarQuestoes` — cadastro, importação, pesquisa e filtros de questões
- `/provas` — seleção de questões e criação de aplicações
- `/gerenciarUsuarios` — usuários, conforme o perfil

## Formato da importação de questões

A tela aceita um objeto, uma lista de objetos ou um objeto com a chave `questions`. Exemplo para uma questão:

```json
{
  "enunciation": "Quanto é 2 + 2?",
  "itens": ["3", "4", "5"],
  "correct_item": 1,
  "contents": ["Adição"],
  "dependencies": []
}
```

`correct_item` é o índice da alternativa correta, começando em zero: A = 0, B = 1. Informe ao menos um conteúdo. O nível de Bloom é classificado pela API, mesmo que o arquivo contenha `level`. A importação envia as questões sequencialmente; se for interrompida, confira quantas foram adicionadas antes de tentar novamente.

## Estrutura

```text
src/app/          Páginas e layouts do App Router
src/components/   Componentes de interface e correção de gabaritos
src/services/     Requisições à API
src/store/        Estado Redux e providers
src/hooks/        Hooks reutilizáveis
src/constants/    Tipos e constantes
src/assets/       Imagens e outros recursos
```

Para verificar os tipos TypeScript sem iniciar o servidor:

```bash
npx tsc --noEmit
```
