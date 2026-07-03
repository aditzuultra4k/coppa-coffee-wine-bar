const menuData = {
  coffee: [
    ["Signature Espresso", "Rich, balanced, chocolate finish", "18 lei"],
    ["Flat White", "Velvety milk, double espresso", "22 lei"],
    ["Iced Latte", "Cold milk, espresso, optional vanilla", "24 lei"],
    ["V60 Filter", "Light roast, seasonal origin", "28 lei"],
  ],
  wine: [
    ["Romanian White", "Crisp local glass with mineral notes", "32 lei"],
    ["Burgundy Red", "Elegant, smooth, dinner-friendly", "42 lei"],
    ["Sparkling Brut", "Dry, fresh, celebratory", "38 lei"],
    ["Rose by the Glass", "Bright, relaxed, terrace-ready", "34 lei"],
  ],
  cocktails: [
    ["After Work Spritz", "Bitter, citrus, sparkling", "39 lei"],
    ["Negroni Classico", "Deep, aromatic, confident", "45 lei"],
    ["Espresso Martini", "Coffee, vodka, evening energy", "46 lei"],
    ["Coppa Sour", "Balanced, silky, bright", "42 lei"],
  ],
  fresh: [
    ["House Lemonade", "Citrus, mint, light sweetness", "26 lei"],
    ["Berry Smoothie", "Forest fruit, yogurt, honey", "30 lei"],
    ["Espresso Tonic", "Sparkling tonic and espresso", "31 lei"],
    ["Orange Fresh", "Cold pressed and vibrant", "28 lei"],
  ],
  dessert: [
    ["Coppa Coffee", "Espresso, vanilla and chocolate notes", "35 lei"],
    ["Affogato", "Espresso over gelato-style cream", "29 lei"],
    ["Chocolate Tart", "Dark, smooth, elegant", "32 lei"],
    ["Pistachio Cream", "Soft, nutty, indulgent", "34 lei"],
  ],
  bites: [
    ["Cheese Board", "Selected cheeses and seasonal garnish", "58 lei"],
    ["Bruschetta Trio", "Tomato, cheese and olive tapenade", "42 lei"],
    ["Charcuterie Plate", "Cured meats and bread", "64 lei"],
    ["Olives & Almonds", "Simple wine bar classics", "28 lei"],
  ],
};

const wineData = [
  ["Feteasca Regala", "Romanian Wines", "Transylvania", "Fresh white with floral notes and bright acidity."],
  ["Dealu Mare Merlot", "Red Wines", "Romania", "Soft tannins, plum, cocoa and evening warmth."],
  ["Sauvignon Blanc", "White Wines", "Loire", "Citrus, herbs and a clean mineral finish."],
  ["Provence Rose", "Rose", "France", "Pale, dry, elegant and terrace-friendly."],
  ["Brut Sparkling", "Sparkling", "Italy", "Fine bubbles, green apple and a crisp close."],
  ["House Glass Selection", "By the Glass", "Rotating", "Ask the staff for the current open bottles."],
];

const galleryData = [
  ["Coffee", "linear-gradient(145deg,#5c3828,#d0a15b)"],
  ["Wine", "linear-gradient(145deg,#4e1024,#9d3550)"],
  ["Interior", "linear-gradient(145deg,#24150f,#c59a52)"],
  ["Moments", "linear-gradient(145deg,#7e1f35,#24150f)"],
  ["Desserts", "linear-gradient(145deg,#7b4b31,#f1c773)"],
  ["Events", "linear-gradient(145deg,#1f1511,#8f243b)"],
];

const header = document.querySelector("#siteHeader");
const mobilePanel = document.querySelector("#mobilePanel");
const menuToggle = document.querySelector(".menu-toggle");
const menuGrid = document.querySelector("#menuGrid");
const wineGrid = document.querySelector("#wineGrid");
const galleryGrid = document.querySelector("#galleryGrid");
const galleryModal = document.querySelector("#galleryModal");
const modalArt = document.querySelector("#modalArt");
const modalTitle = document.querySelector("#modalTitle");

