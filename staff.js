const loginPanel = document.querySelector("#loginPanel");
const dashboardPanel = document.querySelector("#dashboardPanel");
const loginForm = document.querySelector("#loginForm");
const loginStatus = document.querySelector("#loginStatus");
const logoutButton = document.querySelector("#logoutButton");
const reservationList = document.querySelector("#reservationList");
const staffSummary = document.querySelector("#staffSummary");

function statusLabel(status) {
  return {
    new: "Noua",
    confirmed: "Confirmata",
    cancelled: "Anulata",
  }[status] || status;
}

function showDashboard(show) {
  loginPanel.classList.toggle("hidden", show);
  dashboardPanel.classList.toggle("hidden", !show);
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || "Cererea nu a reusit.");
  return payload;
}

function renderReservations(reservations) {
  const counts = reservations.reduce(
    (total, item) => {
      total[item.status] = (total[item.status] || 0) + 1;
      return total;
    },
    { new: 0, confirmed: 0, cancelled: 0 }
  );

  staffSummary.innerHTML = `
    <article class="summary-card"><strong>${counts.new}</strong><span>Noi</span></article>
    <article class="summary-card"><strong>${counts.confirmed}</strong><span>Confirmate</span></article>
    <article class="summary-card"><strong>${counts.cancelled}</strong><span>Anulate</span></article>
  `;

  if (!reservations.length) {
    reservationList.innerHTML = '<div class="empty-state">Nu exista inca programari.</div>';
    return;
  }

  reservationList.innerHTML = reservations
    .map(
      (item) => `
        <article class="reservation-row">
          <div>
            <span class="status-pill ${item.status}">${statusLabel(item.status)}</span>
            <h2>${item.name}</h2>
            <p>${item.phone} / ${item.email}</p>
          </div>
          <div>
            <p><strong>${item.location}</strong></p>
            <p>${item.date} la ${item.time}</p>
            <p>${item.guests} persoane</p>
          </div>
          <p>${item.message || "Fara mesaj suplimentar."}</p>
          <div class="reservation-actions">
            <button class="solid-button" type="button" data-id="${item.id}" data-status="confirmed">Confirma</button>
            <button class="ghost-button" type="button" data-id="${item.id}" data-status="cancelled">Anuleaza</button>
          </div>
        </article>
      `
    )
    .join("");
}

async function loadReservations() {
  try {
    const payload = await requestJson("/api/staff/reservations");
    showDashboard(true);
    renderReservations(payload.reservations);
  } catch (error) {
    showDashboard(false);
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginStatus.textContent = "";
  const password = new FormData(loginForm).get("password");

  try {
    await requestJson("/api/staff/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    loginForm.reset();
    await loadReservations();
  } catch (error) {
    loginStatus.textContent = error.message;
  }
});

logoutButton.addEventListener("click", async () => {
  await requestJson("/api/staff/logout", { method: "POST" });
  showDashboard(false);
});

reservationList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-id][data-status]");
  if (!button) return;

  await requestJson("/api/staff/reservations", {
    method: "PATCH",
    body: JSON.stringify({ id: button.dataset.id, status: button.dataset.status }),
  });
  await loadReservations();
});

loadReservations();
