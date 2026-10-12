const http = require("http");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const root = __dirname;
const distDir = path.join(root, "dist");
const env = readEnv(path.join(root, ".env"));
const port = Number(env.PORT || 5500);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === "/api/replacement-backend") {
      sendJson(res, readReplacementBackend());
      return;
    }

    const requestedPath = url.pathname === "/" ? "/login.html" : url.pathname;
    const filePath = path.normalize(path.join(distDir, requestedPath));

    if (!filePath.startsWith(distDir)) {
      sendText(res, 403, "Forbidden");
      return;
    }

    fs.readFile(filePath, (error, body) => {
      if (error) {
        sendText(res, 404, "Not found");
        return;
      }

      res.writeHead(200, {
        "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      });
      res.end(body);
    });
  })
  .listen(port, () => {
    console.log(`Dashboard running at http://127.0.0.1:${port}`);
  });

function readReplacementBackend() {
  const filePath = env.REPLACEMENT_BACKEND_FILE_PATH || env.BACKEND_EXCEL_PATH;
  const initials = (env.BACKEND_INITIALS || "SJ").trim().toUpperCase();

  if (!filePath) {
    return { records: [], error: "Set REPLACEMENT_BACKEND_FILE_PATH in .env" };
  }

  if (!fs.existsSync(filePath)) {
    return { records: [], error: `File not found: ${filePath}` };
  }

  try {
    const workbook = XLSX.readFile(filePath, { cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
    const records = rows
      .filter((row) => rowMentionsInitials(row, initials))
      .map((row, index) => mapReplacementRow(row, index));

    return {
      records,
      initials,
      source: filePath,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    return { records: [], error: error.message };
  }
}

function mapReplacementRow(row, index) {
  const studentId = valueFor(row, ["student number", "student no", "student id", "student"]);
  const buildingComplex = valueFor(row, ["building complex", "complex"]);
  const hall = valueFor(row, ["hall", "bishop complex hall", "faraday complex hall", "isambard complex hall", "lancaster complex hall", "standard complex hall"]);
  const flatNumber = valueFor(row, ["flat number", "flat"]);
  const room = valueFor(row, ["room number", "room"]);
  const keySet = valueFor(row, ["which did the student collect", "student collected", "collected"]);
  const staffInitials = valueFor(row, ["staff initials", "initials"]);
  const issuedDate = normaliseDate(valueFor(row, ["replacement date", "completion time", "submitted", "start time"])) || todayString();
  const returnedDate = normaliseDate(valueFor(row, ["returned date", "return date"]));

  return {
    id: `backend-${index}-${studentId || "row"}`,
    source: "backend",
    studentId: String(studentId || "Unknown"),
    buildingComplex,
    hall,
    flatNumber,
    room,
    keySet: keySet || "Replacement item",
    collectedItems: keySet ? String(keySet).split(",").map((item) => item.trim()) : [],
    chargeConfirmed: true,
    staffInitials,
    issuedDate,
    returnedDate,
    msFormsStatus: "Backend",
    raw: row,
  };
}

function valueFor(row, names) {
  const entries = Object.entries(row);
  const match = entries.find(([key]) => {
    const normalised = normaliseHeader(key);
    return names.some((name) => normalised.includes(normaliseHeader(name)));
  });
  return match ? String(match[1]).trim() : "";
}

function rowMentionsInitials(row, initials) {
  const target = initials.toUpperCase();
  return Object.values(row).some((value) => {
    const text = String(value).trim().toUpperCase();
    return text === target || text.split(/\s|,|;|\//).includes(target);
  });
}

function normaliseHeader(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normaliseDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).reduce((values, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return values;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return values;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
    values[key] = value;
    return values;
  }, {});
}

function sendJson(res, payload) {
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, message) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(message);
}
