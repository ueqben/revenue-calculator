/* ══════════════════════════════════════════
   REVENUE CALCULATOR — app.js
   Pure vanilla JS, no libraries needed.
   All data lives in the `clients` array.
══════════════════════════════════════════ */

// ── State ─────────────────────────────────
// Each client: { id, name, weeklyHours, rate }
// Monthly hours = weeklyHours * 4
const WEEKS_PER_MONTH = 4;
let clients = [];
let nextId = 1;

// ── Helpers ───────────────────────────────

/** Format a number as USD currency string. */
function fmt(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/** Format a whole number of hours as a plain integer string. */
function fmtHours(n) {
  return Math.round(n).toString();
}

/** Monthly hours for a single client (weekly × 4). */
function monthlyHours(client) {
  return client.weeklyHours * WEEKS_PER_MONTH;
}

/** Calculate monthly subtotal for a single client. */
function subtotal(client) {
  return monthlyHours(client) * client.rate;
}

/** Calculate total monthly revenue across all clients. */
function totalRevenue() {
  return clients.reduce((sum, c) => sum + subtotal(c), 0);
}

/** Total weekly hours across all clients. */
function totalWeeklyHours() {
  return clients.reduce((sum, c) => sum + c.weeklyHours, 0);
}

// ── Add Client ────────────────────────────

function addClient() {
  const nameEl  = document.getElementById("client-name");
  const hoursEl = document.getElementById("client-hours");
  const rateEl  = document.getElementById("client-rate");
  const errorEl = document.getElementById("form-error");

  const name        = nameEl.value.trim();
  const weeklyHours = parseInt(hoursEl.value, 10);
  const rate        = parseInt(rateEl.value, 10);

  // Validation
  if (!name) {
    showError(errorEl, "Please enter a client name.");
    nameEl.focus();
    return;
  }
  if (isNaN(weeklyHours) || weeklyHours < 0) {
    showError(errorEl, "Please enter a valid number of weekly hours (0 or more).");
    hoursEl.focus();
    return;
  }
  if (isNaN(rate) || rate < 0) {
    showError(errorEl, "Please enter a valid hourly rate (0 or more).");
    rateEl.focus();
    return;
  }

  // Clear error and add client
  errorEl.textContent = "";
  clients.push({ id: nextId++, name, weeklyHours, rate });

  // Reset form
  nameEl.value  = "";
  hoursEl.value = "";
  rateEl.value  = "";
  nameEl.focus();

  render();
}

function showError(el, msg) {
  el.textContent = msg;
  // Auto-clear after 3 seconds
  setTimeout(() => { if (el.textContent === msg) el.textContent = ""; }, 3000);
}

// ── Remove Client ─────────────────────────

function removeClient(id) {
  clients = clients.filter(c => c.id !== id);
  render();
}

// ── Clear All ─────────────────────────────

function clearAll() {
  if (clients.length === 0) return;
  if (!confirm(`Remove all ${clients.length} client(s)? This cannot be undone.`)) return;
  clients = [];
  render();
}

// ── Inline Editing ────────────────────────
// When a user edits a cell in the table, we update the data immediately.

function handleEdit(id, field, rawValue) {
  const client = clients.find(c => c.id === id);
  if (!client) return;

  if (field === "name") {
    client.name = rawValue.trim() || client.name; // don't allow blank name
  } else if (field === "weeklyHours") {
    const v = parseInt(rawValue, 10);
    if (!isNaN(v) && v >= 0) client.weeklyHours = v;
  } else if (field === "rate") {
    const v = parseInt(rawValue, 10);
    if (!isNaN(v) && v >= 0) client.rate = v;
  }

  render();
}

// ── Render ────────────────────────────────
// Full re-render every time data changes. Fine for this scale.

function render() {
  renderSidebar();
  renderTable();
}

function renderSidebar() {
  const total   = totalRevenue();
  const wkHrs   = totalWeeklyHours();
  const moHrs   = wkHrs * WEEKS_PER_MONTH;
  const count   = clients.length;

  // Avg rate: weighted by monthly hours; fall back to simple average if no hours logged
  let avgRate = 0;
  if (moHrs > 0) {
    avgRate = total / moHrs;
  } else if (count > 0) {
    avgRate = clients.reduce((s, c) => s + c.rate, 0) / count;
  }

  const avgRev = count > 0 ? total / count : 0;

  // Top client by monthly subtotal
  const top = clients.reduce((best, c) =>
    (!best || subtotal(c) > subtotal(best)) ? c : best, null);

  document.getElementById("total-revenue").textContent = fmt(total);
  document.getElementById("total-clients").textContent = count;
  document.getElementById("total-hours").textContent   = fmtHours(wkHrs);
  document.getElementById("avg-rate").textContent      = fmt(avgRate);
  document.getElementById("avg-revenue").textContent   = fmt(avgRev);
  document.getElementById("top-client").textContent    = top ? top.name : "—";
}

function renderTable() {
  const emptyState   = document.getElementById("empty-state");
  const tableWrapper = document.getElementById("table-wrapper");
  const tbody        = document.getElementById("client-tbody");
  const tableCount   = document.getElementById("table-count");

  const total  = totalRevenue();
  const wkHrs  = totalWeeklyHours();
  const moHrs  = wkHrs * WEEKS_PER_MONTH;

  // Toggle empty state
  if (clients.length === 0) {
    emptyState.style.display   = "flex";
    tableWrapper.style.display = "none";
    tableCount.textContent     = "0 clients";

    // Reset footer
    document.getElementById("foot-hours-wk").textContent = "0";
    document.getElementById("foot-hours-mo").textContent = "0";
    document.getElementById("foot-total").textContent    = "$0.00";
    return;
  }

  emptyState.style.display   = "none";
  tableWrapper.style.display = "block";
  tableCount.textContent     = `${clients.length} client${clients.length !== 1 ? "s" : ""}`;

  // Build table rows
  tbody.innerHTML = "";
  clients.forEach((client, index) => {
    const moHrsClient = monthlyHours(client);
    const sub         = subtotal(client);
    const pct         = total > 0 ? (sub / total) * 100 : 0;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="col-num">${index + 1}</td>

      <td class="col-name">
        <input
          class="inline-input"
          type="text"
          value="${escapeHtml(client.name)}"
          aria-label="Client name"
          onchange="handleEdit(${client.id}, 'name', this.value)"
        />
      </td>

      <td class="col-hours">
        <input
          class="inline-input"
          type="number"
          value="${client.weeklyHours}"
          min="0" step="1"
          aria-label="Weekly hours"
          onchange="handleEdit(${client.id}, 'weeklyHours', this.value)"
        />
      </td>

      <td class="col-hours-mo">${fmtHours(moHrsClient)}</td>

      <td class="col-rate">
        <input
          class="inline-input"
          type="number"
          value="${client.rate}"
          min="0" step="1"
          aria-label="Hourly rate"
          onchange="handleEdit(${client.id}, 'rate', this.value)"
        />
      </td>

      <td class="col-subtotal subtotal-cell">${fmt(sub)}</td>

      <td class="col-share">
        <div class="share-wrap">
          <div class="share-bar-bg">
            <div class="share-bar-fill" style="width: ${pct.toFixed(1)}%"></div>
          </div>
          <span class="share-pct">${pct.toFixed(1)}%</span>
        </div>
      </td>

      <td class="col-actions">
        <button
          class="btn-icon"
          onclick="removeClient(${client.id})"
          title="Remove ${escapeHtml(client.name)}"
        >✕</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Update footer totals
  document.getElementById("foot-hours-wk").textContent = fmtHours(wkHrs);
  document.getElementById("foot-hours-mo").textContent = fmtHours(moHrs);
  document.getElementById("foot-total").textContent    = fmt(total);
}

/** Prevent XSS when injecting user-supplied strings into innerHTML */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Init ──────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Display current month in nav bar
  const now = new Date();
  document.getElementById("nav-month").textContent = now.toLocaleDateString("en-US", {
    month: "long",
    year:  "numeric",
  });

  // Allow Enter key in form inputs to trigger addClient
  ["client-name", "client-hours", "client-rate"].forEach(id => {
    document.getElementById(id).addEventListener("keydown", e => {
      if (e.key === "Enter") addClient();
    });
  });

  // Seed with a couple of demo clients so the table isn't blank on load
  clients = [
    { id: nextId++, name: "Acme Corp",        weeklyHours: 10, rate: 150 },
    { id: nextId++, name: "Bright Ideas LLC", weeklyHours: 5,  rate: 200 },
    { id: nextId++, name: "Harbor Studio",    weeklyHours: 8,  rate: 95  },
  ];

  render();
});
