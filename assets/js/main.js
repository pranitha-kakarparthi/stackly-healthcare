/**
 * Stackly Healthcare Platform - Core Main Script
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Preloader dismissal
  initPreloader();

  // 2. Fixed Navbar Scroll Effect
  initNavbarScroll();

  // 3. Mobile Navigation Drawer & Body Scroll Lock
  initMobileNav();

  // 4. Highlight Active Navigation Item
  highlightActiveNav();

  // 5. Setup Action Buttons Redirection to 404
  setupActionButtonsRedirect();

  // 6. Time of Day Greetings
  updateTimeGreeting();
});

/**
 * Preloader dismissal with fail-safe timeout
 */
function initPreloader() {
  const loader = document.getElementById("page-loader");
  if (!loader) return;

  const hideLoader = () => {
    loader.classList.add("loaded");
    setTimeout(() => {
      if (loader.parentNode) {
        loader.style.display = "none";
      }
    }, 450);
  };

  // Immediate or short animation window
  if (document.readyState === "complete") {
    hideLoader();
  } else {
    window.addEventListener("load", hideLoader);
    // Safety fallback
    setTimeout(hideLoader, 1200);
  }
}

/**
 * Fixed Navbar Scroll listener for elevation styling
 */
function initNavbarScroll() {
  const navbar = document.querySelector(".fixed-navbar");
  if (!navbar) return;

  window.addEventListener(
    "scroll",
    () => {
      if (window.scrollY > 20) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    },
    { passive: true }
  );
}

/**
 * Mobile Drawer Menu toggle with background scroll lock
 */
function initMobileNav() {
  const toggleBtn = document.querySelector(".nav-toggle");
  const overlay = document.querySelector(".mobile-nav-overlay");
  const closeBtn = document.querySelector(".mobile-nav-close");

  if (!toggleBtn || !overlay) return;

  const openDrawer = () => {
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    toggleBtn.setAttribute("aria-expanded", "true");
  };

  const closeDrawer = () => {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    toggleBtn.setAttribute("aria-expanded", "false");
  };

  toggleBtn.addEventListener("click", openDrawer);

  if (closeBtn) {
    closeBtn.addEventListener("click", closeDrawer);
  }

  // Close when clicking overlay backdrop
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeDrawer();
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) {
      closeDrawer();
    }
  });
}

/**
 * Highlights the current active page in navigation menu
 */
function highlightActiveNav() {
  const currentPath = window.location.pathname.toLowerCase();
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    const target = href.toLowerCase();
    const isHome =
      (currentPath.endsWith("/") || currentPath.endsWith("index.html")) &&
      (target === "index.html" || target === "./" || target === "/");
    const isCurrent =
      target.length > 2 &&
      currentPath.includes(target.replace("./", "").replace("/", ""));

    if (isHome || isCurrent) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

/**
 * Action button redirects: Globally redirect secondary and clinical action
 * buttons to the custom 404 page across the entire website.
 */
function setupActionButtonsRedirect() {
  document.addEventListener("click", (e) => {
    const target = e.target.closest(
      'button, .btn, .social-icon-btn, .social-auth-btn, .terms-link, .newsletter-link, [data-action="404"]'
    );
    if (!target) return;

    // Elements explicitly designated to have no action or redirection (e.g. blog topic filters)
    if (
      target.hasAttribute("data-no-action") ||
      target.closest('[data-no-action="true"]')
    ) {
      return;
    }

    // Allow actual form submissions on auth/contact forms
    if (
      target.type === "submit" &&
      (target.closest("#contact-form") ||
        target.closest("#signin-form") ||
        target.closest("#signup-form"))
    ) {
      return;
    }

    // Allow toggles
    if (
      target.classList.contains("nav-toggle") ||
      target.classList.contains("mobile-nav-close") ||
      target.classList.contains("password-toggle-btn") ||
      target.id === "dash-sidebar-toggle" ||
      target.closest("#dash-sidebar-toggle") ||
      target.classList.contains("dash-hamburger-btn") ||
      target.classList.contains("dash-sidebar-toggle-btn") ||
      target.closest(".dashboard-sidebar")
    ) {
      return;
    }

    // Allow sign-out button
    if (target.id === "dash-signout-btn") {
      return;
    }

    // Allow Go Back button on 404 page
    if (
      target.getAttribute("onclick") &&
      target.getAttribute("onclick").includes("history.back")
    ) {
      return;
    }

    // Allow regular anchor links to primary pages
    if (target.tagName.toLowerCase() === "a") {
      const href = target.getAttribute("href");
      if (
        href &&
        (href.endsWith(".html") ||
          href.startsWith("tel:") ||
          href.startsWith("mailto:") ||
          href.startsWith("https://maps.google.com")) &&
        !target.classList.contains("social-icon-btn") &&
        !target.classList.contains("terms-link") &&
        !target.classList.contains("newsletter-link") &&
        target.getAttribute("data-action") !== "404"
      ) {
        return;
      }
    }

    // Redirect to 404 page
    e.preventDefault();
    window.location.href = "404.html";
  });
}

/**
 * Calculates current time of day and returns greeting
 */
function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return "Good morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  } else if (hour >= 17 && hour < 22) {
    return "Good evening";
  } else {
    return "Good night";
  }
}

function updateTimeGreeting() {
  const greetingElements = document.querySelectorAll(".dynamic-time-greeting");
  const greeting = getTimeGreeting();
  greetingElements.forEach((el) => {
    el.textContent = greeting;
  });
}
