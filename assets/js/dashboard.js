/**
 * Stackly Healthcare Platform - Role-Aware Interactive Dashboard System
 */

document.addEventListener("DOMContentLoaded", () => {
  // Ensure preloader is dismissed immediately on dashboard pages to prevent click blocking
  const loader = document.getElementById("page-loader");
  if (loader) {
    loader.classList.add("loaded");
    loader.style.pointerEvents = "none";
    loader.style.display = "none";
  }

  // Ensure dashboard root classes for strict viewport containment
  if (document.querySelector(".dashboard-page-wrapper")) {
    document.documentElement.classList.add("dashboard-html");
    document.body.classList.add("dashboard-body");
  }

  // Universal 404 Action Redirection for all dashboard buttons and placeholder links
  setupDashboard404Actions();

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

    <!-- Section 4: Active Therapeutic Medication Schedule & Daily Dosages -->
    <div class="dash-card" style="margin-top: 28px; margin-bottom: 28px;">
      <div class="dash-card-header">
        <h3>Active Therapeutic Medication Schedule & Daily Dosages</h3>
        <a href="prescriptions.html" class="btn btn-sm btn-outline">Pharmacy Refills &rarr;</a>
      </div>
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Medication</th>
              <th>Strength & Form</th>
              <th>Scheduled Frequency</th>
              <th>Next Dose Time</th>
              <th>Compliance Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Telmisartan</strong></td>
              <td>40 mg Tablet</td>
              <td>Once Daily with Morning Breakfast</td>
              <td>Tomorrow, 08:30 AM</td>
              <td><span class="status-badge status-confirmed">Taken Today</span></td>
              <td><button class="btn btn-sm btn-secondary" data-action="404">Mark Taken</button></td>
            </tr>
            <tr>
              <td><strong>Atorvastatin</strong></td>
              <td>10 mg Tablet</td>
              <td>Once Daily at Bedtime</td>
              <td>Tonight, 09:30 PM</td>
              <td><span class="status-badge status-pending">Pending Tonight</span></td>
              <td><button class="btn btn-sm btn-secondary" data-action="404">Remind Me</button></td>
            </tr>
            <tr>
              <td><strong>Omega-3 Fish Oil</strong></td>
              <td>1000 mg Softgel</td>
              <td>Twice Daily post Meals</td>
              <td>Tonight, 08:00 PM</td>
              <td><span class="status-badge status-pending">Pending Tonight</span></td>
              <td><button class="btn btn-sm btn-secondary" data-action="404">Remind Me</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Section 5: Preventive Health Screenings & Wellness Milestones -->
    <div class="dash-card" style="margin-bottom: 28px;">
      <div class="dash-card-header">
        <h3>Preventive Health Screenings & Wellness Milestones</h3>
        <span class="status-badge status-confirmed">Up to Date</span>
      </div>
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Preventive Screening</th>
              <th>Target Specialty</th>
              <th>Last Certified Date</th>
              <th>Next Due Date</th>
              <th>Clinical Recommendation</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Cardiovascular Stress Echo</strong></td>
              <td>Cardiology Institute</td>
              <td>Aug 14, 2026</td>
              <td>Aug 2027 (Annual)</td>
              <td>Normal left ventricular ejection fraction (62%)</td>
              <td><button class="btn btn-sm btn-outline" data-action="404">View Echo</button></td>
            </tr>
            <tr>
              <td><strong>Comprehensive Ophthalmic Retinopathy</strong></td>
              <td>Ophthalmology Wing</td>
              <td>Nov 02, 2025</td>
              <td>Nov 2026 (Due Soon)</td>
              <td>Annual diabetic and hypertensive retinal assessment</td>
              <td><button class="btn btn-sm btn-primary" data-action="404">Book Slot</button></td>
            </tr>
          </tbody>
        </table>
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

    <!-- Section 4: Inpatient Ward Bedside Census & Rounds -->
    <div class="dash-card" style="margin-top: 28px; margin-bottom: 28px;">
      <div class="dash-card-header">
        <h3>Inpatient Ward Bedside Census & Rounds</h3>
        <span class="status-badge status-confirmed">Bedside Roster Active</span>
      </div>
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Bed / Ward</th>
              <th>Patient Name & Demographics</th>
              <th>Admitting Diagnosis</th>
              <th>Primary Nurse</th>
              <th>Clinical Hemodynamics</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>ICU - Bed 04</strong></td>
              <td>Margaret Evans (64/F)</td>
              <td>Acute Coronary Syndrome (Post-PCI)</td>
              <td>Nurse Elena Rostova</td>
              <td><span class="status-badge status-confirmed">BP 124/80 • HR 72</span></td>
              <td><button class="btn btn-sm btn-secondary" data-action="404">Rounds Note</button></td>
            </tr>
            <tr>
              <td><strong>Ward 3B - Bed 12</strong></td>
              <td>Ramesh Natarajan (48/M)</td>
              <td>Severe Hyperkalemia & Arrhythmia</td>
              <td>Nurse Rajeshwari</td>
              <td><span class="status-badge status-pending">Potassium 6.1 (Stat)</span></td>
              <td><button class="btn btn-sm btn-primary" data-action="404">Urgent Review</button></td>
            </tr>
            <tr>
              <td><strong>Post-Op - Bed 08</strong></td>
              <td>David Chen (52/M)</td>
              <td>Coronary Artery Bypass Graft (Day 3)</td>
              <td>Nurse Thomas K.</td>
              <td><span class="status-badge status-completed">Stable • Extubated</span></td>
              <td><button class="btn btn-sm btn-secondary" data-action="404">Step-down</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Section 5: Pending Diagnostic Test Authorizations & Lab Reviews -->
    <div class="dash-card" style="margin-bottom: 28px;">
      <div class="dash-card-header">
        <h3>Pending Diagnostic Test Authorizations & Lab Reviews</h3>
        <span class="status-badge status-pending">3 Orders Awaiting Sign-off</span>
      </div>
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Patient Name</th>
              <th>Diagnostic Investigation</th>
              <th>Clinical Urgency</th>
              <th>Ordering Resident</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>#ORD-9104</strong></td>
              <td>Robert Miller</td>
              <td>High-Sensitivity Troponin-I Serial Panel</td>
              <td><span class="status-badge status-cancelled">STAT Urgent</span></td>
              <td>Dr. Maya Lin, Resident</td>
              <td><button class="btn btn-sm btn-primary" data-action="404">Sign & Authorize</button></td>
            </tr>
            <tr>
              <td><strong>#ORD-9105</strong></td>
              <td>Clara Oswald</td>
              <td>Contrast-Enhanced Abdominal CT Angiogram</td>
              <td><span class="status-badge status-pending">Within 4 Hours</span></td>
              <td>Dr. Marcus Brody, Fellow</td>
              <td><button class="btn btn-sm btn-secondary" data-action="404">Review Renal Panel</button></td>
            </tr>
          </tbody>
        </table>
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

    <!-- Section 4: Critical Diagnostic Medical Equipment & Infrastructure Telemetry -->
    <div class="dash-card" style="margin-top: 28px; margin-bottom: 28px;">
      <div class="dash-card-header">
        <h3>Critical Diagnostic Medical Equipment & Infrastructure Telemetry</h3>
        <span class="status-badge status-confirmed">Sensors Online</span>
      </div>
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Biomedical Asset</th>
              <th>Location / Wing</th>
              <th>Uptime & Operational Status</th>
              <th>Calibration Status</th>
              <th>Service Contract</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Siemens Magnetom Vida 3T MRI</strong></td>
              <td>Radiology Wing (Ground Floor)</td>
              <td><span class="status-badge status-confirmed">99.8% Uptime • Active</span></td>
              <td>Certified Sep 15, 2026</td>
              <td>OEM Platinum Care</td>
              <td><button class="btn btn-sm btn-secondary" data-action="404">Diagnostics</button></td>
            </tr>
            <tr>
              <td><strong>GE 128-Slice Optima CT Scanner</strong></td>
              <td>Emergency Radiology Suite</td>
              <td><span class="status-badge status-confirmed">Active (24/7 STAT)</span></td>
              <td>Certified Aug 20, 2026</td>
              <td>OEM 24/7 Coverage</td>
              <td><button class="btn btn-sm btn-secondary" data-action="404">Diagnostics</button></td>
            </tr>
            <tr>
              <td><strong>Philips Azurion 7 Biplane Cath Lab</strong></td>
              <td>Cardiology Interventional OR 1</td>
              <td><span class="status-badge status-confirmed">Active • Clean Room</span></td>
              <td>Certified Sep 01, 2026</td>
              <td>Comprehensive AMC</td>
              <td><button class="btn btn-sm btn-secondary" data-action="404">Logs</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Section 5: Regulatory Accreditation & Clinical Quality Compliance Registry -->
    <div class="dash-card" style="margin-bottom: 28px;">
      <div class="dash-card-header">
        <h3>Regulatory Accreditation & Clinical Quality Compliance Registry</h3>
        <span class="status-badge status-confirmed">NABH Accredited</span>
      </div>
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Compliance Protocol</th>
              <th>Governing Standards Body</th>
              <th>Audit Frequency</th>
              <th>Last Certified Rating</th>
              <th>Compliance Officer</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>NABH Hospital Safety Standard v5.1</strong></td>
              <td>National Accreditation Board (NABH)</td>
              <td>Annual Inspection</td>
              <td><span class="status-badge status-confirmed">Grade A+ (98.4%)</span></td>
              <td>Dr. Rajeshwari Swaminathan</td>
              <td><button class="btn btn-sm btn-outline" data-action="404">View Certificate</button></td>
            </tr>
            <tr>
              <td><strong>ISO 27001:2022 Healthcare Data Vault</strong></td>
              <td>International Organization for Standardization</td>
              <td>Biannual Cryptographic Audit</td>
              <td><span class="status-badge status-confirmed">Full Conformance</span></td>
              <td>Chief Information Security Officer</td>
              <td><button class="btn btn-sm btn-outline" data-action="404">Audit Log</button></td>
            </tr>
          </tbody>
        </table>
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
    const mainEl = document.querySelector(".dashboard-main");
    if (isMobile) {
      const isExpanded = sidebar.classList.contains("mobile-expanded");
      if (isExpanded) {
        sidebar.classList.remove("mobile-expanded");
        if (backdrop) backdrop.classList.remove("show");
        toggleBtn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
        if (mainEl) mainEl.style.overflow = "";
      } else {
        sidebar.classList.add("mobile-expanded");
        if (backdrop) backdrop.classList.add("show");
        toggleBtn.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
        if (mainEl) mainEl.style.overflow = "hidden";
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
    const mainEl = document.querySelector(".dashboard-main");
    if (mainEl) mainEl.style.overflow = "";
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

  // Forward wheel events from sidebar to main content when sidebar has no internal scroll
  const mainContentEl = document.querySelector(".dashboard-main");
  if (sidebar && mainContentEl) {
    sidebar.addEventListener(
      "wheel",
      (e) => {
        const canScrollUp = e.deltaY < 0 && sidebar.scrollTop > 0;
        const canScrollDown =
          e.deltaY > 0 &&
          sidebar.scrollTop + sidebar.clientHeight < sidebar.scrollHeight - 1;
        if (!canScrollUp && !canScrollDown) {
          mainContentEl.scrollTop += e.deltaY;
        }
      },
      { passive: true }
    );
  }
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

/**
 * Universal Action Redirection to 404 Page
 * Redirects all non-navigational action buttons, cards, and dummy links in dashboard pages
 */
function setupDashboard404Actions() {
  if (window._dash404Initialized) return;
  window._dash404Initialized = true;

  // Capture-phase click listener to guarantee all actions trigger 404 redirection
  document.addEventListener(
    "click",
    (e) => {
      // Find the clicked button, link, or action card
      const actionEl = e.target.closest(
        "button, a, .dash-action-btn-card, [data-action='404'], .btn-action-404"
      );
      if (!actionEl) return;

      // 1. Allow sidebar toggle inside sidebar
      if (
        actionEl.id === "dash-sidebar-toggle" ||
        actionEl.closest("#dash-sidebar-toggle")
      ) {
        return;
      }

      // 2. Allow Sign Out button
      if (
        actionEl.id === "dash-signout-btn" ||
        actionEl.classList.contains("btn-signout")
      ) {
        return;
      }

      // 3. Allow real navigation links (valid .html files, mailto, tel)
      if (actionEl.tagName === "A") {
        const href = actionEl.getAttribute("href");
        if (
          href &&
          href !== "#" &&
          href !== "" &&
          !href.startsWith("javascript:") &&
          (href.endsWith(".html") ||
            href.includes(".html#") ||
            href.startsWith("mailto:") ||
            href.startsWith("tel:"))
        ) {
          return; // Allow standard navigation to page
        }
      }

      // 4. Allow Care Team live search & filter buttons, and password eye toggle
      if (
        actionEl.id === "care-search-btn" ||
        actionEl.classList.contains("filter-dept-btn") ||
        actionEl.classList.contains("password-toggle-btn") ||
        actionEl.hasAttribute("data-no-action") ||
        actionEl.closest('[data-no-action="true"]')
      ) {
        return; // Handled by dedicated in-page logic
      }

      // All other action buttons, cards, and placeholder links redirect to 404.html
      e.preventDefault();
      e.stopPropagation();
      window.location.href = "404.html";
    },
    true
  );

  // Form submissions (like Settings forms) redirect to 404.html
  document.addEventListener(
    "submit",
    (e) => {
      if (
        e.target.hasAttribute("data-no-action") ||
        e.target.closest('[data-no-action="true"]')
      ) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      window.location.href = "404.html";
    },
    true
  );
}
