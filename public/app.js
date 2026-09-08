const state = {
  jobs: { page: 1, pageSize: 20, q: '', source: '', remote: '' },
  matches: { page: 1, pageSize: 20, minScore: 60 },
};

// ---------- helpers ----------

function showToast(message, isError = false) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.toggle('error', isError);
  el.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { el.hidden = true; }, 4000);
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let body = null;
  try { body = await res.json(); } catch { /* no body */ }
  if (!res.ok) {
    const message = body?.message || `Erro ${res.status}`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
  return body;
}

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('pt-BR');
}

function scoreClass(score) {
  if (score >= 75) return 'score-high';
  if (score >= 50) return 'score-mid';
  return 'score-low';
}

function renderPagination(container, { page, pageSize, total }, onChange) {
  container.innerHTML = '';
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const prev = document.createElement('button');
  prev.textContent = '← Anterior';
  prev.disabled = page <= 1;
  prev.onclick = () => onChange(page - 1);

  const next = document.createElement('button');
  next.textContent = 'Próxima →';
  next.disabled = page >= totalPages;
  next.onclick = () => onChange(page + 1);

  const info = document.createElement('span');
  info.textContent = `Página ${page} de ${totalPages} · ${total} resultado${total === 1 ? '' : 's'}`;

  container.append(prev, info, next);
}

// ---------- tabs ----------

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => { p.hidden = true; });
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).hidden = false;
  });
});

// ---------- vagas ----------

async function loadJobs() {
  const list = document.getElementById('jobs-list');
  list.innerHTML = '<p class="empty-state">Carregando...</p>';
  const { page, pageSize, q, source, remote } = state.jobs;
  const params = new URLSearchParams({ page, pageSize });
  if (q) params.set('q', q);
  if (source) params.set('source', source);
  if (remote) params.set('remote', remote);

  try {
    const data = await api(`/jobs?${params}`);
    if (data.items.length === 0) {
      list.innerHTML = '<p class="empty-state">Nenhuma vaga encontrada.</p>';
    } else {
      list.innerHTML = '';
      data.items.forEach((job) => list.appendChild(renderJobCard(job)));
    }
    renderPagination(document.getElementById('jobs-pagination'), data, (p) => {
      state.jobs.page = p;
      loadJobs();
    });
  } catch (err) {
    list.innerHTML = '<p class="empty-state">Falha ao carregar vagas.</p>';
    showToast(err.message, true);
  }
}

function renderJobCard(job) {
  const card = document.createElement('div');
  card.className = 'card';
  const tags = (job.tags || []).map((t) => `<span class="badge">${escapeHtml(t)}</span>`).join('');
  card.innerHTML = `
    <div class="card-title">
      <div>
        <h3><a href="${job.url}" target="_blank" rel="noopener">${escapeHtml(job.title)}</a></h3>
        <div class="card-company">${escapeHtml(job.company)}${job.location ? ' · ' + escapeHtml(job.location) : ''}</div>
      </div>
      ${job.remote ? '<span class="badge badge-remote">Remoto</span>' : ''}
    </div>
    <div class="card-meta">
      <span class="badge">${escapeHtml(job.source)}</span>
      ${job.publishedAt ? `<span>Publicada em ${formatDate(job.publishedAt)}</span>` : ''}
    </div>
    ${tags ? `<div class="tags">${tags}</div>` : ''}
  `;
  return card;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

document.getElementById('jobs-filter').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  state.jobs.page = 1;
  state.jobs.q = form.get('q')?.trim() || '';
  state.jobs.source = form.get('source') || '';
  state.jobs.remote = form.get('remote') || '';
  loadJobs();
});

document.getElementById('btn-collect').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const input = prompt('Termos de busca separados por vírgula (deixe em branco para usar o padrão do servidor):', '');
  const searchTerms = input?.trim() ? input.split(',').map((t) => t.trim()).filter(Boolean) : undefined;
  btn.disabled = true;
  btn.textContent = 'Coletando...';
  try {
    const result = await api('/jobs/collect', {
      method: 'POST',
      body: JSON.stringify(searchTerms ? { searchTerms } : {}),
    });
    showToast(`Coleta concluída: ${result.persisted} salvas, ${result.skippedDuplicates} duplicadas de ${result.received} recebidas.`);
    state.jobs.page = 1;
    loadJobs();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = '↻ Coletar vagas';
  }
});