function updateHeader() {
  header.classList.toggle("scrolled", window.scrollY > 24);
}

function renderMenu(category = "coffee") {
  const items = menuData[category] || menuData.coffee;
  menuGrid.innerHTML = `
    <article class="menu-card">
      <h3>${document.querySelector(`[data-menu-tab="${category}"]`).textContent}</h3>
      ${items
        .map(
          ([name, description, price]) => `
            <div class="menu-item">
              <strong><span>${name}</span><span>${price}</span></strong>
              <p>${description}</p>
            </div>
          `
        )
        .join("")}
    </article>
    <article class="menu-card">
      <h3>Owner-ready structure</h3>
      <p>Each menu card is data-driven in the script, so real categories, prices and seasonal items can be updated quickly.</p>
      <p>Ideal next step: connect the menu to a simple admin dashboard or spreadsheet.</p>
    </article>
    <article class="menu-card">
      <h3>Commercial detail</h3>
      <p>Menu preview encourages discovery without overwhelming guests before they reserve or call.</p>
      <a class="text-link" href="#contact">Request a table</a>
    </article>
  `;
}

function renderWine(filter = "all") {
  wineGrid.innerHTML = wineData
    .filter((wine) => filter === "all" || wine[1] === filter)
    .map(
      ([name, type, origin, note]) => `
        <article class="wine-card reveal visible">
          <span class="wine-type">${type}</span>
          <h3>${name}</h3>
          <p><strong>Origin:</strong> ${origin}</p>
          <p>${note}</p>
          <a class="solid-button" href="#contact">${type === "By the Glass" ? "Ask the staff" : "Reserve & Taste"}</a>
        </article>
      `
    )
    .join("");
}

function renderGallery() {
  galleryGrid.innerHTML = galleryData
    .map(
      ([title, background]) => `
        <button class="gallery-tile reveal visible" type="button" style="background:${background}" data-title="${title}" data-bg="${background}">
          <span>${title}</span>
        </button>
      `
    )
    .join("");
}

menuToggle.addEventListener("click", () => {
  const isOpen = mobilePanel.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

mobilePanel.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    mobilePanel.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

document.querySelector(".theme-toggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

document.querySelectorAll("[data-menu-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-menu-tab]").forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    renderMenu(button.dataset.menuTab);
  });
});

document.querySelectorAll("[data-wine-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-wine-filter]").forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    renderWine(button.dataset.wineFilter);
  });
});

galleryGrid.addEventListener("click", (event) => {
  const tile = event.target.closest(".gallery-tile");
  if (!tile) return;
  modalTitle.textContent = `${tile.dataset.title} at Coppa`;
  modalArt.style.background = tile.dataset.bg;
  galleryModal.showModal();
});

document.querySelector(".modal-close").addEventListener("click", () => galleryModal.close());

document.querySelector("#reservationForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = document.querySelector("#formStatus");

  if (!form.checkValidity()) {
    status.textContent = "Please complete the required reservation fields.";
    form.reportValidity();
    return;
  }

  const submitButton = form.querySelector(".submit-button");
  const payload = Object.fromEntries(new FormData(form).entries());
  submitButton.disabled = true;
  status.textContent = "Sending your reservation request...";

  try {
    const response = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "The reservation could not be sent.");

    form.reset();
    status.textContent = "Thank you. Your reservation request was sent to Coppa.";
  } catch (error) {
    status.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

const sections = [...document.querySelectorAll("main .section[id]")];
const navLinks = [...document.querySelectorAll(".desktop-nav a")];

const activeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-42% 0px -50% 0px" }
);

sections.forEach((section) => activeObserver.observe(section));
window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();
renderMenu();
renderWine();
renderGallery();
