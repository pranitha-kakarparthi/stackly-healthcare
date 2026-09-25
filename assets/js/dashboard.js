/**
 * Stackly Healthcare Platform - Role-Aware Interactive Dashboard System
 */

document.addEventListener("DOMContentLoaded", () => {
  // Check Authentication Session
  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = "sign-in.html";
    return;
  }

  // If on generic dashboard.html, redirect immediately to role-specific dashboard page
  const currentPath = window.location.pathname.toLowerCase();
  const isPatientDash = currentPath.includes("patient-dashboard");
  const isDoctorDash = currentPath.includes("doctor-dashboard");
  const isAdminDash = currentPath.includes("admin-dashboard");
  const isGenericDashboard =
    !isPatientDash &&
    !isDoctorDash &&
    !isAdminDash &&
    (currentPath.endsWith("/dashboard.html") ||
      currentPath.endsWith("\\dashboard.html") ||
      currentPath.endsWith("dashboard.html") ||
      currentPath.endsWith("/dashboard") ||
      currentPath.endsWith("\\dashboard"));

  if (isGenericDashboard) {
    if (currentUser.role === "Doctor") {
      window.location.replace("doctor-dashboard.html");
      return;
    } else if (currentUser.role === "Admin") {
      window.location.replace("admin-dashboard.html");
      return;
    } else {
      window.location.replace("patient-dashboard.html");
      return;
    }
  }

  // Render Role-specific Dashboard
  renderDashboard(currentUser);

  // Setup Sign Out Handler
  setupSignOut();

  // Setup Dashboard Sidebar Toggle
  setupDashboardSidebarToggle();

  // Page-specific Initializations for dedicated views
  initCareTeamPage(currentUser);
  initSettingsPage(currentUser);
});

/**
 * Render the entire dynamic dashboard according to role
 */
function renderDashboard(user) {
  const role = user.role || "Patient";

  // 1. Update Header & User Badge
  const userInitials =
    (user.firstName ? user.firstName[0] : "U") +
    (user.lastName ? user.lastName[0] : "");
  const userNameDisplay = `${user.role === "Doctor" ? "Dr. " : ""}${user.firstName} ${user.lastName}`;

  const avatarEl = document.getElementById("dash-avatar");
  const sidebarAvatarEl = document.getElementById("dash-sidebar-avatar");
  const nameEl = document.getElementById("dash-user-name");
  const roleBadgeEl = document.getElementById("dash-role-badge");
  const roleBadgeTopEl = document.getElementById("dash-role-badge-top");
  const greetingEl = document.getElementById("dash-greeting-text");
  const sessionTimeEl = document.getElementById("dash-session-time");

  if (avatarEl) avatarEl.textContent = userInitials;
  if (sidebarAvatarEl) sidebarAvatarEl.textContent = userInitials;
  if (nameEl) nameEl.textContent = userNameDisplay;
  if (roleBadgeEl) {
    roleBadgeEl.textContent = role;
    roleBadgeEl.className = `dash-role-badge role-badge-${role.toLowerCase()}`;
  }
  if (roleBadgeTopEl) {
    roleBadgeTopEl.textContent = role;
    roleBadgeTopEl.className = `dash-role-badge role-badge-${role.toLowerCase()}`;
  }

  // Greeting by time of day
  const hour = new Date().getHours();
  let timeSalutation = "Good day";
  if (hour >= 5 && hour < 12) timeSalutation = "Good morning";
  else if (hour >= 12 && hour < 17) timeSalutation = "Good afternoon";
  else if (hour >= 17 && hour < 22) timeSalutation = "Good evening";
  else timeSalutation = "Good night";

  if (greetingEl) {
    greetingEl.textContent = `${timeSalutation}, ${userNameDisplay}!`;
  }

  if (sessionTimeEl) {
    sessionTimeEl.textContent = `Logged in at ${user.loginTimestamp || "12:00 PM"} • Active Session`;
  }

  // 2. Render Sidebar Navigation Items based on Role (Links to separate pages)
  renderSidebarNav(role);

  // 3. Render Dynamic Metrics & Main Role View if dynamic placeholder exists
  const mainContentEl = document.getElementById("dashboard-dynamic-content");
  if (mainContentEl) {
    if (role === "Patient") {
      mainContentEl.innerHTML = getPatientDashboardHTML(user);
    } else if (role === "Doctor") {
      mainContentEl.innerHTML = getDoctorDashboardHTML(user);
    } else if (role === "Admin") {
      mainContentEl.innerHTML = getAdminDashboardHTML(user);
    }
  }

  // Attach 404 redirections on all action buttons
  document
    .querySelectorAll('[data-action="404"], .btn-action-404')
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (
          btn.hasAttribute("data-no-action") ||
          btn.closest('[data-no-action="true"]')
        ) {
          return;
        }
        e.preventDefault();
        window.location.href = "404.html";
      });
    });
}

