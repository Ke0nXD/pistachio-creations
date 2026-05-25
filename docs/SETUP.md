# Setup detalhado

Este guia configura o Pistachio & Creations para produção na Vercel usando MongoDB Atlas e Cloudinary.

## 1. MongoDB Atlas

1. Acesse [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Crie um projeto e um cluster.
3. Em `Database Access`, crie um usuário com senha forte.
4. Em `Network Access`, libere seu IP atual para desenvolvimento.
5. Para testes rápidos, você pode liberar `0.0.0.0/0`, mas isso é menos seguro. Remova essa regra quando possível.
6. Clique em `Connect`.
7. Escolha `Drivers`.
8. Copie a connection string.
9. Troque `<password>` pela senha do usuário.
10. Use essa string em `MONGO_URL`.

Banco recomendado:

```env
DB_NAME=pistachio_creations
```

O app cria automaticamente o documento `settings/site-settings` quando ele ainda não existe.

## 2. Cloudinary

1. Acesse [Cloudinary](https://cloudinary.com/).
2. Crie ou entre na sua conta.
3. No dashboard, copie:
   - Cloud name
   - API key
   - API secret
4. Configure:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_FOLDER=pistachio-creations
```

As imagens enviadas no admin vão para subpastas como:

```text
pistachio-creations/gallery
pistachio-creations/finished-commissions
```

## 3. Variáveis locais

Crie `.env.local` na raiz:

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

Gere `JWT_SECRET` com uma string longa e aleatória. Exemplo de comando:

```bash
node -e "console.log(crypto.randomUUID() + crypto.randomUUID())"
```

Não publique `.env.local`.

## 4. Rodar localmente

```bash
npm install
npm run dev
```

Site:

```text
http://localhost:3000
```

Admin:

```text
http://localhost:3000/admin
```

Use a senha configurada em `ADMIN_PASSWORD`.

## 5. Deploy na Vercel

1. Abra a Vercel.
2. Importe o repositório `Ke0nXD/pistachio-creations`.
3. Framework preset: Next.js.
4. Build command: `next build`.
5. Output directory: deixe vazio/padrão.
6. Em Environment Variables, configure todas as variáveis do `.env.example`.
7. Faça o deploy.

Depois do deploy, acesse:

```text
https://seu-dominio.vercel.app/admin
```

## 6. Checklist de produção

- `MONGO_URL` aponta para MongoDB Atlas.
- `DB_NAME` está definido.
- `ADMIN_PASSWORD` é forte.
- `JWT_SECRET` é longo e secreto.
- Cloudinary está configurado.
- Upload de imagem funciona no admin.
- Galeria pública mostra apenas cards ativos.
- Comissões feitas mostram apenas cards ativos.
- Links sociais foram trocados pelos links reais.
- GitHub token não aparece em nenhum formulário do admin.

## 7. Solução de problemas

### MongoDB não conecta

- Confira usuário/senha na connection string.
- Verifique se o IP da Vercel ou `0.0.0.0/0` está liberado no Atlas.
- Confirme se `MONGO_URL` foi configurado no ambiente correto da Vercel.

### Upload falha

- Confira `CLOUDINARY_CLOUD_NAME`.
- Confira `CLOUDINARY_API_KEY`.
- Confira `CLOUDINARY_API_SECRET`.
- Verifique se o arquivo é imagem.
- Verifique o limite de 10MB.

### Admin não autentica

- Confira `ADMIN_PASSWORD`.
- Confira `JWT_SECRET`.
- Limpe cookies do navegador se você trocou o segredo.

### Alteração não aparece no site

- Confirme que o card está ativo.
- Confirme que o admin salvou sem erro.
- Recarregue a página pública.
- Confira o documento salvo no MongoDB Atlas.

## 8. O que mudou em relação ao GitHub Pages

Antes, o admin tentava editar `site-config.json` via GitHub API, exigindo token no navegador e criando commits para mudanças de conteúdo.

Agora:

- configurações ficam no MongoDB Atlas
- imagens ficam no Cloudinary
- o admin usa cookie httpOnly
- segredos ficam no servidor
- mudanças não geram commits
- o GitHub é usado apenas para versionar código
