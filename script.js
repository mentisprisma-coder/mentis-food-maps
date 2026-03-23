const STORAGE_KEY = "mentis_food_maps_data";
const THEME_KEY = "mentis_food_maps_theme";
const DATA_VERSION = 1;

const initialState = {
  activeView: "today",
  historyView: "timeline",
  editingMealId: null,
  editingMode: "full",
  activeMealState: "",
  draftFoods: [],
  draftEffects: []
};

const refs = {
  todayHero: document.getElementById("todayHero"),
  todayDateLabel: document.getElementById("todayDateLabel"),
  todayMealCount: document.getElementById("todayMealCount"),
  todayPendingCount: document.getElementById("todayPendingCount"),
  todayStateCount: document.getElementById("todayStateCount"),
  todaySummaryPill: document.getElementById("todaySummaryPill"),
  quickAddMealBtn: document.getElementById("quickAddMealBtn"),
  todaySection: document.getElementById("todaySection"),
  createSection: document.getElementById("createSection"),
  historySection: document.getElementById("historySection"),
  settingsSection: document.getElementById("settingsSection"),
  todayList: document.getElementById("todayList"),
  mealForm: document.getElementById("mealForm"),
  formTitle: document.getElementById("formTitle"),
  mealItemsCount: document.getElementById("mealItemsCount"),
  effectsCount: document.getElementById("effectsCount"),
  foodInput: document.getElementById("foodInput"),
  addFoodBtn: document.getElementById("addFoodBtn"),
  foodSuggestions: document.getElementById("foodSuggestions"),
  foodList: document.getElementById("foodList"),
  datetimeInput: document.getElementById("datetimeInput"),
  effectInput: document.getElementById("effectInput"),
  addEffectBtn: document.getElementById("addEffectBtn"),
  effectSuggestions: document.getElementById("effectSuggestions"),
  effectList: document.getElementById("effectList"),
  saveMealBtn: document.getElementById("saveMealBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  historyDateFilter: document.getElementById("historyDateFilter"),
  historyStateFilter: document.getElementById("historyStateFilter"),
  historyFoodFilter: document.getElementById("historyFoodFilter"),
  historyEffectFilter: document.getElementById("historyEffectFilter"),
  historyFoodSuggestions: document.getElementById("historyFoodSuggestions"),
  historyEffectSuggestions: document.getElementById("historyEffectSuggestions"),
  historySummary: document.getElementById("historySummary"),
  clearFiltersBtn: document.getElementById("clearFiltersBtn"),
  historyList: document.getElementById("historyList"),
  historyTimelineView: document.getElementById("historyTimelineView"),
  historyPatternsView: document.getElementById("historyPatternsView"),
  riskFoodsCount: document.getElementById("riskFoodsCount"),
  effectsPatternCount: document.getElementById("effectsPatternCount"),
  usedFoodsCount: document.getElementById("usedFoodsCount"),
  riskFoodsList: document.getElementById("riskFoodsList"),
  effectsPatternList: document.getElementById("effectsPatternList"),
  usedFoodsList: document.getElementById("usedFoodsList"),
  exportDataBtn: document.getElementById("exportDataBtn"),
  importDataBtn: document.getElementById("importDataBtn"),
  importDataInput: document.getElementById("importDataInput"),
  resetDataBtn: document.getElementById("resetDataBtn"),
  themeToggle: document.getElementById("themeToggle"),
  toast: document.getElementById("toast")
};

const loaded = loadData();
let state = {
  ...initialState,
  meals: loaded.meals,
  filters: {
    date: "",
    state: "",
    food: "",
    effect: ""
  }
};

bindEvents();
applyTheme();
resetDraft();
render();

function getDefaultData() {
  return {
    version: DATA_VERSION,
    meals: []
  };
}

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return getDefaultData();

  try {
    const parsed = JSON.parse(raw);
    return {
      version: DATA_VERSION,
      meals: normalizeMeals(parsed.meals)
    };
  } catch {
    return getDefaultData();
  }
}

function saveData(data = { version: DATA_VERSION, meals: state.meals }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: DATA_VERSION,
    meals: normalizeMeals(data.meals)
  }));
}