/**
 * Role-specific Sidebar Navigation items leading to separate dedicated pages
 */
function renderSidebarNav(role) {
  const navContainer = document.getElementById("dash-sidebar-nav");
  if (!navContainer) return;

  const currentPath = window.location.pathname.toLowerCase();
  const isPatientDash = currentPath.includes("patient-dashboard");
  const isDoctorDash = currentPath.includes("doctor-dashboard");
  const isAdminDash = currentPath.includes("admin-dashboard");
  const isGenericDash =
    !isPatientDash &&
    !isDoctorDash &&
    !isAdminDash &&
    (currentPath.endsWith("dashboard.html") ||
      currentPath.endsWith("dashboard"));
  const isOverview =
    isGenericDash || isPatientDash || isDoctorDash || isAdminDash;
  const isAppts = currentPath.includes("appointments.html");
  const isRecords = currentPath.includes("records.html");
  const isRx = currentPath.includes("prescriptions.html");
  const isCareTeam = currentPath.includes("care-team.html");
  const isSettings = currentPath.includes("settings.html");

  let navItems = [];
  if (role === "Patient") {
    navItems = [
      {
        icon: "📊",
        label: "My Health Overview",
        href: "patient-dashboard.html",
        active: isOverview,
      },
      {
        icon: "📅",
        label: "Appointments & Visits",
        href: "appointments.html",
        active: isAppts,
      },
      {
        icon: "💊",
        label: "Prescriptions & Rx",
        href: "prescriptions.html",
        active: isRx,
      },
      {
        icon: "🔬",
        label: "Lab Reports & EHR",
        href: "records.html",
        active: isRecords,
      },
      {
        icon: "🩺",
        label: "Care Team Directory",
        href: "care-team.html",
        active: isCareTeam,
      },
      {
        icon: "⚙️",
        label: "Account & Security",
        href: "settings.html",
        active: isSettings,
      },
    ];
  } else if (role === "Doctor") {
    navItems = [
      {
        icon: "🩺",
        label: "Clinical Dashboard",
        href: "doctor-dashboard.html",
        active: isOverview,
      },
      {
        icon: "👥",
        label: "Today's Patient Queue",
        href: "appointments.html",
        active: isAppts,
      },
      {
        icon: "📋",
        label: "Patient Medical Records",
        href: "records.html",
        active: isRecords,
      },
      {
        icon: "💊",
        label: "e-Prescription Center",
        href: "prescriptions.html",
        active: isRx,
      },
      {
        icon: "🏥",
        label: "Medical Staff Roster",
        href: "care-team.html",
        active: isCareTeam,
      },
      {
        icon: "⚙️",
        label: "Clinical & Security Settings",
        href: "settings.html",
        active: isSettings,
      },
    ];
  } else {
    // Admin
    navItems = [
      {
        icon: "🏛️",
        label: "Hospital Operations",
        href: "admin-dashboard.html",
        active: isOverview,
      },
      {
        icon: "👨‍⚕️",
        label: "Duty & Staff Schedule",
        href: "appointments.html",
        active: isAppts,
      },
      {
        icon: "📈",
        label: "Clinical EHR & Audit Logs",
        href: "records.html",
        active: isRecords,
      },
      {
        icon: "💊",
        label: "Pharmacy Inventory",
        href: "prescriptions.html",
        active: isRx,
      },
      {
        icon: "🏥",
        label: "Care Team & Governance",
        href: "care-team.html",
        active: isCareTeam,
      },
      {
        icon: "⚙️",
        label: "System & Security Policies",
        href: "settings.html",
        active: isSettings,
      },
    ];
  }

  navContainer.innerHTML = navItems
    .map(
      (item) => `
    <a href="${item.href}" class="dash-nav-item ${item.active ? "active" : ""}" title="${item.label}">
      <span>${item.icon}</span>
      <span>${item.label}</span>
    </a>
  `
    )
    .join("");
}

