/* =====================================================
   ADMIN SAVE FIX — GitHub Pages safe persistence
   =====================================================
   This file intentionally runs after script.js and overrides only the
   admin persistence/config loading functions. It does not expose or
   hardcode any token.
*/

(function patchAdminGithubSave() {
  const TOKEN_STORAGE_KEY = 'pistachio-admin-token-session';
  const SESSION_CONFIG_KEY = 'pistachio-last-published-config';

  function normalizeGithubToken(token) {
    return String(token || '')
      .trim()
      .replace(/^Bearer\s+/i, '')
      .replace(/^token\s+/i, '');
  }

  function decodeBase64Utf8(base64) {
    const cleanBase64 = String(base64 || '').replace(/\s/g, '');
    const binary = atob(cleanBase64);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  async function readGithubJson(res) {
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch (error) {
      return { message: text };
    }
  }

  function explainGithubError(status, data = {}) {
    const message = String(data.message || '').trim();

    if (status === 401) {
      return 'Token inválido ou expirado. Gere outro token e confira se ele foi copiado inteiro.';
    }

    if (status === 403) {
      return 'O token foi aceito, mas não tem permissão para escrever. No GitHub, dê permissão Contents: Read and Write para este repositório.';
    }

    if (status === 404) {
      return 'O token não tem acesso a este repositório ou o arquivo não foi encontrado. Se for token fine-grained, selecione o repo Ke0nXD/pistachio-creations.';
    }

    if (status === 409) {
      return 'Conflito de versão no GitHub. Tente salvar de novo; o site já vai buscar a versão mais recente.';
    }

    if (message) return `Falha ao salvar no GitHub: ${message}`;
    return `Falha ao salvar no GitHub: HTTP ${status}`;
  }

  async function githubRequest(url, token = '', options = {}) {
    const githubToken = normalizeGithubToken(token);
    const headers = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    };

    if (githubToken) headers.Authorization = `Bearer ${githubToken}`;

    const separator = url.includes('?') ? '&' : '?';
    const noCacheUrl = `${url}${separator}_=${Date.now()}`;

    const res = await fetch(noCacheUrl, {
      ...options,
      headers,
      cache: 'no-store',
    });

    const data = await readGithubJson(res);
    if (!res.ok) {
      const error = new Error(explainGithubError(res.status, data));
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  async function loadConfigFromGithubApi() {
    const data = await githubRequest(`${CONFIG_FILE.api}?ref=${CONFIG_FILE.branch}`);
    const jsonText = decodeBase64Utf8(data.content || '');
    return JSON.parse(jsonText);
  }

  window.loadSiteConfig = async function loadSiteConfigPatched() {
    configLoadError = null;
    let globalConfig = {};

    try {
      // Reads through the GitHub Contents API instead of raw.githubusercontent.
      // This avoids the annoying CDN cache that made admin changes appear late.
      globalConfig = await loadConfigFromGithubApi();
      sessionStorage.setItem(SESSION_CONFIG_KEY, JSON.stringify(globalConfig));
    } catch (error) {
      configLoadError = error;
      console.warn('GitHub API config not loaded; trying last session config/defaults.', error);
      try {
        globalConfig = JSON.parse(sessionStorage.getItem(SESSION_CONFIG_KEY) || '{}');
      } catch (sessionError) {
        globalConfig = {};
      }
    }

    Object.assign(CONFIG, DEFAULT_CONFIG, normalizeConfig(globalConfig));
    CONFIG.commissionOpen = CONFIG.commissionOpen !== false;
    CONFIG.queueTotal = normalizeNumber(CONFIG.queueTotal, DEFAULT_CONFIG.queueTotal, 1, 99);
    CONFIG.queueFilled = normalizeNumber(CONFIG.queueFilled, DEFAULT_CONFIG.queueFilled, 0, CONFIG.queueTotal);
    CONFIG.deliveryDays = normalizeDelivery(CONFIG.deliveryDays);
  };

  window.getAdminToken = function getAdminTokenPatched() {
    const fieldToken = document.getElementById('admin-github-token')?.value || '';
    const token = normalizeGithubToken(fieldToken || sessionStorage.getItem(TOKEN_STORAGE_KEY) || '');
    if (token) sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    return token;
  };

  window.getConfigFileSha = async function getConfigFileShaPatched(token) {
    const data = await githubRequest(`${CONFIG_FILE.api}?ref=${CONFIG_FILE.branch}`, token);
    return data.sha || '';
  };

  window.persistSiteConfig = async function persistSiteConfigPatched(cleanConfig, token) {
    const githubToken = normalizeGithubToken(token);
    if (!githubToken) {
      throw new Error('Cole o token do GitHub antes de salvar. Ele precisa ter Contents: Read and Write.');
    }

    const payload = {
      ...cleanConfig,
      updatedAt: new Date().toISOString(),
    };

    async function putConfigWithFreshSha() {
      const sha = await window.getConfigFileSha(githubToken);
      const body = {
        message: 'chore: update site config from admin',
        branch: CONFIG_FILE.branch,
        sha,
        content: encodeBase64Utf8(`${JSON.stringify(payload, null, 2)}\n`),
      };

      return githubRequest(CONFIG_FILE.api, githubToken, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    }

    try {
      await putConfigWithFreshSha();
    } catch (error) {
      if (error.status === 409) {
        await new Promise(resolve => setTimeout(resolve, 700));
        await putConfigWithFreshSha();
      } else {
        throw error;
      }
    }

    sessionStorage.setItem(SESSION_CONFIG_KEY, JSON.stringify(payload));
    return payload;
  };

  window.saveSiteConfig = async function saveSiteConfigPatched(nextConfig, token) {
    const cleanConfig = normalizeConfig(nextConfig);
    const publishedConfig = await window.persistSiteConfig(cleanConfig, token);
    Object.assign(CONFIG, cleanConfig);
    return publishedConfig;
  };

  document.addEventListener('DOMContentLoaded', () => {
    const tokenField = document.getElementById('admin-github-token');
    const savedSessionToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (tokenField && savedSessionToken && !tokenField.value) {
      tokenField.value = savedSessionToken;
    }

    const status = document.getElementById('admin-persist-status');
    if (status && !status.dataset.adminSaveFix) {
      status.dataset.adminSaveFix = 'true';
      status.title = 'Salvamento corrigido: lê pela API do GitHub sem cache do raw, usa token só na sessão e explica erros.';
    }
  });
})();
