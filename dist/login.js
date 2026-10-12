const STORAGE_KEY = "residence-ops-dashboard-v1";
const MICROSOFT_LOGIN_URL = "https://login.microsoftonline.com/";

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
const form = document.querySelector("#profileForm");
const loginStatus = document.querySelector("#loginStatus");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  state.profile = {
    staffInitials: getValue("staffInitials").toUpperCase(),
    staffEmail: getValue("staffEmail"),
    loggedIn: true,
    refreshRequired: false,
  };
  persist();
  render();
  window.location.href = MICROSOFT_LOGIN_URL;
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

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  const profile = { ...defaultState.profile, ...(state.profile || {}) };
  const isLoggedIn = Boolean(profile.loggedIn && !profile.refreshRequired);
  document.querySelector("#staffInitials").value = profile.staffInitials || initialsFromName(profile.staffName || "");
  document.querySelector("#staffEmail").value = profile.staffEmail;
  loginStatus.textContent = isLoggedIn
    ? "Login saved. Credentials will stay stored until the system asks for a refresh."
    : "Login required before opening the dashboard.";
}

function getValue(id) {
  return document.querySelector(`#${id}`).value.trim();
}

function initialsFromName(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 6)
    .toUpperCase();
}

render();
