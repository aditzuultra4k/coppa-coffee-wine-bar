const crypto = require("crypto");

const STAFF_PASSWORD = process.env.STAFF_PASSWORD || "coppa-staff";
const SESSION_COOKIE = "coppa_staff";

globalThis.coppaReservations = globalThis.coppaReservations || [];
globalThis.coppaSessions = globalThis.coppaSessions || new Map();

function sendJson(response, status, payload, headers = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
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
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return false;
  const expiresAt = globalThis.coppaSessions.get(token);
  if (!expiresAt || expiresAt < Date.now()) {
    globalThis.coppaSessions.delete(token);
    return false;
  }
  return true;
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

module.exports = async function handler(request, response) {
  try {
    const pathname = request.url.split("?")[0];

    if (request.method === "POST" && pathname === "/api/reservations") {
      const reservation = cleanReservation(request.body || {});
      globalThis.coppaReservations.unshift(reservation);
      sendJson(response, 201, { ok: true, reservation });
      return;
    }

    if (request.method === "POST" && pathname === "/api/staff/login") {
      if (String(request.body?.password || "") !== STAFF_PASSWORD) {
        sendJson(response, 401, { ok: false, message: "Parola este gresita." });
        return;
      }

      const token = crypto.randomBytes(32).toString("hex");
      globalThis.coppaSessions.set(token, Date.now() + 1000 * 60 * 60 * 8);
      sendJson(response, 200, { ok: true }, {
        "Set-Cookie": `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800; Secure`,
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/staff/logout") {
      const token = getCookie(request, SESSION_COOKIE);
      if (token) globalThis.coppaSessions.delete(token);
      sendJson(response, 200, { ok: true }, {
        "Set-Cookie": `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0; Secure`,
      });
      return;
    }

    if (pathname === "/api/staff/reservations") {
      if (!isStaff(request)) {
        sendJson(response, 401, { ok: false, message: "Acces doar pentru staff." });
        return;
      }

      if (request.method === "GET") {
        sendJson(response, 200, { ok: true, reservations: globalThis.coppaReservations });
        return;
      }

      if (request.method === "PATCH") {
        const reservation = globalThis.coppaReservations.find((item) => item.id === request.body?.id);
        if (!reservation) {
          sendJson(response, 404, { ok: false, message: "Programarea nu a fost gasita." });
          return;
        }

        if (!["new", "confirmed", "cancelled"].includes(request.body?.status)) {
          sendJson(response, 400, { ok: false, message: "Status invalid." });
          return;
        }

        reservation.status = request.body.status;
        sendJson(response, 200, { ok: true, reservation });
        return;
      }
    }

    sendJson(response, 404, { ok: false, message: "Ruta API nu exista." });
  } catch (error) {
    sendJson(response, error.status || 500, {
      ok: false,
      message: error.status ? error.message : "Eroare de server.",
    });
  }
};
