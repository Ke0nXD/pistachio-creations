# Pistachio & Creations

Site estatico para links, status de comissoes e apresentacao do projeto Pistachio & Creations.

## Arquivos

- `index.html`: entrada para deploy, redireciona para a pagina principal.
- `pistachio-creations.html`: estrutura do site.
- `style.css`: visual, layout responsivo, icones e mascote.
- `script.js`: idioma, musica, interacoes, particulas e admin local.
- `Fundo.png`: imagem de fundo.
- `assets/mascot-normal.png`: mascote no estado normal.
- `assets/mascot-boop.png`: mascote quando recebe clique/interacao.
- `assets/profile-icon.jpeg`: imagem usada na foto de perfil.

## Admin local

Abra o site com `#admin` no final da URL:

```text
https://SEU_USUARIO.github.io/pistachio-creations/#admin
```

Ou use o atalho:

```text
Ctrl + Shift + A
```

O admin permite alterar:

- comissoes abertas/fechadas
- vagas preenchidas e total de vagas
- prazo medio
- links de comissao, Discord, TikTok e Instagram

As alteracoes ficam salvas no navegador via `localStorage`. Em um site estatico, isso muda apenas para o navegador onde voce editou. Para um admin que altere o site para todos os visitantes, conecte o projeto a um backend, planilha, CMS ou banco de dados.

## Rodar localmente

Na pasta do projeto:

```bash
python -m http.server 8765 --bind 127.0.0.1
```

Depois abra:

```text
http://127.0.0.1:8765/
```

## Deploy no GitHub Pages

Importante: em contas/planos que nao suportam GitHub Pages para repositorios privados, deixe o repositorio como publico antes de habilitar o Pages.

1. Suba este projeto para um repositorio no GitHub.
2. No repositorio, abra `Settings`.
3. Entre em `Pages`.
4. Em `Build and deployment`, selecione:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. Clique em `Save`.
6. Aguarde o GitHub publicar o site.

O link final fica neste formato:

```text
https://SEU_USUARIO.github.io/pistachio-creations/
```

## Deploy alternativo

Tambem funciona em hospedagens estaticas como Netlify, Vercel ou Cloudflare Pages. Nao ha etapa de build: publique a pasta raiz do projeto.
