const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const STAFF_PASSWORD = process.env.STAFF_PASSWORD || "coppa-staff";
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const RESERVATIONS_FILE = path.join(DATA_DIR, "reservations.json");
const sessions = new Map();
const publicFiles = new Set(["/index.html", "/styles.css", "/script.js", "/staff.html", "/staff.css", "/staff.js"]);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function getCookie(request, name) {
  const header = request.headers.cookie || "";
  return header
    .split(";")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === name)?.[1];
}

function isStaff(request) {
  const token = getCookie(request, "coppa_staff");
  if (!token) return false;
  const expiresAt = sessions.get(token);
  if (!expiresAt || expiresAt < Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  return JSON.parse(raw);
}

async function loadReservations() {
  try {
    const raw = await fs.readFile(RESERVATIONS_FILE, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(RESERVATIONS_FILE, "[]\n");
    return [];
  }
}

async function saveReservations(reservations) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(RESERVATIONS_FILE, `${JSON.stringify(reservations, null, 2)}\n`);
}

function cleanReservation(input) {
  const reservation = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "new",
    name: String(input.name || "").trim(),
    phone: String(input.phone || "").trim(),
    email: String(input.email || "").trim(),
    location: String(input.location || "").trim(),
    date: String(input.date || "").trim(),
    time: String(input.time || "").trim(),
    guests: Number(input.guests || 0),
    message: String(input.message || "").trim(),
  };

  const required = ["name", "phone", "email", "location", "date", "time"];
  const missing = required.filter((key) => !reservation[key]);
  if (missing.length || !Number.isInteger(reservation.guests) || reservation.guests < 1 || reservation.guests > 20) {
    const error = new Error("Datele programarii sunt incomplete.");
    error.status = 400;
    throw error;
  }

  return reservation;
}

async function handleApi(request, response, url) {
  if (request.method === "POST" && url.pathname === "/api/reservations") {
    const body = await readBody(request);
    const reservation = cleanReservation(body);
    const reservations = await loadReservations();
    reservations.unshift(reservation);
    await saveReservations(reservations);
    sendJson(response, 201, { ok: true, reservation });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/staff/login") {
    const body = await readBody(request);
    if (String(body.password || "") !== STAFF_PASSWORD) {
      sendJson(response, 401, { ok: false, message: "Parola este gresita." });
      return true;
    }

    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, Date.now() + 1000 * 60 * 60 * 8);
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": `coppa_staff=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`,
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ ok: true }));
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/staff/logout") {
    const token = getCookie(request, "coppa_staff");
    if (token) sessions.delete(token);
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": "coppa_staff=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ ok: true }));
    return true;
  }

  if (url.pathname === "/api/staff/reservations") {
    if (!isStaff(request)) {
      sendJson(response, 401, { ok: false, message: "Acces doar pentru staff." });
      return true;
    }

    if (request.method === "GET") {
      const reservations = await loadReservations();
      sendJson(response, 200, { ok: true, reservations });
      return true;
    }

    if (request.method === "PATCH") {
      const body = await readBody(request);
      const reservations = await loadReservations();
      const reservation = reservations.find((item) => item.id === body.id);
      if (!reservation) {
        sendJson(response, 404, { ok: false, message: "Programarea nu a fost gasita." });
        return true;
      }

      if (!["new", "confirmed", "cancelled"].includes(body.status)) {
        sendJson(response, 400, { ok: false, message: "Status invalid." });
        return true;
      }

      reservation.status = body.status;
      await saveReservations(reservations);
      sendJson(response, 200, { ok: true, reservation });
      return true;
    }
  }

  return false;
}

async function serveFile(response, pathname) {
  const cleanPath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const isPublicAsset = cleanPath.startsWith("/assets/");
  if (!publicFiles.has(cleanPath) && !isPublicAsset) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  const filePath = path.normalize(path.join(ROOT, cleanPath));
  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(content);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 500);
    response.end(error.code === "ENOENT" ? "Not found" : "Server error");
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const handled = await handleApi(request, response, url);
    if (!handled) await serveFile(response, url.pathname);
  } catch (error) {
    sendJson(response, error.status || 500, {
      ok: false,
      message: error.status ? error.message : "Eroare de server.",
    });
  }
});

server.listen(PORT, () => {
  console.log(`Coppa site running at http://localhost:${PORT}`);
  console.log(`Staff page: http://localhost:${PORT}/staff.html`);
});
