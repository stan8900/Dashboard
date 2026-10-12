const STORAGE_KEY = "residence-ops-dashboard-v1";
const config = window.DASHBOARD_CONFIG || {};

const defaultState = {
  profile: {
    staffInitials: "",
    staffEmail: "",
    loggedIn: false,
    refreshRequired: false,
  },
  replacementRecords: [],
  lockoutRecords: [],
};

const state = loadState();
let selectedChartMode = "all";

const hallsByComplex = {
  "Bishops Complex": ["Bishops", "Kilmorey", "Lacy", "St Margarets"],
  "Faraday Complex": ["Faraday 1", "Faraday 2", "Faraday 3", "Faraday 4", "Faraday 5", "Faraday 6", "Faraday 7"],
  "Isambard Complex": [
    "Trevor Slater",
    "Shoreditch",
    "Syd Urry",
    "George Shipp",
    "Concourse",
    "Brian Winstanley",
    "South",
    "Michael Bevis",
    "David Neave",
    "Central",
    "North",
    "Maurice Kogan",
    "East",
    "Runnymede",
    "West",
    "Stephen Bragg",
    "Meadow",
  ],
  "Lancaster Complex": ["Borough Road", "Lancaster Lodge", "Maria Grey", "Stockwell", "Gordon", "Southwark"],
  "Standard Halls": ["Chepstow", "Clifton", "Saltash"],
  "Mill Hall": ["Mill Hall"],
  "Fleming Hall": ["Fleming Hall"],
  "Galbraith Hall": ["Galbraith Hall"],
};

const replacementItems = {
  flatKey: "Replacement Flat Key",
  roomKey: "Replacement Room Key",
  hid: "Replacement Salto HID Card",
  visitor: "Replacement Sateon Visitor Card",
};

const flatRoomKeyLocations = new Set([
  "Bishops",
  "Kilmorey",
  "Lacy",
  "Faraday 1",
  "Faraday 2",
  "Faraday 3",
  "Faraday 4",
  "Faraday 5",
  "Faraday 6",
  "Faraday 7",
  "Fleming Hall",
  "Galbraith Hall",
  "Stockwell",
  "Southwark",
  "Maria Grey",
  "Gordon",
]);

const defaultVisitorCardComplexes = new Set([
  "Bishops Complex",
  "Lancaster Complex",
  "Faraday Complex",
  "Mill Hall",
  "Fleming Hall",
  "Galbraith Hall",
]);

if (!isLoggedIn()) {
  window.location.replace("./login.html");
}

const els = {
  overdueCount: document.querySelector("#overdueCount"),
  dueSoonCount: document.querySelector("#dueSoonCount"),
  chargeCount: document.querySelector("#chargeCount"),
  openCount: document.querySelector("#openCount"),
  overviewSearch: document.querySelector("#overviewSearch"),
  navSearch: document.querySelector(".nav-search"),
  monthlyChart: document.querySelector("#monthlyChart"),
  chartTotal: document.querySelector("#chartTotal"),
  priorityList: document.querySelector("#priorityList"),
  chargeValue: document.querySelector("#chargeValue"),
  replacementRows: document.querySelector("#replacementRows"),
  replacementComplex: document.querySelector("#replacementComplex"),
  replacementHall: document.querySelector("#replacementHall"),
  replacementCollectedField: document.querySelector("#replacementCollectedField"),
  replacementCollectedItems: document.querySelector("#replacementCollectedItems"),
  replacementStaffInitials: document.querySelector("#replacementStaffInitials"),
  backendPasteInitials: document.querySelector("#backendPasteInitials"),
  backendPasteRows: document.querySelector("#backendPasteRows"),
  backendPasteStatus: document.querySelector("#backendPasteStatus"),
  importBackendPaste: document.querySelector("#importBackendPaste"),
  clearBackendPaste: document.querySelector("#clearBackendPaste"),
  lockoutRows: document.querySelector("#lockoutRows"),
  checkList: document.querySelector("#checkList"),
  emptyStateTemplate: document.querySelector("#emptyStateTemplate"),
  replacementRecordForm: document.querySelector("#replacementRecordForm"),
  replacementFilterForm: document.querySelector("#replacementFilterForm"),
  lockoutRecordForm: document.querySelector("#lockoutRecordForm"),
  clearReplacementFilters: document.querySelector("#clearReplacementFilters"),
  menuToggle: document.querySelector("#menuToggle"),
  menuClose: document.querySelector("#menuClose"),
  menuScrim: document.querySelector("#menuScrim"),
  sideMenu: document.querySelector("#sideMenu"),
  tabSlider: document.querySelector(".tab-slider"),
};