/**
 * Patient Dashboard Template
 */
function getPatientDashboardHTML(user) {
  return `
    <!-- Patient KPI Cards -->
    <div class="dash-stats-grid">
      <div class="dash-stat-card">
        <div class="dash-stat-info">
          <h5>Upcoming Visits</h5>
          <h3>2 Visits</h3>
        </div>
        <div class="dash-stat-icon stat-sky">📅</div>
      </div>
      <div class="dash-stat-card">
        <div class="dash-stat-info">
          <h5>Active Prescriptions</h5>
          <h3>3 Active</h3>
        </div>
        <div class="dash-stat-icon stat-teal">💊</div>
      </div>
      <div class="dash-stat-card">
        <div class="dash-stat-info">
          <h5>Heart Rate</h5>
          <h3>72 bpm</h3>
        </div>
        <div class="dash-stat-icon stat-amber">❤️</div>
      </div>
      <div class="dash-stat-card">
        <div class="dash-stat-info">
          <h5>Blood Pressure</h5>
          <h3>118/76</h3>
        </div>
        <div class="dash-stat-icon stat-indigo">🩸</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="dash-card" style="margin-bottom: 28px;">
      <div class="dash-card-header">
        <h3>Patient Self-Service Quick Actions</h3>
        <span class="status-badge status-confirmed">Instant Access</span>
      </div>
      <div class="dash-actions-row">
        <button class="dash-action-btn-card" data-action="404">
          <span style="font-size: 26px;">🩺</span>
          <strong>Book Specialist Visit</strong>
          <span style="font-size: 12px; color: var(--text-muted);">Cardiology, Dental & Neuro</span>
        </button>
        <button class="dash-action-btn-card" data-action="404">
          <span style="font-size: 26px;">📑</span>
          <strong>Download Medical Records</strong>
          <span style="font-size: 12px; color: var(--text-muted);">Encrypted PDF Health Dossier</span>
        </button>
        <button class="dash-action-btn-card" data-action="404">
          <span style="font-size: 26px;">📦</span>
          <strong>Order Pharmacy Refill</strong>
          <span style="font-size: 12px; color: var(--text-muted);">Same-day doorstep delivery</span>
        </button>
      </div>
    </div>

    <!-- 2 Column Widgets -->
    <div class="dashboard-grid-2">
      <!-- Upcoming Appointments -->
      <div class="dash-card">
        <div class="dash-card-header">
          <h3>Upcoming Clinical Appointments</h3>
          <a href="appointments.html" class="btn btn-sm btn-outline">View All &rarr;</a>
        </div>
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Department</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Dr. Alexander Wright</strong></td>
                <td>Cardiology</td>
                <td>Tomorrow, 10:30 AM</td>
                <td><span class="status-badge status-confirmed">Confirmed</span></td>
                <td><button class="btn btn-sm btn-secondary" data-action="404">Details</button></td>
              </tr>
              <tr>
                <td><strong>Dr. Priya Sharma</strong></td>
                <td>Pediatrics & Family Care</td>
                <td>Sep 28, 03:00 PM</td>
                <td><span class="status-badge status-pending">Pending Review</span></td>
                <td><button class="btn btn-sm btn-secondary" data-action="404">Reschedule</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Vitals Telemetry -->
      <div class="dash-card">
        <div class="dash-card-header">
          <h3>Recent Vitals & Lab Telemetry</h3>
          <span class="status-badge status-completed">Verified</span>
        </div>
        <ul style="display: flex; flex-direction: column; gap: 14px; font-size: 14px;">
          <li style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-light); padding-bottom: 10px;">
            <span>Fasting Blood Glucose</span>
            <strong>94 mg/dL (Normal)</strong>
          </li>
          <li style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-light); padding-bottom: 10px;">
            <span>Cholesterol (Total)</span>
            <strong>174 mg/dL (Optimal)</strong>
          </li>
          <li style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-light); padding-bottom: 10px;">
            <span>Oxygen Saturation (SpO2)</span>
            <strong>99% (Excellent)</strong>
          </li>
          <li style="display: flex; justify-content: space-between; padding-bottom: 4px;">
            <span>BMI & Body Weight</span>
            <strong>22.4 • 64 kg</strong>
          </li>
        </ul>
        <button class="btn btn-primary btn-block" style="margin-top: 18px;" data-action="404">Sync Wearable Tracker</button>
      </div>
    </div>
  `;
}