// ---------- matches ----------

async function loadMatches() {
  const list = document.getElementById('matches-list');
  list.innerHTML = '<p class="empty-state">Carregando...</p>';
  const { page, pageSize, minScore } = state.matches;
  const params = new URLSearchParams({ page, pageSize, minScore });

  try {
    const data = await api(`/matches?${params}`);
    if (data.items.length === 0) {
      list.innerHTML = '<p class="empty-state">Nenhum match encontrado. Cadastre um perfil e rode o matching.</p>';
    } else {
      list.innerHTML = '';
      data.items.forEach((match) => list.appendChild(renderMatchCard(match)));
    }
    renderPagination(document.getElementById('matches-pagination'), data, (p) => {
      state.matches.page = p;
      loadMatches();
    });
  } catch (err) {
    list.innerHTML = '<p class="empty-state">Falha ao carregar matches.</p>';
    showToast(err.message, true);
  }
}

function renderMatchCard(match) {
  const job = match.job;
  const card = document.createElement('div');
  card.className = 'card';
  const reasons = (match.reasons || []).map((r) => `<li>${escapeHtml(r)}</li>`).join('');
  card.innerHTML = `
    <div class="card-title">
      <div>
        <h3><a href="${job.url}" target="_blank" rel="noopener">${escapeHtml(job.title)}</a></h3>
        <div class="card-company">${escapeHtml(job.company)}${job.location ? ' · ' + escapeHtml(job.location) : ''}</div>
      </div>
      <span class="score-badge ${scoreClass(match.score)}">${match.score}</span>
    </div>
    ${job.remote ? '<span class="badge badge-remote">Remoto</span>' : ''}
    ${reasons ? `<ul class="reasons">${reasons}</ul>` : ''}
  `;
  return card;
}

document.getElementById('matches-filter').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  state.matches.page = 1;
  state.matches.minScore = Number(form.get('minScore')) || 0;
  loadMatches();
});

document.getElementById('btn-run-matching').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  btn.disabled = true;
  btn.textContent = 'Rodando...';
  try {
    const result = await api('/matches/run', { method: 'POST' });
    showToast(`Matching concluído: ${result.scoredByLlm} avaliadas por LLM, ${result.discardedByPrefilter} descartadas no pré-filtro (de ${result.evaluated} vagas).`);
    state.matches.page = 1;
    loadMatches();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = '▶ Rodar matching';
  }
});

// ---------- perfil ----------

async function loadProfile() {
  try {
    const profile = await api('/profile');
    if (!profile) return;
    const form = document.getElementById('profile-form');
    form.name.value = profile.name ?? '';
    form.skills.value = (profile.skills || []).join(', ');
    form.yearsExperience.value = profile.yearsExperience ?? '';
    form.seniority.value = profile.seniority ?? 'pleno';
    form.preferences.value = profile.preferences ?? '';
  } catch (err) {
    showToast(err.message, true);
  }
}

document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const payload = {
    name: form.get('name').trim(),
    skills: form.get('skills').split(',').map((s) => s.trim()).filter(Boolean),
    yearsExperience: Number(form.get('yearsExperience')),
    seniority: form.get('seniority'),
    preferences: form.get('preferences').trim(),
  };
  try {
    await api('/profile', { method: 'PUT', body: JSON.stringify(payload) });
    showToast('Perfil salvo com sucesso.');
  } catch (err) {
    showToast(err.message, true);
  }
});

// ---------- digest ----------

document.getElementById('btn-send-digest').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  try {
    await api('/digest/send', { method: 'POST' });
    showToast('Digest enviado.');
  } catch (err) {
    showToast(err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = '✉ Enviar digest agora';
  }
});

// ---------- init ----------

loadJobs();
loadProfile();