const linkFields = {
  replacementForm: {
    url: config.replacementFormUrl,
    anchor: document.querySelector("#replacementFormLink"),
  },
  replacementBackend: {
    url: config.replacementBackendUrl,
    anchor: document.querySelector("#replacementBackendLink"),
  },
  lockoutForm: {
    url: config.lockoutFormUrl,
    anchor: document.querySelector("#lockoutFormLink"),
  },
  lockoutBackend: {
    url: config.lockoutBackendUrl,
    anchor: document.querySelector("#lockoutBackendLink"),
  },
};

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => switchTab(tab.dataset.tab));
});

window.addEventListener("resize", updateTabSlider);

document.querySelectorAll("[data-tab-target]").forEach((button) => {
  button.addEventListener("click", () => {
    switchTab(button.dataset.tabTarget);
    closeMenu();
  });
});

document.querySelectorAll(".chart-mode").forEach((button) => {
  button.addEventListener("click", () => {
    selectedChartMode = button.dataset.chartMode;
    document.querySelectorAll(".chart-mode").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    renderOverview();
  });
});

els.overviewSearch.addEventListener("input", renderOverview);
els.navSearch.addEventListener("click", () => els.overviewSearch.focus());
els.replacementComplex.addEventListener("change", () => {
  populateReplacementHalls();
  populateReplacementItems();
});
els.replacementHall.addEventListener("change", populateReplacementItems);
els.importBackendPaste.addEventListener("click", importPastedBackendRows);
els.clearBackendPaste.addEventListener("click", clearPastedBackendRows);

els.menuToggle.addEventListener("click", openMenu);
els.menuClose.addEventListener("click", closeMenu);
els.menuScrim.addEventListener("click", closeMenu);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

els.replacementRecordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!els.replacementRecordForm.reportValidity()) return;

  const collectedItems = getCollectedItems();
  if (!collectedItems.length) {
    alert("Select at least one collected replacement item.");
    return;
  }

  const record = {
    id: crypto.randomUUID(),
    studentId: getValue("replacementStudentId"),
    buildingComplex: getValue("replacementComplex"),
    hall: getValue("replacementHall"),
    flatNumber: getValue("replacementFlat"),
    room: getValue("replacementRoom"),
    collectedItems,
    keySet: collectedItems.join(", "),
    chargeConfirmed: getValue("replacementChargeConfirm") === "Yes",
    staffInitials: getValue("replacementStaffInitials").toUpperCase(),
    issuedDate: getValue("replacementIssued"),
    returnedDate: getValue("replacementReturned"),
    msFormsStatus: "Prepared",
  };

  state.replacementRecords.push(record);
  els.replacementRecordForm.reset();
  setDefaultDates();
  populateReplacementHalls();
  populateReplacementItems();
  persist();
  render();
});

els.replacementFilterForm.addEventListener("input", renderReplacementRows);

els.clearReplacementFilters.addEventListener("click", () => {
  els.replacementFilterForm.reset();
  renderReplacementRows();
});

els.lockoutRecordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const record = {
    id: crypto.randomUUID(),
    studentId: getValue("lockoutStudentId"),
    room: getValue("lockoutRoom"),
    date: getValue("lockoutDate"),
    staff: getValue("lockoutStaff"),
    source: getValue("lockoutSource"),
    notes: getValue("lockoutNotes"),
  };

  state.lockoutRecords.push(record);
  els.lockoutRecordForm.reset();
  setDefaultDates();
  persist();
  render();
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;

  const { type, id } = button.dataset;
  const key = type === "replacement" ? "replacementRecords" : "lockoutRecords";
  state[key] = state[key].filter((record) => record.id !== id);
  persist();
  render();
});

