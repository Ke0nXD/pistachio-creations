# Pistachio & Creations

Site e painel admin do Pistachio & Creations, migrado para Next.js para rodar em produção na Vercel com dados dinâmicos no MongoDB Atlas e imagens hospedadas no Cloudinary.

O GitHub não é mais usado como banco de dados. O admin não pede token do GitHub, não edita `site-config.json` por API e não cria commits a cada alteração.

## Tecnologias

- Next.js App Router
- Vercel
- MongoDB Atlas
- Cloudinary
- TypeScript
- CSS legado preservado/adaptado

## Rodar localmente

Instale as dependências:

```bash
npm install
```

Crie `.env.local` baseado em `.env.example`:

```bash
cp .env.example .env.local
```

Preencha as variáveis e rode:

```bash
npm run dev
```

Abra:

```text
http://localhost:3000
```

Admin:

```text
http://localhost:3000/admin
```

## Variáveis de ambiente

```env
MONGO_URL=
DB_NAME=pistachio_creations
ADMIN_PASSWORD=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_FOLDER=pistachio-creations
```

Não use `NEXT_PUBLIC_` para essas variáveis. Elas ficam somente no servidor.

## MongoDB Atlas

1. Crie um cluster no MongoDB Atlas.
2. Crie um usuário de banco com senha forte.
3. Libere o IP do ambiente local ou use `0.0.0.0/0` apenas para testes.
4. Copie a connection string para `MONGO_URL`.
5. Use `DB_NAME=pistachio_creations`.

Coleções usadas:

- `settings`
- `gallery_items`
- `finished_commissions`

Se `settings` ainda não existir, o app cria o documento `site-settings` automaticamente usando os valores de seed atuais.

## Cloudinary

1. Crie uma conta no Cloudinary.
2. Copie `cloud name`, `api key` e `api secret`.
3. Configure as variáveis `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` e `CLOUDINARY_API_SECRET`.
4. Defina `CLOUDINARY_UPLOAD_FOLDER=pistachio-creations`.

Uploads passam por `/api/upload`, exigem autenticação admin, validam tipo/tamanho e salvam no MongoDB apenas `imageUrl`, `publicId` e metadados.

## Admin

O admin fica em `/admin`.

Funcionalidades:

- login com `ADMIN_PASSWORD`
- logout
- editar status das comissões
- editar fila, total de vagas e prazo médio
- editar links de comissão e redes sociais
- gerenciar galeria
- gerenciar comissões feitas
- fazer upload de imagens
- editar títulos PT/EN, descrições, categoria, ordem e status ativo/inativo
- remover cards e tentar remover a imagem correspondente do Cloudinary

As rotas `POST`, `PUT` e `DELETE` validam o cookie httpOnly assinado com `JWT_SECRET`.

## Deploy na Vercel

1. Envie o repositório para o GitHub.
2. Importe o projeto na Vercel.
3. Configure todas as variáveis de ambiente em `Project Settings > Environment Variables`.
4. Faça o deploy.

A Vercel detecta Next.js automaticamente. O site público e o admin usam rotas dinâmicas sem cache agressivo para refletir mudanças rapidamente.

## Cadastrar imagens

1. Entre em `/admin`.
2. Abra a seção Galeria ou Comissões feitas.
3. Selecione uma imagem `webp`, `png`, `jpg`, `jpeg` ou `gif` até 10MB.
4. Preencha título PT, título EN e os campos opcionais.
5. Ajuste a ordem de exibição.
6. Salve o card.

## Editar configurações

1. Entre em `/admin`.
2. Edite a seção Configurações.
3. Clique em Salvar configurações.
4. O MongoDB é atualizado e o site passa a carregar os novos valores sem commit no GitHub.

## Problemas comuns

- `MONGO_URL nao configurado`: configure `.env.local` ou as variáveis na Vercel.
- `ADMIN_PASSWORD nao configurado`: defina uma senha forte no servidor.
- `JWT_SECRET nao configurado`: gere um segredo longo e aleatório.
- Upload falhou: confira credenciais do Cloudinary e limite de 10MB.
- Imagem não aparece: verifique se o card está ativo e se `imageUrl` foi salvo.
- Admin volta para login: confira `JWT_SECRET`, cookies do navegador e ambiente `https` em produção.

## Arquivos legados

Os arquivos estáticos antigos continuam no repositório para recuperação histórica:

- `index.html`
- `pistachio-creations.html`
- `style.css`
- `script.js`
- `admin-save-fix.js`
- `site-config.json`

O app Next.js não depende mais deles como fonte de dados em produção. `site-config.json` serve apenas como referência/seed histórico.
