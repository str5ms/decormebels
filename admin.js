const leadKey = "decorMebelLeads";
const statuses = {
  new: "Новая",
  work: "В работе",
  done: "Закрыта"
};

let cachedLeads = [];

function hasStorage() {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

function loadLeads() {
  if (!hasStorage()) return cachedLeads;
  try {
    return JSON.parse(localStorage.getItem(leadKey)) || [];
  } catch {
    return cachedLeads;
  }
}

function saveLeads(leads) {
  cachedLeads = leads;
  if (!hasStorage()) return;
  localStorage.setItem(leadKey, JSON.stringify(leads));
}

async function apiRequest(path, options = {}) {
  try {
    const response = await fetch(path, options);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function syncFromServer() {
  const leads = await apiRequest("/api/leads");
  if (Array.isArray(leads)) saveLeads(leads);
}

async function syncToServer(lead, method = "PATCH") {
  await apiRequest(`/api/leads/${encodeURIComponent(lead.id)}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead)
  });
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getVisibleLeads() {
  const query = document.querySelector("[data-search]").value.trim().toLowerCase();
  const filter = document.querySelector("[data-filter]").value;
  return loadLeads().filter((lead) => {
    const matchesStatus = filter === "all" || lead.status === filter;
    const haystack = `${lead.name} ${lead.phone} ${lead.project} ${lead.budget} ${lead.message}`.toLowerCase();
    return matchesStatus && haystack.includes(query);
  });
}

function updateStats(leads) {
  document.querySelector("[data-total]").textContent = leads.length;
  document.querySelector("[data-new]").textContent = leads.filter((lead) => lead.status === "new").length;
  document.querySelector("[data-work]").textContent = leads.filter((lead) => lead.status === "work").length;
  document.querySelector("[data-done]").textContent = leads.filter((lead) => lead.status === "done").length;
}

function render() {
  const allLeads = loadLeads();
  const leads = getVisibleLeads();
  const content = document.querySelector("[data-admin-content]");
  updateStats(allLeads);

  if (!leads.length) {
    content.innerHTML = '<div class="empty-state">Пока заявок нет. Откройте главный сайт, отправьте форму, и обращение появится здесь.</div>';
    return;
  }

  content.innerHTML = `
    <table class="leads-table">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Клиент</th>
          <th>Проект</th>
          <th>Комментарий</th>
          <th>Статус</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${leads.map((lead) => `
          <tr>
            <td>${formatDate(lead.createdAt)}</td>
            <td><b>${escapeHtml(lead.name)}</b><br><a href="tel:${escapeHtml(lead.phone)}">${escapeHtml(lead.phone)}</a></td>
            <td>${escapeHtml(lead.project)}<br><span>${escapeHtml(lead.budget)}</span></td>
            <td>${escapeHtml(lead.message || "Без комментария")}</td>
            <td>
              <select class="status-select" data-status="${lead.id}">
                ${Object.entries(statuses).map(([value, label]) => `<option value="${value}" ${lead.status === value ? "selected" : ""}>${label}</option>`).join("")}
              </select>
            </td>
            <td><button class="btn subtle" type="button" data-delete="${lead.id}">Удалить</button></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function downloadCsv() {
  const rows = loadLeads();
  const header = ["Дата", "Имя", "Телефон", "Проект", "Бюджет", "Сообщение", "Статус"];
  const csvRows = [header, ...rows.map((lead) => [
    formatDate(lead.createdAt),
    lead.name,
    lead.phone,
    lead.project,
    lead.budget,
    lead.message,
    statuses[lead.status] || lead.status
  ])];

  const csv = csvRows
    .map((row) => row.map((cell) => `"${String(cell || "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "decor-mebel-leads.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function addExampleLead() {
  const leads = loadLeads();
  leads.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    createdAt: new Date().toISOString(),
    status: "new",
    name: "Айдана",
    phone: "+7 701 000 00 00",
    project: "Кухня",
    budget: "3-5 млн ₸",
    message: "Нужна кухня и стеновые панели в новую квартиру."
  });
  saveLeads(leads);
  render();
}

document.addEventListener("change", async (event) => {
  if (event.target.matches("[data-status]")) {
    const leads = loadLeads();
    const lead = leads.find((item) => item.id === event.target.dataset.status);
    if (lead) lead.status = event.target.value;
    saveLeads(leads);
    if (lead) await syncToServer(lead);
    render();
  }
});

document.addEventListener("click", async (event) => {
  const deleteButton = event.target.closest("[data-delete]");
  if (deleteButton) {
    const id = deleteButton.dataset.delete;
    saveLeads(loadLeads().filter((lead) => lead.id !== id));
    await apiRequest(`/api/leads/${encodeURIComponent(id)}`, { method: "DELETE" });
    render();
  }
});

document.querySelector("[data-search]").addEventListener("input", render);
document.querySelector("[data-filter]").addEventListener("change", render);
document.querySelector("[data-export]").addEventListener("click", downloadCsv);
document.querySelector("[data-seed]").addEventListener("click", addExampleLead);
document.querySelector("[data-clear]").addEventListener("click", async () => {
  saveLeads([]);
  await apiRequest("/api/leads", { method: "DELETE" });
  render();
});

syncFromServer().then(render);
