"use strict";

const todayLabel = document.getElementById("todayLabel");
const menuButton = document.getElementById("menuButton");

function displayToday() {
  if (!todayLabel) return;

  const today = new Date();

  todayLabel.textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(today);
}

function closeNavigation() {
  document.body.classList.remove("navigation-open");

  if (menuButton) {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
  }
}

function toggleNavigation() {
  const navigationIsOpen =
    document.body.classList.toggle("navigation-open");

  menuButton.setAttribute(
    "aria-expanded",
    String(navigationIsOpen)
  );

  menuButton.setAttribute(
    "aria-label",
    navigationIsOpen
      ? "Close navigation"
      : "Open navigation"
  );
}

displayToday();

if (menuButton) {
  menuButton.addEventListener("click", toggleNavigation);
}

document.addEventListener("click", (event) => {
  const clickedOverlay =
    document.body.classList.contains("navigation-open") &&
    !event.target.closest(".sidebar") &&
    !event.target.closest("#menuButton");

  if (clickedOverlay) {
    closeNavigation();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNavigation();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) {
    closeNavigation();
  }
});/* ================================
   Pantry Item Form Modal
================================ */

const itemModal = document.getElementById("itemModal");
const addItemButton = document.getElementById("addItemButton");
const emptyStateAddButton = document.querySelector(
  "#emptyPantryState .secondary-button"
);
const closeItemModalButton =
  document.getElementById("closeItemModal");
const cancelItemButton =
  document.getElementById("cancelItemButton");
const pantryItemForm =
  document.getElementById("pantryItemForm");
const itemNameInput =
  document.getElementById("itemName");

function openItemModal() {
  if (!itemModal) return;

  itemModal.hidden = false;
  document.body.style.overflow = "hidden";

  window.setTimeout(() => {
    itemNameInput?.focus();
  }, 50);
}

function closeItemModal() {
  if (!itemModal) return;

  itemModal.hidden = true;
  document.body.style.overflow = "";
  pantryItemForm?.reset();
}

addItemButton?.addEventListener("click", openItemModal);
emptyStateAddButton?.addEventListener("click", openItemModal);

closeItemModalButton?.addEventListener(
  "click",
  closeItemModal
);

cancelItemButton?.addEventListener(
  "click",
  closeItemModal
);

itemModal?.addEventListener("click", (event) => {
  if (event.target === itemModal) {
    closeItemModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    itemModal &&
    !itemModal.hidden
  ) {
    closeItemModal();
  }
});/* ================================
   Pantry Inventory
================================ */

const pantryStorageKey = "kos-pantry-items";

const inventoryGrid = document.getElementById("inventoryGrid");
const emptyPantryState = document.getElementById("emptyPantryState");
const inventoryCount = document.getElementById("inventoryCount");
const totalItems = document.getElementById("totalItems");
const lowStockItems = document.getElementById("lowStockItems");
const expiringItems = document.getElementById("expiringItems");
const storageAreas = document.getElementById("storageAreas");

let pantryItems = loadPantryItems();

function loadPantryItems() {
  try {
    const savedItems = localStorage.getItem(pantryStorageKey);
    return savedItems ? JSON.parse(savedItems) : [];
  } catch (error) {
    console.error("Pantry items could not be loaded:", error);
    return [];
  }
}

function savePantryItems() {
  localStorage.setItem(
    pantryStorageKey,
    JSON.stringify(pantryItems)
  );
}

function isItemLow(item) {
  return Number(item.quantity) <= Number(item.lowStock);
}

function isItemExpiring(item) {
  if (!item.expiration) return false;

  const expirationDate = new Date(
    `${item.expiration}T23:59:59`
  );

  const today = new Date();
  const fourteenDaysFromNow = new Date();

  today.setHours(0, 0, 0, 0);
  fourteenDaysFromNow.setDate(today.getDate() + 14);

  return (
    expirationDate >= today &&
    expirationDate <= fourteenDaysFromNow
  );
}

function formatExpirationDate(dateValue) {
  if (!dateValue) return "No expiration date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateValue}T12:00:00`));
}

function formatQuantity(item) {
  const quantity = Number(item.quantity);
  const unitNeedsPlural = quantity !== 1;

  return `${quantity} ${item.unit}${
    unitNeedsPlural ? "s" : ""
  }`;
}

function createPantryCard(item) {
  const card = document.createElement("article");
  card.className = "pantry-item-card";

  if (isItemLow(item)) {
    card.classList.add("low-stock-item");
  }

  if (isItemExpiring(item)) {
    card.classList.add("expiring-item");
  }

  const statusLabels = [];

  if (isItemLow(item)) {
    statusLabels.push(
      '<span class="item-status low-status">Running low</span>'
    );
  }

  if (isItemExpiring(item)) {
    statusLabels.push(
      '<span class="item-status expiring-status">Expiring soon</span>'
    );
  }

  card.innerHTML = `
    <div class="item-card-top">
      <span class="item-category">${item.category}</span>

      <button
        class="item-menu-button"
        type="button"
        aria-label="Item options"
      >
        •••
      </button>
    </div>

    <h3>${item.name}</h3>

    <p class="item-quantity">
      ${formatQuantity(item)}
    </p>

    <div class="item-details">
      <span>⌂ ${item.location}</span>
      <span>◷ ${formatExpirationDate(item.expiration)}</span>
    </div>

    ${
      statusLabels.length
        ? `<div class="item-statuses">${statusLabels.join("")}</div>`
        : ""
    }
  `;

  return card;
}

function updatePantrySummary() {
  totalItems.textContent = pantryItems.length;

  lowStockItems.textContent = pantryItems.filter(
    isItemLow
  ).length;

  expiringItems.textContent = pantryItems.filter(
    isItemExpiring
  ).length;

  const uniqueLocations = new Set(
    pantryItems.map((item) => item.location)
  );

  storageAreas.textContent = uniqueLocations.size;

  inventoryCount.textContent = `${pantryItems.length} ${
    pantryItems.length === 1 ? "item" : "items"
  }`;
}

function renderPantryItems() {
  if (!inventoryGrid) return;

  inventoryGrid.innerHTML = "";

  if (pantryItems.length === 0) {
    inventoryGrid.appendChild(emptyPantryState);
    emptyPantryState.hidden = false;
  } else {
    pantryItems.forEach((item) => {
      inventoryGrid.appendChild(createPantryCard(item));
    });
  }

  updatePantrySummary();
}

pantryItemForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const newItem = {
    id: crypto.randomUUID(),
    name: document.getElementById("itemName").value.trim(),
    category:
      document.getElementById("itemCategory").value,
    location:
      document.getElementById("itemLocation").value,
    quantity:
      document.getElementById("itemQuantity").value,
    unit: document.getElementById("itemUnit").value,
    lowStock:
      document.getElementById("itemLowStock").value,
    expiration:
      document.getElementById("itemExpiration").value,
  };

  pantryItems.unshift(newItem);

  savePantryItems();
  renderPantryItems();
  closeItemModal();
});

renderPantryItems();