/**
 * Doctor Dashboard Template
 */
function getDoctorDashboardHTML(user) {
  return `
    <!-- Doctor Clinical KPI Cards -->
    <div class="dash-stats-grid">
      <div class="dash-stat-card">
        <div class="dash-stat-info">
          <h5>Today's Outpatients</h5>
          <h3>16 Patients</h3>
        </div>
        <div class="dash-stat-icon stat-sky">👨‍⚕️</div>
      </div>
      <div class="dash-stat-card">
        <div class="dash-stat-info">
          <h5>Inpatient Rounds</h5>
          <h3>5 Bedside</h3>
        </div>
        <div class="dash-stat-icon stat-teal">🏥</div>
      </div>
      <div class="dash-stat-card">
        <div class="dash-stat-info">
          <h5>Pending Lab Reviews</h5>
          <h3>7 Diagnostics</h3>
        </div>
        <div class="dash-stat-icon stat-amber">🔬</div>
      </div>
      <div class="dash-stat-card">
        <div class="dash-stat-info">
          <h5>Teleconsult Requests</h5>
          <h3>3 Awaiting</h3>
        </div>
        <div class="dash-stat-icon stat-indigo">💻</div>
      </div>
    </div>

    <!-- Quick Doctor Action Tools -->
    <div class="dash-card" style="margin-bottom: 28px;">
      <div class="dash-card-header">
        <h3>Physician Clinical Workstation</h3>
        <span class="status-badge status-confirmed">Authenticated Clinician</span>
      </div>
      <div class="dash-actions-row">
        <button class="dash-action-btn-card" data-action="404">
          <span style="font-size: 26px;">📝</span>
          <strong>Write Electronic Rx</strong>
          <span style="font-size: 12px; color: var(--text-muted);">Issue digital signed prescription</span>
        </button>
        <button class="dash-action-btn-card" data-action="404">
          <span style="font-size: 26px;">🧪</span>
          <strong>Order Diagnostic Panel</strong>
          <span style="font-size: 12px; color: var(--text-muted);">Pathology, MRI & ECG orders</span>
        </button>
        <button class="dash-action-btn-card" data-action="404">
          <span style="font-size: 26px;">🚨</span>
          <strong>Emergency Triage Alert</strong>
          <span style="font-size: 12px; color: var(--text-muted);">Immediate nursing call system</span>
        </button>
      </div>
    </div>

    <!-- 2 Column Layout -->
    <div class="dashboard-grid-2">
      <!-- Today's Queue -->
      <div class="dash-card">
        <div class="dash-card-header">
          <h3>Today's Patient Schedule (OPD Queue)</h3>
          <a href="appointments.html" class="btn btn-sm btn-primary">Full Schedule &rarr;</a>
        </div>
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient Name</th>
                <th>Chief Complaint</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>#01</strong></td>
                <td>Sarah Jenkins (32/F)</td>
                <td>Follow-up Hypertensive Review</td>
                <td><span class="status-badge status-confirmed">In Consultation</span></td>
                <td><button class="btn btn-sm btn-secondary" data-action="404">Open EHR</button></td>
              </tr>
              <tr>
                <td><strong>#02</strong></td>
                <td>Robert Miller (58/M)</td>
                <td>Chest Tightness & Palpitations</td>
                <td><span class="status-badge status-pending">In Triage</span></td>
                <td><button class="btn btn-sm btn-secondary" data-action="404">Review ECG</button></td>
              </tr>
              <tr>
                <td><strong>#03</strong></td>
                <td>Ananya Ramesh (24/F)</td>
                <td>Post-operative ECG & Echo</td>
                <td><span class="status-badge status-completed">Waiting Room</span></td>
                <td><button class="btn btn-sm btn-secondary" data-action="404">Admit</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Critical Clinical Alerts -->
      <div class="dash-card">
        <div class="dash-card-header">
          <h3>Critical Clinical Alerts</h3>
          <span class="status-badge status-cancelled">High Priority</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 14px; font-size: 13px;">
          <div style="padding: 12px; border-radius: var(--radius-sm); background: #fef2f2; border: 1px solid #fecaca;">
            <strong style="color: #991b1b;">⚠️ Abnormal Potassium (6.1 mEq/L)</strong>
            <p style="color: #7f1d1d; margin-top: 4px;">Patient Ward 3 - Bed 12. Requires immediate cardiology evaluation.</p>
          </div>
          <div style="padding: 12px; border-radius: var(--radius-sm); background: #fffbeb; border: 1px solid #fde68a;">
            <strong style="color: #92400e;">⚡ Emergency In-Clinic Triage</strong>
            <p style="color: #78350f; margin-top: 4px;">Salem District Emergency Department transferring acute trauma patient to ICU.</p>
          </div>
        </div>
        <button class="btn btn-outline btn-block" style="margin-top: 20px;" data-action="404">Acknowledge All Alerts</button>
      </div>
    </div>
  `;
}

