const defaultData = {
  focusText: "",
  tasks: [],
  plans: [],
  budget: {
    income: 0,
    fixed: 0,
    variable: 0,
    saving: 0,
  },
  archivedWeeks: [],
  updatedAt: null,
};

let state = loadInitialState();

const els = {
  focusText: document.getElementById("focusText"),
  weekTitle: document.getElementById("weekTitle"),
  lastUpdatedLabel: document.getElementById("lastUpdatedLabel"),
  taskInput: document.getElementById("taskInput"),
  taskArea: document.getElementById("taskArea"),
  addTaskBtn: document.getElementById("addTaskBtn"),
  taskList: document.getElementById("taskList"),
  saveFocusBtn: document.getElementById("saveFocusBtn"),
  incomeInput: document.getElementById("incomeInput"),
  fixedInput: document.getElementById("fixedInput"),
  variableInput: document.getElementById("variableInput"),
  savingInput: document.getElementById("savingInput"),
  saveBudgetBtn: document.getElementById("saveBudgetBtn"),
  leftToSpend: document.getElementById("leftToSpend"),
  savingRate: document.getElementById("savingRate"),
  planTitle: document.getElementById("planTitle"),
  planDay: document.getElementById("planDay"),
  addPlanBtn: document.getElementById("addPlanBtn"),
  planList: document.getElementById("planList"),
  exportBtn: document.getElementById("exportBtn"),
  importInput: document.getElementById("importInput"),
  copyBtn: document.getElementById("copyBtn"),
  jsonBox: document.getElementById("jsonBox"),
  loadJsonBtn: document.getElementById("loadJsonBtn"),
  resetBtn: document.getElementById("resetBtn"),
  rolloverBtn: document.getElementById("rolloverBtn"),
  syncStatus: document.getElementById("syncStatus"),
  syncDot: document.getElementById("syncDot"),
};

bindEvents();
render();