function loadState() {
  try {
    return {
      ...structuredClone(defaultState),
      ...JSON.parse(localStorage.getItem(STORAGE_KEY)),
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function isLoggedIn() {
  return Boolean(state.profile?.loggedIn && !state.profile?.refreshRequired);
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  renderLinks();
  renderOverview();
  renderReplacementRows();
  renderLockoutRows();
  renderChecks();
  renderSummary();
  updateTabSlider();
}

function renderLinks() {
  Object.values(linkFields).forEach((field) => {
    const url = field.url || "";
    field.anchor.href = url || "#";
    field.anchor.setAttribute("aria-disabled", url ? "false" : "true");
    field.anchor.target = url ? "_blank" : "";
    field.anchor.rel = url ? "noreferrer" : "";
  });
}

function switchTab(tabId) {
  document.querySelectorAll(".tab").forEach((item) => {
    const isActive = item.dataset.tab === tabId;
    item.classList.toggle("active", isActive);
    item.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  document.querySelectorAll(".tab-view").forEach((view) => {
    view.classList.toggle("active", view.id === tabId);
  });

  updateTabSlider();
}

function updateTabSlider() {
  const activeTab = document.querySelector(".tab.active");
  if (!activeTab || !els.tabSlider) return;

  els.tabSlider.style.width = `${activeTab.offsetWidth}px`;
  els.tabSlider.style.transform = `translateX(${activeTab.offsetLeft - 10}px)`;
}

function openMenu() {
  els.sideMenu.classList.add("open");
  els.sideMenu.setAttribute("aria-hidden", "false");
  els.menuToggle.setAttribute("aria-expanded", "true");
  els.menuScrim.hidden = false;
}

function closeMenu() {
  els.sideMenu.classList.remove("open");
  els.sideMenu.setAttribute("aria-hidden", "true");
  els.menuToggle.setAttribute("aria-expanded", "false");
  els.menuScrim.hidden = true;
}

function renderReplacementRows() {
  els.replacementRows.innerHTML = "";

  if (!state.replacementRecords.length) {
    appendEmptyRow(els.replacementRows, "No records yet.");
    return;
  }

  const visibleRecords = sortedByDate(state.replacementRecords, "issuedDate").filter(matchesReplacementFilters);

  if (!visibleRecords.length) {
    appendEmptyRow(els.replacementRows, "No matching replacement records.");
    return;
  }

  visibleRecords.forEach((record) => {
    const status = getReplacementStatus(record);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="student-cell"><strong>${escapeHtml(record.studentId)}</strong></td>
      <td>${escapeHtml(replacementLocation(record))}</td>
      <td>${escapeHtml(record.keySet || "Replacement item")}</td>
      <td>${formatDate(record.issuedDate)}</td>
      <td>${formatDate(status.dueDate)}</td>
      <td>${record.returnedDate ? formatDate(record.returnedDate) : "Not returned"}</td>
      <td><span class="status-pill ${status.className}">${status.label}</span></td>
      <td><span class="status-pill status-info">${escapeHtml(record.msFormsStatus || "Local")}</span></td>
      <td><button class="row-action" type="button" data-delete data-type="replacement" data-id="${record.id}">Delete</button></td>
    `;
    els.replacementRows.append(row);
  });
}

function importPastedBackendRows() {
  const initials = (els.backendPasteInitials.value || getSavedInitials() || "SJ").trim().toUpperCase();
  const pastedRows = parsePastedTable(els.backendPasteRows.value)
    .filter((row) => rowMentionsInitials(row, initials))
    .map((row, index) => mapPastedReplacementRow(row, index, initials));

  state.replacementRecords = [
    ...state.replacementRecords.filter((record) => record.source !== "paste"),
    ...pastedRows,
  ];

  persist();
  render();
  els.backendPasteStatus.textContent = `${pastedRows.length} pasted backend ${pastedRows.length === 1 ? "row" : "rows"} imported for ${initials}.`;
}

function clearPastedBackendRows() {
  state.replacementRecords = state.replacementRecords.filter((record) => record.source !== "paste");
  els.backendPasteRows.value = "";
  els.backendPasteStatus.textContent = "No pasted backend rows imported.";
  persist();
  render();
}

function renderLockoutRows() {
  els.lockoutRows.innerHTML = "";

  if (!state.lockoutRecords.length) {
    appendEmptyRow(els.lockoutRows, "No records yet.");
    return;
  }

  const counts = lockoutCounts();
  sortedByDate(state.lockoutRecords, "date").forEach((record) => {
    const countAtRecord = lockoutNumberFor(record);
    const chargeable = countAtRecord > 1;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="student-cell"><strong>${escapeHtml(record.studentId)}</strong></td>
      <td>${escapeHtml(record.room)}</td>
      <td>${formatDate(record.date)}</td>
      <td>${countAtRecord} of ${counts[normaliseId(record.studentId)] || 1}</td>
      <td><span class="status-pill ${chargeable ? "status-charge" : "status-ok"}">${chargeable ? "£15 charge" : "First lockout"}</span></td>
      <td>${escapeHtml(record.staff)} · ${escapeHtml(record.source)}</td>
      <td><button class="row-action" type="button" data-delete data-type="lockout" data-id="${record.id}">Delete</button></td>
    `;
    els.lockoutRows.append(row);
  });
}

function renderChecks() {
  const checks = [
    ...state.replacementRecords
      .map((record) => ({ record, status: getReplacementStatus(record) }))
      .filter(({ status }) => ["overdue", "due"].includes(status.type))
      .map(({ record, status }) => ({
        type: status.type,
        title: `${record.studentId} · replacement key set`,
        detail:
          status.type === "overdue"
            ? `Set ${record.keySet} was due back on ${formatDate(status.dueDate)} and is still not returned.`
            : `Set ${record.keySet} is due back on ${formatDate(status.dueDate)}.`,
        pill: status.label,
      })),
    ...state.lockoutRecords
      .filter((record) => lockoutNumberFor(record) > 1)
      .map((record) => ({
        type: "charge",
        title: `${record.studentId} · lockout charge`,
        detail: `Lockout number ${lockoutNumberFor(record)} recorded on ${formatDate(record.date)}. Charge £15.`,
        pill: "£15 charge",
      })),
  ];

  els.checkList.innerHTML = "";
  if (!checks.length) {
    const empty = document.createElement("div");
    empty.className = "check-item";
    empty.innerHTML = "<div><h3>No exceptions</h3><p>Replacement returns and lockout charges are clear.</p></div>";
    els.checkList.append(empty);
    return;
  }

  checks.forEach((check) => {
    const item = document.createElement("article");
    item.className = `check-item ${check.type}`;
    item.innerHTML = `
      <div>
        <h3>${escapeHtml(check.title)}</h3>
        <p>${escapeHtml(check.detail)}</p>
      </div>
      <span class="status-pill ${check.type === "charge" ? "status-charge" : check.type === "overdue" ? "status-overdue" : "status-due"}">${escapeHtml(check.pill)}</span>
    `;
    els.checkList.append(item);
  });
}

function renderSummary() {
  const replacementStatuses = state.replacementRecords.map(getReplacementStatus);
  const overdue = replacementStatuses.filter((status) => status.type === "overdue").length;
  const dueSoon = replacementStatuses.filter((status) => status.type === "due").length;
  const chargeable = state.lockoutRecords.filter((record) => lockoutNumberFor(record) > 1).length;

  els.overdueCount.textContent = overdue;
  els.dueSoonCount.textContent = dueSoon;
  els.chargeCount.textContent = chargeable;
  els.openCount.textContent = overdue + dueSoon + chargeable;
}

function renderOverview() {
  renderMonthlyChart();
  renderPriorityList();
  const chargeable = state.lockoutRecords.filter((record) => lockoutNumberFor(record) > 1).length;
  els.chargeValue.textContent = `£${chargeable * 15}`;
}

function renderMonthlyChart() {
  const monthly = Array.from({ length: 12 }, (_, index) => ({
    month: new Date(2026, index, 1).toLocaleString("en-GB", { month: "short" }),
    value: 0,
  }));

  state.replacementRecords.forEach((record) => {
    if (["all", "replacement"].includes(selectedChartMode)) {
      monthly[dateOnly(record.issuedDate).getMonth()].value += 1;
    }
  });

  state.lockoutRecords.forEach((record) => {
    const month = dateOnly(record.date).getMonth();
    if (["all", "lockout"].includes(selectedChartMode)) {
      monthly[month].value += 1;
    }
    if (selectedChartMode === "charges" && lockoutNumberFor(record) > 1) {
      monthly[month].value += 1;
    }
  });

  const max = Math.max(...monthly.map((item) => item.value), 1);
  const total = monthly.reduce((sum, item) => sum + item.value, 0);
  els.chartTotal.textContent = `${total} ${total === 1 ? "event" : "events"} this year`;
  els.monthlyChart.innerHTML = "";

  monthly.forEach((item) => {
    const bar = document.createElement("button");
    bar.className = `bar-column${item.value ? "" : " empty"}`;
    bar.type = "button";
    bar.title = `${item.month}: ${item.value}`;
    bar.innerHTML = `
      <span class="bar-value">${item.value}</span>
      <span class="bar-track"><span style="height: ${Math.max((item.value / max) * 100, item.value ? 12 : 2)}%"></span></span>
      <span class="bar-label">${item.month}</span>
    `;
    els.monthlyChart.append(bar);
  });
}

function renderPriorityList() {
  const query = els.overviewSearch.value.trim().toLowerCase();
  const replacementItems = state.replacementRecords
    .map((record) => ({ record, status: getReplacementStatus(record) }))
    .filter(({ status }) => ["overdue", "due"].includes(status.type))
    .map(({ record, status }) => ({
      rank: status.type === "overdue" ? 1 : 2,
      title: record.studentId,
      meta: `${replacementLocation(record)} · ${record.keySet || "Replacement item"}`,
      detail: status.type === "overdue" ? "Replacement overdue" : "Replacement due soon",
      pill: status.label,
    }));

  const lockoutItems = state.lockoutRecords
    .filter((record) => lockoutNumberFor(record) > 1)
    .map((record) => ({
      rank: 3,
      title: record.studentId,
      meta: `${record.room} · ${formatDate(record.date)}`,
      detail: `Lockout ${lockoutNumberFor(record)} requires £15 charge`,
      pill: "Charge",
    }));

  const items = [...replacementItems, ...lockoutItems]
    .filter((item) => !query || `${item.title} ${item.meta}`.toLowerCase().includes(query))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5);

  els.priorityList.innerHTML = "";
  if (!items.length) {
    els.priorityList.innerHTML = "<div class=\"priority-empty\">No matching follow-ups.</div>";
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("article");
    row.className = "priority-item";
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.meta)}</span>
        <p>${escapeHtml(item.detail)}</p>
      </div>
      <span class="status-pill status-info">${escapeHtml(item.pill)}</span>
    `;
    els.priorityList.append(row);
  });
}

function appendEmptyRow(target, message) {
  const row = els.emptyStateTemplate.content.cloneNode(true);
  const cell = row.querySelector(".empty-state");
  cell.textContent = message;
  cell.colSpan = target.closest("table").querySelectorAll("thead th").length;
  target.append(row);
}

function getReplacementStatus(record) {
  const issued = dateOnly(record.issuedDate);
  const due = addDays(issued, 7);
  const returned = record.returnedDate ? dateOnly(record.returnedDate) : null;
  const now = dateOnly(todayString());
  const twoDaysFromNow = addDays(now, 2);

  if (returned) {
    return returned <= due
      ? { type: "ok", label: "Returned in time", className: "status-ok", dueDate: due }
      : { type: "late", label: "Returned late", className: "status-overdue", dueDate: due };
  }

  if (now > due) {
    return { type: "overdue", label: "Overdue", className: "status-overdue", dueDate: due };
  }

  if (due <= twoDaysFromNow) {
    return { type: "due", label: "Due soon", className: "status-due", dueDate: due };
  }

  return { type: "ok", label: "Open", className: "status-info", dueDate: due };
}

function lockoutCounts() {
  return state.lockoutRecords.reduce((counts, record) => {
    const key = normaliseId(record.studentId);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function lockoutNumberFor(record) {
  return sortedByDateAscending(state.lockoutRecords, "date")
    .filter((item) => normaliseId(item.studentId) === normaliseId(record.studentId))
    .findIndex((item) => item.id === record.id) + 1;
}

function matchesReplacementFilters(record) {
  const studentIdSearch = getValue("replacementStudentIdSearch").toLowerCase();
  const keySetSearch = getValue("replacementKeySetSearch").toLowerCase();
  const issuedSearch = getValue("replacementIssuedSearch");
  const returnedSearch = getValue("replacementReturnedSearch");

  return (
    (!studentIdSearch || (record.studentId || "").toLowerCase().includes(studentIdSearch)) &&
    (!keySetSearch || (record.keySet || "").toLowerCase().includes(keySetSearch)) &&
    (!issuedSearch || record.issuedDate === issuedSearch) &&
    (!returnedSearch || record.returnedDate === returnedSearch)
  );
}

function parsePastedTable(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const firstLineCells = splitPastedLine(lines[0], delimiter);
  const firstLineHeaders = firstLineCells.map(normaliseHeader);
  const hasHeaderRow = looksLikeHeaderRow(firstLineHeaders);
  const headers = hasHeaderRow ? firstLineHeaders : fallbackReplacementHeaders(firstLineCells.length);
  const dataLines = hasHeaderRow ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const cells = splitPastedLine(line, delimiter);
    return headers.reduce((row, header, index) => {
      row[header || `column ${index + 1}`] = (cells[index] || "").trim();
      return row;
    }, {});
  });
}

function looksLikeHeaderRow(headers) {
  const joined = headers.join(" ");
  return (
    joined.includes("date") ||
    joined.includes("student") ||
    joined.includes("hall building") ||
    joined.includes("building complex") ||
    joined.includes("staff initials") ||
    joined.includes("i am collecting") ||
    joined.includes("which did the student collect")
  );
}

function fallbackReplacementHeaders(columnCount) {
  const headers = [
    "id",
    "start time",
    "completion time",
    "email",
    "name",
    "student number",
    "building complex",
    "bishop complex hall",
    "faraday complex hall",
    "isambard complex hall",
    "lancaster complex hall",
    "standard complex hall",
    "flat number",
    "room number",
    "charges understood",
    "which did the student collect",
    "staff initials",
  ];

  return Array.from({ length: columnCount }, (_, index) => headers[index] || `column ${index + 1}`);
}

function splitPastedLine(line, delimiter) {
  if (delimiter === "\t") return line.split("\t");

  const cells = [];
  let current = "";
  let quoted = false;

  for (const character of line) {
    if (character === "\"") {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += character;
    }
  }

  cells.push(current);
  return cells;
}

function mapPastedReplacementRow(row, index, initials) {
  const studentId = pastedValue(row, ["student number", "student no", "student id", "student"]);
  const buildingComplex = pastedValue(row, ["building complex", "complex", "hall building"]);
  const hall = firstNonEmptyValue(row, [
    "hall",
    "hall building",
    "bishop complex hall",
    "faraday complex hall",
    "isambard complex hall",
    "lancaster complex hall",
    "standard complex hall",
  ]);
  const flatNumber = pastedValue(row, ["flat number", "flat", "flat number staircase faraday clifton floor mill hall"]);
  const room = pastedValue(row, ["room number", "room"]);
  const keySet = pastedValue(row, ["i am collecting", "which did the student collect", "student collected", "collected"]);
  const staffInitials = firstNonEmptyValue(row, ["staff initials", "please enter your initials staff", "initials"]) || initials;
  const issuedDate = normalisePastedDate(pastedValue(row, ["date", "replacement date", "completion time", "submitted", "start time"]));
  const returned = pastedValue(row, ["replacement returned yes no", "replacement returned"]);
  const returnedDate = normalisePastedDate(pastedValue(row, ["returned date", "return date"])) || (isYes(returned) ? issuedDate : "");

  return {
    id: `paste-${Date.now()}-${index}-${studentId || "row"}`,
    source: "paste",
    studentId: studentId || "Unknown",
    buildingComplex,
    hall,
    flatNumber,
    room,
    collectedItems: keySet ? keySet.split(",").map((item) => item.trim()) : [],
    keySet: keySet || "Replacement item",
    chargeConfirmed: true,
    staffInitials,
    issuedDate: issuedDate || todayString(),
    returnedDate,
    msFormsStatus: "Pasted",
    raw: row,
  };
}

function isYes(value) {
  return String(value).trim().toLowerCase().startsWith("yes");
}

function rowMentionsInitials(row, initials) {
  const target = initials.toUpperCase();
  return Object.values(row).some((value) => {
    const text = String(value).trim().toUpperCase();
    return text === target || text.split(/\s|,|;|\//).includes(target);
  });
}

function pastedValue(row, names) {
  const entries = Object.entries(row);
  const match = entries.find(([key]) => {
    const normalised = normaliseHeader(key);
    return names.some((name) => normalised.includes(normaliseHeader(name)));
  });
  return match ? String(match[1]).trim() : "";
}

function firstNonEmptyValue(row, names) {
  for (const name of names) {
    const value = pastedValue(row, [name]);
    if (value) return value;
  }
  return "";
}

function normaliseHeader(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalisePastedDate(value) {
  if (!value) return "";
  const trimmed = String(value).trim();
  const ukDate = trimmed.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);

  if (ukDate) {
    const [, day, month, year] = ukDate;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function populateReplacementHalls() {
  const complex = getValue("replacementComplex");
  const halls = hallsByComplex[complex] || [];
  els.replacementHall.innerHTML = halls.length
    ? "<option value=\"\">Select hall</option>"
    : "<option value=\"\">Select complex first</option>";

  halls.forEach((hall) => {
    const option = document.createElement("option");
    option.value = hall;
    option.textContent = hall;
    els.replacementHall.append(option);
  });
}

function populateReplacementItems() {
  const complex = getValue("replacementComplex");
  const hall = getValue("replacementHall");
  const canShowItems = Boolean(complex && hall);
  els.replacementCollectedField.hidden = !canShowItems;

  if (!canShowItems) {
    els.replacementCollectedItems.innerHTML = "<span>Select complex and hall first</span>";
    return;
  }

  const options = allowedReplacementItems(complex, hall);
  els.replacementCollectedItems.innerHTML = "";

  if (!options.length) {
    els.replacementCollectedItems.innerHTML = "<span>Select location first</span>";
    return;
  }

  options.forEach((item) => {
    const label = document.createElement("label");
    label.className = "checkbox-option";
    label.innerHTML = `
      <input type="checkbox" name="replacementCollectedItem" value="${escapeHtml(item)}" checked />
      <span>${escapeHtml(item)}</span>
    `;
    els.replacementCollectedItems.append(label);
  });
}

function getCollectedItems() {
  return [...document.querySelectorAll("input[name='replacementCollectedItem']:checked")]
    .map((input) => input.value);
}

function allowedReplacementItems(complex, hall) {
  if (complex === "Isambard Complex") {
    return [replacementItems.hid];
  }

  if (complex === "Mill Hall") {
    return [replacementItems.visitor, replacementItems.hid];
  }

  const defaults = defaultVisitorCardComplexes.has(complex)
    ? [replacementItems.visitor]
    : [];

  if (flatRoomKeyLocations.has(hall)) {
    return [replacementItems.flatKey, replacementItems.roomKey, ...defaults];
  }

  return uniqueItems([replacementItems.flatKey, replacementItems.roomKey, replacementItems.hid, replacementItems.visitor, ...defaults]);
}

function uniqueItems(items) {
  return [...new Set(items)];
}

function replacementLocation(record) {
  const parts = [
    record.buildingComplex,
    record.hall,
    record.flatNumber ? `Flat ${record.flatNumber}` : "",
    record.room ? `Room ${record.room}` : "",
  ].filter(Boolean);
  return parts.join(" · ") || record.room || "Unknown location";
}

function sortedByDate(records, key) {
  return [...records].sort((a, b) => {
    const dateDifference = dateOnly(b[key]) - dateOnly(a[key]);
    return dateDifference || recordLabel(a).localeCompare(recordLabel(b));
  });
}

function sortedByDateAscending(records, key) {
  return [...records].sort((a, b) => {
    const dateDifference = dateOnly(a[key]) - dateOnly(b[key]);
    return dateDifference || recordLabel(a).localeCompare(recordLabel(b));
  });
}

function recordLabel(record) {
  return record.studentId || record.student || "";
}



function setDefaultDates() {
  document.querySelector("#replacementIssued").value = todayString();
  document.querySelector("#lockoutDate").value = todayString();
  els.replacementStaffInitials.value = getSavedInitials();
  els.backendPasteInitials.value = getSavedInitials() || "SJ";
}

function getValue(id) {
  return document.querySelector(`#${id}`).value.trim();
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function dateOnly(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(value) {
  const date = value instanceof Date ? value : dateOnly(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function normaliseId(value) {
  return value.trim().toLowerCase();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSavedInitials() {
  try {
    const profile = JSON.parse(localStorage.getItem(STORAGE_KEY))?.profile || {};
    return profile.staffInitials || "";
  } catch {
    return "";
  }
}

setDefaultDates();
populateReplacementHalls();
populateReplacementItems();
render();
requestAnimationFrame(updateTabSlider);