/**
 * Admin Dashboard Template
 */
function getAdminDashboardHTML(user) {
  return `
    <!-- Hospital System Metrics -->
    <div class="dash-stats-grid">
      <div class="dash-stat-card">
        <div class="dash-stat-info">
          <h5>Total Bed Occupancy</h5>
          <h3>87% (248/285)</h3>
        </div>
        <div class="dash-stat-icon stat-sky">🏥</div>
      </div>
      <div class="dash-stat-card">
        <div class="dash-stat-info">
          <h5>Active Clinical Staff</h5>
          <h3>64 On Duty</h3>
        </div>
        <div class="dash-stat-icon stat-teal">👨‍⚕️</div>
      </div>
      <div class="dash-stat-card">
        <div class="dash-stat-info">
          <h5>Today's Outpatient Flow</h5>
          <h3>342 Visits</h3>
        </div>
        <div class="dash-stat-icon stat-amber">📈</div>
      </div>
      <div class="dash-stat-card">
        <div class="dash-stat-info">
          <h5>Critical Care ICU Load</h5>
          <h3>92% High Load</h3>
        </div>
        <div class="dash-stat-icon stat-indigo">🚨</div>
      </div>
    </div>

    <!-- Hospital Operations Actions -->
    <div class="dash-card" style="margin-bottom: 28px;">
      <div class="dash-card-header">
        <h3>Directorate Operations & Governance</h3>
        <span class="status-badge status-confirmed">System Administrator</span>
      </div>
      <div class="dash-actions-row">
        <button class="dash-action-btn-card" data-action="404">
          <span style="font-size: 26px;">🏥</span>
          <strong>Allocate Ward Capacity</strong>
          <span style="font-size: 12px; color: var(--text-muted);">Manage ICU and General Ward Beds</span>
        </button>
        <button class="dash-action-btn-card" data-action="404">
          <span style="font-size: 26px;">📊</span>
          <strong>Generate Regulatory Audit</strong>
          <span style="font-size: 12px; color: var(--text-muted);">NABH / ISO Healthcare Compliance</span>
        </button>
        <button class="dash-action-btn-card" data-action="404">
          <span style="font-size: 26px;">🛡️</span>
          <strong>Staff Roster Scheduler</strong>
          <span style="font-size: 12px; color: var(--text-muted);">Reassign shift duty protocols</span>
        </button>
      </div>
    </div>

    <!-- Department Operations Table -->
    <div class="dashboard-grid-2">
      <div class="dash-card">
        <div class="dash-card-header">
          <h3>Departmental Capacity & Census</h3>
          <a href="records.html" class="btn btn-sm btn-outline">Audit Records &rarr;</a>
        </div>
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Head Physician</th>
                <th>Capacity</th>
                <th>Current Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Cardiology</strong></td>
                <td>Dr. Alexander Wright</td>
                <td>42 / 45 Beds</td>
                <td><span class="status-badge status-pending">Near Capacity</span></td>
                <td><button class="btn btn-sm btn-secondary" data-action="404">Manage</button></td>
              </tr>
              <tr>
                <td><strong>Neurology</strong></td>
                <td>Dr. David Vance</td>
                <td>28 / 35 Beds</td>
                <td><span class="status-badge status-confirmed">Optimal</span></td>
                <td><button class="btn btn-sm btn-secondary" data-action="404">Manage</button></td>
              </tr>
              <tr>
                <td><strong>Pediatrics</strong></td>
                <td>Dr. Priya Sharma</td>
                <td>30 / 30 Beds</td>
                <td><span class="status-badge status-cancelled">Full (Overflow)</span></td>
                <td><button class="btn btn-sm btn-secondary" data-action="404">Divert</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="dash-card">
        <div class="dash-card-header">
          <h3>Security & System Audit Log</h3>
          <span class="status-badge status-confirmed">Live Stream</span>
        </div>
        <ul style="display: flex; flex-direction: column; gap: 12px; font-size: 13px;">
          <li style="border-bottom: 1px solid var(--border-light); padding-bottom: 8px;">
            <strong>Chief Medical Officer</strong> accessed Cardiology EHR records.
            <div style="color: var(--text-muted); font-size: 11px;">10 minutes ago • Terminal #Salem-04</div>
          </li>
          <li style="border-bottom: 1px solid var(--border-light); padding-bottom: 8px;">
            <strong>Pharmacy System</strong> dispatched automatic stock refill.
            <div style="color: var(--text-muted); font-size: 11px;">28 minutes ago • Bot Worker</div>
          </li>
          <li style="padding-bottom: 4px;">
            <strong>Admin Console</strong> updated duty shift for Emergency ICU.
            <div style="color: var(--text-muted); font-size: 11px;">1 hour ago • Clinical Operations</div>
          </li>
        </ul>
        <button class="btn btn-secondary btn-block" style="margin-top: 18px;" data-action="404">View Complete Security Log</button>
      </div>
    </div>
  `;
}