function bindEvents() {
  els.saveFocusBtn.addEventListener("click", () => {
    state.focusText = els.focusText.value.trim();
    persist("Fokus sparat");
  });

  els.addTaskBtn.addEventListener("click", addTask);
  els.taskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTask();
  });

  els.saveBudgetBtn.addEventListener("click", () => {
    state.budget.income = getNumber(els.incomeInput.value);
    state.budget.fixed = getNumber(els.fixedInput.value);
    state.budget.variable = getNumber(els.variableInput.value);
    state.budget.saving = getNumber(els.savingInput.value);
    persist("Budget sparad");
  });

  els.addPlanBtn.addEventListener("click", addPlan);
  els.planTitle.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addPlan();
  });

  els.exportBtn.addEventListener("click", () => {
    window.SyncModule.exportJson(state);
    updateSyncStatus("Export klar", "good");
  });

  els.copyBtn.addEventListener("click", async () => {
    try {
      await window.SyncModule.copyJson(state);
      els.jsonBox.value = JSON.stringify(state, null, 2);
      updateSyncStatus("JSON kopierad", "good");
    } catch (error) {
      updateSyncStatus("Kunde inte kopiera", "bad");
    }
  });

  els.importInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      state = normalizeData(await window.SyncModule.importFromFile(file));
      persist("Data importerad");
    } catch (error) {
      alert(error.message);
      updateSyncStatus("Import misslyckades", "bad");
    } finally {
      e.target.value = "";
    }
  });

  els.loadJsonBtn.addEventListener("click", () => {
    try {
      state = normalizeData(window.SyncModule.parseJsonText(els.jsonBox.value));
      persist("JSON laddad");
    } catch (error) {
      alert("JSON-rutan innehåller ogiltig data.");
      updateSyncStatus("Ogiltig JSON", "bad");
    }
  });

  els.resetBtn.addEventListener("click", () => {
    const confirmed = window.confirm("Vill du nollställa hela appen? Detta går inte att ångra.");
    if (!confirmed) return;
    state = structuredClone(defaultData);
    persist("App nollställd");
  });

  els.rolloverBtn.addEventListener("click", rolloverWeek);

  document.querySelectorAll("[data-jump]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const cards = [...document.querySelectorAll(".content > .card, .content > .grid")];
      const index = Number(link.dataset.jump);
      cards[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function addTask() {
  const text = els.taskInput.value.trim();
  if (!text) return;
  state.tasks.unshift({
    id: crypto.randomUUID(),
    text,
    area: els.taskArea.value,
    done: false,
    createdAt: new Date().toISOString(),
  });
  els.taskInput.value = "";
  persist("Uppgift tillagd");
}

function addPlan() {
  const title = els.planTitle.value.trim();
  if (!title) return;
  state.plans.unshift({
    id: crypto.randomUUID(),
    title,
    day: els.planDay.value || todayISO(),
    done: false,
  });
  els.planTitle.value = "";
  persist("Plan tillagd");
}

function toggleTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;
  task.done = !task.done;
  persist(task.done ? "Uppgift klar" : "Uppgift återöppnad");
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((item) => item.id !== id);
  persist("Uppgift borttagen");
}

function togglePlan(id) {
  const plan = state.plans.find((item) => item.id === id);
  if (!plan) return;
  plan.done = !plan.done;
  persist(plan.done ? "Plan klar" : "Plan återöppnad");
}

function deletePlan(id) {
  state.plans = state.plans.filter((item) => item.id !== id);
  persist("Plan borttagen");
}

function rolloverWeek() {
  const confirmed = window.confirm("Starta ny vecka? Klara saker arkiveras och ofärdiga följer med.");
  if (!confirmed) return;

  const archived = {
    week: getWeekLabel(),
    completedTasks: state.tasks.filter((t) => t.done),
    completedPlans: state.plans.filter((p) => p.done),
    rolledAt: new Date().toISOString(),
  };

  state.archivedWeeks.unshift(archived);
  state.tasks = state.tasks
    .filter((t) => !t.done)
    .map((t) => ({ ...t, done: false }));
  state.plans = state.plans
    .filter((p) => !p.done)
    .map((p) => ({ ...p, done: false }));
  persist("Ny vecka startad");
}

function persist(message) {
  state.updatedAt = new Date().toISOString();
  window.SyncModule.saveLocal(state);
  render();
  updateSyncStatus(message, "good");
}

function loadInitialState() {
  const local = window.SyncModule.loadLocal();
  return normalizeData(local || structuredClone(defaultData));
}

function normalizeData(data) {
  return {
    ...structuredClone(defaultData),
    ...data,
    budget: {
      ...structuredClone(defaultData.budget),
      ...(data?.budget || {}),
    },
    tasks: Array.isArray(data?.tasks) ? data.tasks : [],
    plans: Array.isArray(data?.plans) ? data.plans : [],
    archivedWeeks: Array.isArray(data?.archivedWeeks) ? data.archivedWeeks : [],
  };
}

function render() {
  els.weekTitle.textContent = getWeekLabel();
  els.focusText.value = state.focusText || "";
  els.lastUpdatedLabel.textContent = state.updatedAt
    ? `Senast sparad ${formatDateTime(state.updatedAt)}`
    : "Inte uppdaterad ännu";

  els.incomeInput.value = state.budget.income || "";
  els.fixedInput.value = state.budget.fixed || "";
  els.variableInput.value = state.budget.variable || "";
  els.savingInput.value = state.budget.saving || "";

  const left = state.budget.income - state.budget.fixed - state.budget.variable - state.budget.saving;
  const rate = state.budget.income > 0 ? Math.round((state.budget.saving / state.budget.income) * 100) : 0;
  els.leftToSpend.textContent = `${formatNumber(left)} kr`;
  els.savingRate.textContent = `${rate}%`;
  els.jsonBox.value = JSON.stringify(state, null, 2);

  renderTasks();
  renderPlans();
}

function renderTasks() {
  if (!state.tasks.length) {
    els.taskList.innerHTML = `<div class="empty-state">Inga uppgifter ännu. Lägg till 1–3 tydliga saker.</div>`;
    return;
  }

  els.taskList.innerHTML = state.tasks
    .map((task) => `
      <div class="task-item">
        <div class="task-main">
          <input type="checkbox" ${task.done ? "checked" : ""} data-task-toggle="${task.id}" />
          <div>
            <div class="task-text ${task.done ? "done" : ""}">${escapeHtml(task.text)}</div>
            <div class="pill">${escapeHtml(task.area)}</div>
          </div>
        </div>
        <button class="icon-btn" data-task-delete="${task.id}">Ta bort</button>
      </div>
    `)
    .join("");

  els.taskList.querySelectorAll("[data-task-toggle]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => toggleTask(checkbox.dataset.taskToggle));
  });
  els.taskList.querySelectorAll("[data-task-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteTask(button.dataset.taskDelete));
  });
}

function renderPlans() {
  if (!state.plans.length) {
    els.planList.innerHTML = `<div class="empty-state">Ingen veckoplan ännu. Lägg in sådant du faktiskt vill se och göra.</div>`;
    return;
  }

  els.planList.innerHTML = state.plans
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((plan) => `
      <div class="plan-item">
        <div class="task-main">
          <input type="checkbox" ${plan.done ? "checked" : ""} data-plan-toggle="${plan.id}" />
          <div>
            <div class="task-text ${plan.done ? "done" : ""}">${escapeHtml(plan.title)}</div>
            <div class="subtle">${formatDate(plan.day)}</div>
          </div>
        </div>
        <button class="icon-btn" data-plan-delete="${plan.id}">Ta bort</button>
      </div>
    `)
    .join("");

  els.planList.querySelectorAll("[data-plan-toggle]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => togglePlan(checkbox.dataset.planToggle));
  });
  els.planList.querySelectorAll("[data-plan-delete]").forEach((button) => {
    button.addEventListener("click", () => deletePlan(button.dataset.planDelete));
  });
}

function updateSyncStatus(text, level = "warn") {
  els.syncStatus.textContent = text;
  els.syncDot.className = `status-dot ${level}`;
}

function getWeekLabel() {
  const now = new Date();
  const week = getISOWeekNumber(now);
  return `Vecka ${week}`;
}

function getISOWeekNumber(date) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("sv-SE");
}

function getNumber(value) {
  return Number(value) || 0;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
