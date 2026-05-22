# Pistachio & Creations

Site estatico para links, status de comissoes e apresentacao do projeto Pistachio & Creations.

## Arquivos

- `index.html`: entrada para deploy, redireciona para a pagina principal.
- `pistachio-creations.html`: estrutura do site.
- `style.css`: visual, layout responsivo, icones e mascote.
- `script.js`: idioma, musica, interacoes, particulas, pet arrastavel e admin global.
- `Fundo.png`: imagem de fundo.
- `site-config.json`: dados globais editados pelo painel admin.
- `assets/mascot-normal.png`: mascote no estado normal.
- `assets/mascot-boop.png`: mascote quando recebe clique/interacao.
- `assets/profile-icon.jpeg`: imagem usada na foto de perfil.
- `assets/icons/`: imagens pequenas usadas nos icones do topo, badges, status e botoes.

## Admin global

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

As alteracoes sao salvas em `site-config.json` no repositorio pelo GitHub API. Para salvar ou resetar pelo painel, informe um token do GitHub com permissao de escrita em `Contents` no repositorio `Ke0nXD/pistachio-creations`.

Recomendacao de token:

- use um fine-grained personal access token
- limite o token apenas a este repositorio
- habilite `Contents: Read and write`
- nao publique o token nem salve em codigo

Visitantes apenas leem `site-config.json`; somente quem possui o token consegue gravar alteracoes globais.

Depois de salvar pelo admin, o GitHub cria um commit atualizando `site-config.json`. O site publicado busca esse arquivo com cache desativado, entao novos visitantes passam a ver os dados atualizados.

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
