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
});