function bindEvents() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => openView(btn.dataset.view));
  });

  document.querySelectorAll(".mini-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      state.historyView = btn.dataset.historyView;
      render();
    });
  });

  document.querySelectorAll(".state-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      state.activeMealState = btn.dataset.state;
      updateStateButtons();
    });
  });

  refs.quickAddMealBtn.addEventListener("click", () => {
    resetDraft();
    openView("create");
  });
  refs.addFoodBtn.addEventListener("click", addFoodFromInput);
  refs.addEffectBtn.addEventListener("click", addEffectFromInput);
  refs.foodInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      addFoodFromInput();
    }
  });
  refs.effectInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      addEffectFromInput();
    }
  });
  refs.mealForm.addEventListener("submit", event => {
    event.preventDefault();
    submitMealForm();
  });
  refs.cancelEditBtn.addEventListener("click", () => {
    resetDraft();
    openView("today");
  });
  refs.historyDateFilter.addEventListener("input", event => {
    state.filters.date = event.target.value;
    renderHistory();
  });
  refs.historyStateFilter.addEventListener("change", event => {
    state.filters.state = event.target.value;
    renderHistory();
  });
  refs.historyFoodFilter.addEventListener("input", event => {
    state.filters.food = normalizeTerm(event.target.value);
    renderHistory();
  });
  refs.historyEffectFilter.addEventListener("input", event => {
    state.filters.effect = normalizeTerm(event.target.value);
    renderHistory();
  });
  refs.clearFiltersBtn.addEventListener("click", clearFilters);
  refs.exportDataBtn.addEventListener("click", exportBackup);
  refs.importDataBtn.addEventListener("click", () => refs.importDataInput.click());
  refs.importDataInput.addEventListener("change", importBackup);
  refs.resetDataBtn.addEventListener("click", resetAllData);
  refs.themeToggle.addEventListener("click", toggleTheme);
}

function render() {
  state.meals = normalizeMeals(state.meals);

  updateVisibleSections();
  updateNavButtons();
  updateHistoryTabs();
  updateStateButtons();
  populateSuggestions();
  renderToday();
  renderDraft();
  renderHistory();
  renderPatterns();
}

function openView(view) {
  state.activeView = view;
  if (view === "create" && !state.editingMealId) {
    refs.datetimeInput.value = toDateTimeLocalValue(new Date());
  }
  render();
}

function updateVisibleSections() {
  refs.todayHero.classList.toggle("hidden", state.activeView !== "today");
  refs.todaySection.classList.toggle("hidden", state.activeView !== "today");
  refs.createSection.classList.toggle("hidden", state.activeView !== "create");
  refs.historySection.classList.toggle("hidden", state.activeView !== "history");
  refs.settingsSection.classList.toggle("hidden", state.activeView !== "settings");
}

function updateNavButtons() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === state.activeView);
  });
}

function updateHistoryTabs() {
  document.querySelectorAll(".mini-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.historyView === state.historyView);
  });
  refs.historyTimelineView.classList.toggle("hidden", state.historyView !== "timeline");
  refs.historyPatternsView.classList.toggle("hidden", state.historyView !== "patterns");
}

function updateStateButtons() {
  document.querySelectorAll(".state-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.state === state.activeMealState);
  });
}

function renderToday() {
  const todayKey = getDayKey(new Date());
  const todayMeals = getMealsForDay(todayKey);
  const pendingCount = todayMeals.filter(meal => !meal.state).length;
  const stateCount = todayMeals.length - pendingCount;

  refs.todayDateLabel.textContent = formatLongDate(new Date());
  refs.todayMealCount.textContent = String(todayMeals.length);
  refs.todayPendingCount.textContent = String(pendingCount);
  refs.todayStateCount.textContent = String(stateCount);
  refs.todaySummaryPill.textContent = todayMeals.length
    ? `${todayMeals.length} refeições`
    : "Sem refeições";

  refs.todayList.innerHTML = todayMeals.length
    ? todayMeals.map(meal => renderMealCard(meal, "today")).join("")
    : renderEmpty("Ainda não há refeições hoje.", "Adicione a primeira refeição para começar o mapa do dia.");

  bindMealActions(refs.todayList, "today");
}

