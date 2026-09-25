# Stackly Healthcare Portal

A modern, responsive, and accessible digital healthcare web portal designed for patients, doctors, and medical administrative teams.

---

## 📁 Project Directory Structure

```text
Healthcare/
├── assets/
│   ├── css/
│   │   └── main.css             # Unified design system, CSS variables & responsive rules
│   ├── images/
│   │   └── logo.webp            # Brand logo
│   └── js/
│       ├── auth.js              # Authentication, role access control & session storage
│       ├── dashboard.js         # Interactive dashboard telemetry, metrics & sidebar management
│       └── main.js              # Public site navigation, forms, search & AOS animations
├── .gitignore                   # Version control exclusions
├── 404.html                     # Custom 404 error page
├── about.html                   # About Us & leadership
├── admin-dashboard.html         # Hospital administrative telemetry & audit portal
├── appointments.html            # Appointment booking & scheduling system
├── blog.html                    # Healthcare articles, insights & newsletter subscription
├── care-team.html               # Medical specialists & department directory
├── contact.html                 # Contact, emergency support & inquiry forms
├── dashboard.html               # Dynamic role-based dashboard router
├── doctor-dashboard.html        # Clinical patient rounds & doctor console
├── index.html                   # Main portal homepage & service highlights
├── patient-dashboard.html       # Patient overview, vitals telemetry & records
├── prescriptions.html           # Active medication regimens & digital pharmacy refills
├── records.html                 # Encrypted medical records & laboratory reports
├── services.html                # Medical specialties & diagnostic services
├── settings.html                # Patient profile, security & notification preferences
├── sign-in.html                 # Secure authentication & demo credential logins
└── sign-up.html                 # Patient registration portal
```

---

## 🚀 Key Architectural Features

- **Fixed-Position, Fixed-Height Sidebar**:
  - The dashboard navigation sidebar remains fixed at `100vh` across all viewports (desktop, tablet, and mobile).
  - Main clinical and telemetry content (`.dashboard-main`) scrolls independently with smooth scrolling and zero clipping.
- **Role-Based Portals**:
  - **Patient**: View vital telemetry, upcoming appointments, prescriptions, and health records.
  - **Doctor**: Clinical rounds, appointment requests, and diagnostic summaries.
  - **Admin**: System telemetry, provider utilization, and audit logs.
- **Strict Media Integrity**:
  - Zero image repetitions across the entire application with curated Unsplash clinical photography.
- **Responsive Layout**:
  - Fully verified across mobile (320px, 360px, 480px), tablet (768px), and desktop viewports.
- **Accessible & Clean**:
  - WCAG-compliant color contrast, semantic HTML5 tags, ARIA attributes, and keyboard accessibility.

---

## 💻 Getting Started

You can run this project with any static file server:

```bash
# Using Node.js serve
npx serve .

# Using Python 3 built-in server
python -m http.server 8080
```

Alternatively, open `index.html` directly in any modern web browser.