/**
 * Sign out user
 */
function setupSignOut() {
  document
    .querySelectorAll("#dash-signout-btn, .btn-signout")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.removeItem(STORAGE_KEYS.ROLE);
        window.location.href = "sign-in.html";
      });
    });
}

/**
 * Setup Dashboard Sidebar Toggle inside the sidebar to expand/collapse alone
 */
function setupDashboardSidebarToggle() {
  const toggleBtn = document.getElementById("dash-sidebar-toggle");
  const sidebar = document.querySelector(".dashboard-sidebar");
  const container = document.querySelector(".dashboard-container");
  const backdrop = document.getElementById("dash-sidebar-backdrop");

  if (!toggleBtn || !sidebar) return;

  // Restore saved collapsed state on desktop
  if (window.innerWidth >= 992) {
    try {
      const isSavedCollapsed =
        localStorage.getItem("stackly_sidebar_collapsed") === "true";
      if (isSavedCollapsed) {
        sidebar.classList.add("collapsed");
        if (container) container.classList.add("sidebar-collapsed");
        toggleBtn.setAttribute("aria-expanded", "false");
      } else {
        toggleBtn.setAttribute("aria-expanded", "true");
      }
    } catch (err) {}
  }

  const toggleSidebar = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    }

    const isMobile = window.innerWidth < 992;
    if (isMobile) {
      const isExpanded = sidebar.classList.contains("mobile-expanded");
      if (isExpanded) {
        sidebar.classList.remove("mobile-expanded");
        if (backdrop) backdrop.classList.remove("show");
        toggleBtn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      } else {
        sidebar.classList.add("mobile-expanded");
        if (backdrop) backdrop.classList.add("show");
        toggleBtn.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
      }
    } else {
      sidebar.classList.toggle("collapsed");
      const isCollapsed = sidebar.classList.contains("collapsed");
      if (container) {
        container.classList.toggle("sidebar-collapsed", isCollapsed);
      }
      toggleBtn.setAttribute("aria-expanded", String(!isCollapsed));
      try {
        localStorage.setItem(
          "stackly_sidebar_collapsed",
          isCollapsed ? "true" : "false"
        );
      } catch (err) {}
    }
  };

  const closeMobileSidebar = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    sidebar.classList.remove("mobile-expanded");
    if (backdrop) backdrop.classList.remove("show");
    toggleBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  toggleBtn.addEventListener("click", toggleSidebar);

  if (backdrop) {
    backdrop.addEventListener("click", closeMobileSidebar);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("mobile-expanded")) {
      closeMobileSidebar();
    }
  });

  // Reset scroll lock & mobile state if resized to desktop
  window.addEventListener("resize", () => {
    if (
      window.innerWidth >= 992 &&
      sidebar.classList.contains("mobile-expanded")
    ) {
      closeMobileSidebar();
    }
  });
}