function renderDraft() {
  const isHistoryCompletion = state.editingMealId && state.editingMode === "history-complete";
  refs.formTitle.textContent = isHistoryCompletion ? "Completar refeição" : (state.editingMealId ? "Editar refeição" : "Adicionar refeição");
  refs.saveMealBtn.textContent = "Guardar refeição";
  refs.cancelEditBtn.classList.toggle("hidden", !state.editingMealId);
  refs.mealItemsCount.textContent = `${state.draftFoods.length} itens`;
  refs.effectsCount.textContent = `${state.draftEffects.length} efeitos`;
  refs.foodInput.disabled = isHistoryCompletion;
  refs.addFoodBtn.disabled = isHistoryCompletion;
  refs.datetimeInput.disabled = isHistoryCompletion;
  refs.foodList.innerHTML = state.draftFoods.length
    ? state.draftFoods.map(item => renderToken(item, "food")).join("")
    : '<div class="empty-state"><strong>Sem alimentos.</strong><span>Adicione pelo menos um item para guardar.</span></div>';
  refs.effectList.innerHTML = state.draftEffects.length
    ? state.draftEffects.map(item => renderToken(item, "effect")).join("")
    : '<div class="empty-state"><strong>Sem efeitos.</strong><span>Opcional. Pode deixar vazio.</span></div>';

  refs.foodList.querySelectorAll("[data-remove-food]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.draftFoods = state.draftFoods.filter(item => item !== btn.dataset.removeFood);
      renderDraft();
    });
  });
  refs.effectList.querySelectorAll("[data-remove-effect]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.draftEffects = state.draftEffects.filter(item => item !== btn.dataset.removeEffect);
      renderDraft();
    });
  });
}

function renderHistory() {
  const filteredMeals = getFilteredMeals();
  refs.historySummary.textContent = `${filteredMeals.length} resultados`;
  refs.historyList.innerHTML = filteredMeals.length
    ? filteredMeals.map(meal => renderMealCard(meal, "history")).join("")
    : renderEmpty("Nenhum registo encontrado.", "Ajuste os filtros ou volte a consultar mais tarde.");

  bindMealActions(refs.historyList, "history");
}

function renderPatterns() {
  const mealsWithState = state.meals.filter(meal => meal.state);
  const negativeMeals = mealsWithState.filter(meal => meal.state === "yellow" || meal.state === "red");
  const riskFoods = countItemsAcrossMeals(negativeMeals, "items");
  const effectCounts = countItemsAcrossMeals(mealsWithState, "effects");
  const usedFoods = countItemsAcrossMeals(mealsWithState, "items");

  refs.riskFoodsCount.textContent = String(riskFoods.length);
  refs.effectsPatternCount.textContent = String(effectCounts.length);
  refs.usedFoodsCount.textContent = String(usedFoods.length);

  refs.riskFoodsList.innerHTML = riskFoods.length
    ? riskFoods.slice(0, 8).map(entry => renderPatternRow(entry.label, `${entry.count} associações`)).join("")
    : renderEmpty("Sem associações negativas ainda.", "As refeições amarelas e vermelhas com estado vão aparecer aqui.");

  refs.effectsPatternList.innerHTML = effectCounts.length
    ? effectCounts.slice(0, 8).map(entry => renderPatternRow(entry.label, `${entry.count} ocorrências`)).join("")
    : renderEmpty("Sem efeitos registados.", "Os efeitos mais frequentes vão surgir aqui.");

  refs.usedFoodsList.innerHTML = usedFoods.length
    ? usedFoods.slice(0, 8).map(entry => renderPatternRow(entry.label, `${entry.count} utilizações`)).join("")
    : renderEmpty("Sem alimentos suficientes.", "Quando existir histórico com estado, os alimentos mais usados vão aparecer aqui.");
}

function renderMealCard(meal, scope) {
  const editable = canEditMeal(meal, scope);
  const completionOnly = scope === "history" && isPastMeal(meal) && !meal.state;

  return `
    <article class="meal-card" data-meal-id="${meal.id}">
      <div class="meal-card-head">
        <strong>${formatTime(meal.datetime)}</strong>
        ${renderStatePill(meal.state)}
      </div>
      <div class="meal-card-meta">
        <div class="tag-list">
          ${meal.items.map(item => `<span class="tag food-tag">${escapeHtml(item)}</span>`).join("")}
        </div>
      </div>
      ${meal.effects.length ? `
        <div class="meal-card-meta">
          <div class="tag-list">
            ${meal.effects.map(effect => `<span class="tag effect-tag">${escapeHtml(effect)}</span>`).join("")}
          </div>
        </div>
      ` : ""}
      <div class="meal-card-meta">
        <span class="tag">${formatDateTime(meal.datetime)}</span>
        ${meal.state ? `<span class="tag">${meal.effects.length ? `${meal.effects.length} efeitos` : "Sem efeitos"}</span>` : '<span class="tag">Por definir</span>'}
      </div>
      ${editable ? `
        <div class="meal-card-actions">
          <button class="edit-inline-btn" type="button" data-edit-meal="${meal.id}">
            ${completionOnly ? "Completar estado" : "Editar refeição"}
          </button>
        </div>
      ` : ""}
    </article>
  `;
}

