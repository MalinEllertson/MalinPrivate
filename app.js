const STORAGE_KEY = 'malin-flow-v1';
const THEME_KEY = 'malin-flow-theme';

const state = loadState() || {
  focus: '',
  tasks: [],
  plans: [],
  budget: { income: 0, fixed: 0 },
  archive: { completedTasks: [], completedPlans: [] },
  updatedAt: null
};

const els = {
  focusInput: document.getElementById('focusInput'),
  saveFocusBtn: document.getElementById('saveFocusBtn'),
  taskInput: document.getElementById('taskInput'),
  addTaskBtn: document.getElementById('addTaskBtn'),
  taskList: document.getElementById('taskList'),
  taskCount: document.getElementById('taskCount'),
  planTitle: document.getElementById('planTitle'),
  planWhen: document.getElementById('planWhen'),
  addPlanBtn: document.getElementById('addPlanBtn'),
  planList: document.getElementById('planList'),
  planCount: document.getElementById('planCount'),
  incomeInput: document.getElementById('incomeInput'),
  fixedInput: document.getElementById('fixedInput'),
  saveBudgetBtn: document.getElementById('saveBudgetBtn'),
  moneyLeft: document.getElementById('moneyLeft'),
  exportBtn: document.getElementById('exportBtn'),
  copyBtn: document.getElementById('copyBtn'),
  importBtn: document.getElementById('importBtn'),
  newWeekBtn: document.getElementById('newWeekBtn'),
  syncBox: document.getElementById('syncBox'),
  syncStatus: document.getElementById('syncStatus'),
  themeSelect: document.getElementById('themeSelect')
};

function saveState() {
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  els.syncStatus.textContent = `Lokal data sparad ${new Date(state.updatedAt).toLocaleString('sv-SE')}`;
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function render() {
  els.focusInput.value = state.focus || '';
  els.incomeInput.value = state.budget?.income || '';
  els.fixedInput.value = state.budget?.fixed || '';
  els.taskCount.textContent = state.tasks.length;
  els.planCount.textContent = state.plans.length;
  const left = Number(state.budget?.income || 0) - Number(state.budget?.fixed || 0);
  els.moneyLeft.textContent = `${left.toLocaleString('sv-SE')} kr`;

  els.taskList.innerHTML = state.tasks.length ? '' : '<div class="muted small">Inga uppgifter ännu</div>';
  state.tasks.forEach((task, index) => {
    const item = document.createElement('div');
    item.className = `list-item ${task.done ? 'done' : ''}`;
    item.innerHTML = `
      <div>
        <div>${escapeHtml(task.title)}</div>
        <div class="muted small">${task.done ? 'Klar' : 'Pågående'}</div>
      </div>
      <div class="sync-actions">
        <button class="btn secondary" data-task-toggle="${index}">${task.done ? 'Ångra' : 'Klar'}</button>
        <button class="btn secondary" data-task-delete="${index}">Ta bort</button>
      </div>`;
    els.taskList.appendChild(item);
  });

  els.planList.innerHTML = state.plans.length ? '' : '<div class="muted small">Inga planer ännu</div>';
  state.plans.forEach((plan, index) => {
    const item = document.createElement('div');
    item.className = `list-item ${plan.done ? 'done' : ''}`;
    item.innerHTML = `
      <div>
        <div>${escapeHtml(plan.title)}</div>
        <div class="muted small">${escapeHtml(plan.when || '')}</div>
      </div>
      <div class="sync-actions">
        <button class="btn secondary" data-plan-toggle="${index}">${plan.done ? 'Ångra' : 'Klar'}</button>
        <button class="btn secondary" data-plan-delete="${index}">Ta bort</button>
      </div>`;
    els.planList.appendChild(item);
  });
}

function escapeHtml(str='') {
  return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

els.saveFocusBtn.addEventListener('click', () => {
  state.focus = els.focusInput.value.trim();
  saveState();
  render();
});
els.addTaskBtn.addEventListener('click', () => {
  const title = els.taskInput.value.trim();
  if (!title) return;
  state.tasks.unshift({ title, done: false });
  els.taskInput.value = '';
  saveState(); render();
});
els.addPlanBtn.addEventListener('click', () => {
  const title = els.planTitle.value.trim();
  if (!title) return;
  state.plans.unshift({ title, when: els.planWhen.value.trim(), done: false });
  els.planTitle.value = ''; els.planWhen.value = '';
  saveState(); render();
});
els.saveBudgetBtn.addEventListener('click', () => {
  state.budget.income = Number(els.incomeInput.value || 0);
  state.budget.fixed = Number(els.fixedInput.value || 0);
  saveState(); render();
});

els.taskList.addEventListener('click', e => {
  const t = e.target.dataset.taskToggle;
  const d = e.target.dataset.taskDelete;
  if (t !== undefined) { state.tasks[t].done = !state.tasks[t].done; saveState(); render(); }
  if (d !== undefined) { state.tasks.splice(Number(d), 1); saveState(); render(); }
});
els.planList.addEventListener('click', e => {
  const t = e.target.dataset.planToggle;
  const d = e.target.dataset.planDelete;
  if (t !== undefined) { state.plans[t].done = !state.plans[t].done; saveState(); render(); }
  if (d !== undefined) { state.plans.splice(Number(d), 1); saveState(); render(); }
});

els.exportBtn.addEventListener('click', exportJson);
els.copyBtn.addEventListener('click', copyJson);
els.importBtn.addEventListener('click', importJson);
els.newWeekBtn.addEventListener('click', newWeekRollover);
els.themeSelect.addEventListener('change', applyTheme);

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'malin-flow-backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
async function copyJson() {
  await navigator.clipboard.writeText(JSON.stringify(state, null, 2));
  els.syncStatus.textContent = 'JSON kopierad';
}
function importJson() {
  try {
    const incoming = JSON.parse(els.syncBox.value);
    Object.assign(state, incoming);
    saveState(); render();
    els.syncStatus.textContent = 'JSON importerad';
    els.syncBox.value = '';
  } catch {
    els.syncStatus.textContent = 'Kunde inte läsa JSON';
  }
}
function newWeekRollover() {
  state.archive.completedTasks.push(...state.tasks.filter(t => t.done));
  state.archive.completedPlans.push(...state.plans.filter(p => p.done));
  state.tasks = state.tasks.filter(t => !t.done);
  state.plans = state.plans.filter(p => !p.done);
  saveState(); render();
  els.syncStatus.textContent = 'Ny vecka skapad';
}
function applyTheme() {
  const value = els.themeSelect.value;
  document.body.className = value === 'rose' ? '' : `theme-${value}`;
  localStorage.setItem(THEME_KEY, value);
}
(function initTheme(){
  const saved = localStorage.getItem(THEME_KEY) || 'rose';
  els.themeSelect.value = saved;
  applyTheme();
})();

render();
if (state.updatedAt) els.syncStatus.textContent = `Lokal data sparad ${new Date(state.updatedAt).toLocaleString('sv-SE')}`;