/**
 * Care Team / Roster Search & Filter Initializer
 */
function initCareTeamPage(user) {
  if (user) {
    const titleEl = document.getElementById("care-team-page-title");
    if (titleEl) {
      if (user.role === "Doctor") {
        titleEl.textContent = "Medical Staff Roster";
      } else if (user.role === "Admin") {
        titleEl.textContent = "Care Team & Governance";
      } else {
        titleEl.textContent = "Care Team Directory";
      }
    }
  }

  const searchInput = document.getElementById("care-search-input");
  const searchBtn = document.getElementById("care-search-btn");
  const filterBtns = document.querySelectorAll(".filter-dept-btn");
  const cards = document.querySelectorAll(".care-member-card");
  const tableRows = document.querySelectorAll(".data-table tbody tr");

  if (
    !searchInput &&
    !filterBtns.length &&
    !cards.length &&
    !tableRows.length
  ) {
    return;
  }

  let activeDept = "all";

  function applyFilter() {
    const term = searchInput ? searchInput.value.toLowerCase().trim() : "";

    // Filter cards
    cards.forEach((card) => {
      const text = card.textContent.toLowerCase();
      const matchesSearch = !term || text.includes(term);
      let matchesDept = true;
      if (activeDept !== "all") {
        matchesDept = text.includes(activeDept);
      }
      card.style.display = matchesSearch && matchesDept ? "" : "none";
    });

    // Filter table rows
    tableRows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      const matchesSearch = !term || text.includes(term);
      let matchesDept = true;
      if (activeDept !== "all") {
        matchesDept = text.includes(activeDept);
      }
      row.style.display = matchesSearch && matchesDept ? "" : "none";
    });
  }

  if (filterBtns) {
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        filterBtns.forEach((b) => {
          b.classList.remove("btn-primary", "active");
          b.classList.add("btn-secondary");
        });
        btn.classList.remove("btn-secondary");
        btn.classList.add("btn-primary", "active");
        activeDept = btn.getAttribute("data-dept") || "all";
        applyFilter();
      });
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      applyFilter();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", applyFilter);
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyFilter();
      }
    });
  }
}

/**
 * Settings Page Form Initializer
 */
function initSettingsPage(user) {
  if (!user) return;
  const fn = document.getElementById("settings-firstname");
  const ln = document.getElementById("settings-lastname");
  const em = document.getElementById("settings-email");
  const ph = document.getElementById("settings-phone");
  if (fn && !fn.value) fn.value = user.firstName || "";
  if (ln && !ln.value) ln.value = user.lastName || "";
  if (em && !em.value) em.value = user.email || "";
  if (ph && !ph.value) ph.value = user.phone || "9876543210";
}