function bindMealActions(container, scope) {
  container.querySelectorAll("[data-edit-meal]").forEach(btn => {
    btn.addEventListener("click", () => startEditMeal(btn.dataset.editMeal, scope));
  });
}

function startEditMeal(mealId, scope) {
  const meal = state.meals.find(item => item.id === mealId);
  if (!meal || !canEditMeal(meal, scope)) return;

  state.editingMealId = meal.id;
  state.editingMode = scope === "history" ? "history-complete" : "full";
  state.draftFoods = [...meal.items];
  state.draftEffects = [...meal.effects];
  state.activeMealState = meal.state || "";
  refs.datetimeInput.value = toDateTimeLocalValue(meal.datetime);
  openView("create");
}

function canEditMeal(meal, scope) {
  if (scope === "today") return isSameDay(meal.datetime, new Date());
  if (!isPastMeal(meal)) return false;
  return !meal.state;
}

function submitMealForm() {
  if (!state.draftFoods.length) {
    refs.foodInput.focus();
    showToast("Adicione pelo menos um alimento.");
    return;
  }

  const currentMeal = state.editingMealId
    ? state.meals.find(item => item.id === state.editingMealId)
    : null;
  const datetime = state.editingMode === "history-complete"
    ? currentMeal?.datetime
    : refs.datetimeInput.value;
  if (!datetime) {
    refs.datetimeInput.focus();
    return;
  }

  const meal = buildMeal({
    id: state.editingMealId,
    items: state.draftFoods,
    datetime,
    state: state.activeMealState,
    effects: state.draftEffects
  });

  if (state.editingMealId) {
    state.meals = state.meals.map(item => item.id === state.editingMealId ? meal : item);
    showToast("Refeição atualizada.");
  } else {
    state.meals.unshift(meal);
    showToast("Refeição guardada.");
  }

  saveData();
  const viewAfterSave = isSameDay(meal.datetime, new Date()) ? "today" : "history";
  resetDraft();
  openView(viewAfterSave);
}

function buildMeal({ id, items, datetime, state, effects }) {
  return {
    id: id || crypto.randomUUID(),
    items: dedupeTerms(items),
    datetime: normalizeDateTime(datetime),
    state: normalizeState(state),
    effects: dedupeTerms(effects)
  };
}

function resetDraft() {
  state.editingMealId = null;
  state.editingMode = "full";
  state.activeMealState = "";
  state.draftFoods = [];
  state.draftEffects = [];
  refs.foodInput.value = "";
  refs.effectInput.value = "";
  refs.datetimeInput.value = toDateTimeLocalValue(new Date());
  renderDraft();
}

function addFoodFromInput() {
  const value = normalizeTerm(refs.foodInput.value);
  if (!value) return;
  if (state.draftFoods.includes(value)) {
    refs.foodInput.value = "";
    return;
  }
  state.draftFoods = [...state.draftFoods, value];
  refs.foodInput.value = "";
  renderDraft();
}

function addEffectFromInput() {
  const value = normalizeTerm(refs.effectInput.value);
  if (!value) return;
  if (state.draftEffects.includes(value)) {
    refs.effectInput.value = "";
    return;
  }
  state.draftEffects = [...state.draftEffects, value];
  refs.effectInput.value = "";
  renderDraft();
}

function populateSuggestions() {
  const foodTerms = getSuggestionTerms("items");
  const effectTerms = getSuggestionTerms("effects");
  refs.foodSuggestions.innerHTML = foodTerms.map(term => `<option value="${escapeHtml(term)}"></option>`).join("");
  refs.effectSuggestions.innerHTML = effectTerms.map(term => `<option value="${escapeHtml(term)}"></option>`).join("");
  refs.historyFoodSuggestions.innerHTML = refs.foodSuggestions.innerHTML;
  refs.historyEffectSuggestions.innerHTML = refs.effectSuggestions.innerHTML;
}

function getSuggestionTerms(key) {
  const counts = countItemsAcrossMeals(state.meals, key);
  return counts.map(entry => entry.label);
}

function getFilteredMeals() {
  return state.meals.filter(meal => {
    if (state.filters.date && getDayKey(meal.datetime) !== state.filters.date) return false;
    if (state.filters.state) {
      if (state.filters.state === "unset" && meal.state) return false;
      if (state.filters.state !== "unset" && meal.state !== state.filters.state) return false;
    }
    if (state.filters.food && !meal.items.some(item => item.includes(state.filters.food))) return false;
    if (state.filters.effect && !meal.effects.some(effect => effect.includes(state.filters.effect))) return false;
    return true;
  });
}

function clearFilters() {
  state.filters = { date: "", state: "", food: "", effect: "" };
  refs.historyDateFilter.value = "";
  refs.historyStateFilter.value = "";
  refs.historyFoodFilter.value = "";
  refs.historyEffectFilter.value = "";
  renderHistory();
}

function getMealsForDay(dayKey) {
  return state.meals.filter(meal => getDayKey(meal.datetime) === dayKey);
}

function isPastMeal(meal) {
  return getDayKey(meal.datetime) < getDayKey(new Date());
}

function normalizeMeals(meals) {
  if (!Array.isArray(meals)) return [];
  return [...meals]
    .filter(item => item && typeof item === "object")
    .map(item => ({
      id: item.id || crypto.randomUUID(),
      items: dedupeTerms(item.items),
      datetime: normalizeDateTime(item.datetime || item.date || new Date()),
      state: normalizeState(item.state),
      effects: dedupeTerms(item.effects)
    }))
    .filter(item => item.items.length)
    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
}

function dedupeTerms(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map(normalizeTerm).filter(Boolean))];
}

function normalizeTerm(value) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").toLowerCase()
    : "";
}

function normalizeState(value) {
  return ["green", "yellow", "red"].includes(value) ? value : "";
}

function countItemsAcrossMeals(meals, key) {
  const counts = {};
  meals.forEach(meal => {
    const uniqueItems = [...new Set(meal[key] || [])];
    uniqueItems.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function renderToken(label, type) {
  return `
    <span class="token">
      ${escapeHtml(label)}
      <button type="button" ${state.editingMode === "history-complete" && type === "food" ? "disabled" : ""} data-remove-${type}="${escapeHtml(label)}">×</button>
    </span>
  `;
}

function renderPatternRow(title, meta) {
  return `
    <div class="pattern-row">
      <div>
        <strong>${escapeHtml(title)}</strong>
        <span class="section-copy">${escapeHtml(meta)}</span>
      </div>
    </div>
  `;
}

function renderStatePill(stateValue) {
  if (!stateValue) return '<span class="state-pill unset">Por definir</span>';
  const labels = {
    green: "Verde",
    yellow: "Amarelo",
    red: "Vermelho"
  };
  return `<span class="state-pill ${stateValue}">${labels[stateValue]}</span>`;
}

function renderEmpty(title, subtitle) {
  return `<div class="empty-state"><strong>${title}</strong><span>${subtitle}</span></div>`;
}

function formatLongDate(dateValue) {
  return new Date(dateValue).toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).replace(/^./, char => char.toUpperCase());
}

function formatTime(dateValue) {
  return new Date(dateValue).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDateTime(dateValue) {
  return new Date(dateValue).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getDayKey(dateValue) {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDay(left, right) {
  return getDayKey(left) === getDayKey(right);
}

function toDateTimeLocalValue(dateValue) {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function normalizeDateTime(dateValue) {
  if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateValue)) {
    return dateValue.slice(0, 16);
  }

  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? toDateTimeLocalValue(new Date()) : toDateTimeLocalValue(date);
}

function exportBackup() {
  const blob = new Blob([localStorage.getItem(STORAGE_KEY) || "{}"], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `food-maps-backup-${getDayKey(new Date())}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const raw = await file.text();
    const parsed = JSON.parse(raw);
    state.meals = normalizeMeals(parsed.meals);
    saveData();
    clearFilters();
    resetDraft();
    showToast("Dados importados.");
    openView("today");
  } catch {
    showToast("Não foi possível importar o ficheiro.");
  } finally {
    refs.importDataInput.value = "";
    render();
  }
}

function resetAllData() {
  const confirmed = window.confirm("Quer apagar todos os registos do Food Maps?");
  if (!confirmed) return;
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

function showToast(message) {
  refs.toast.textContent = message;
  refs.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    refs.toast.classList.remove("show");
  }, 2200);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function applyTheme() {
  const theme = localStorage.getItem(THEME_KEY) || "light";
  document.body.classList.toggle("dark", theme === "dark");
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme();
}
