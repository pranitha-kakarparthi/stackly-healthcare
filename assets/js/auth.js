/**
 * ProHealth Healthcare Platform - Authentication & Validation System
 */

const STORAGE_KEYS = {
  USERS: "prohealth_users",
  CURRENT_USER: "prohealth_current_user",
  ROLE: "prohealth_role",
  PREFERENCES: "prohealth_preferences",
};

// Purge any old demo accounts and initialize clean storage
function initializeAuthStorage() {
  const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!existingUsers) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
  } else {
    try {
      const users = JSON.parse(existingUsers);
      // Filter out any previous demo seed accounts
      const cleaned = users.filter(
        (u) =>
          u.email !== "patient@prohealth.com" &&
          u.email !== "doctor@prohealth.com" &&
          u.email !== "admin@prohealth.com"
      );
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cleaned));
    } catch (e) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    }
  }
}

// Retrieve users from storage
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
  } catch (e) {
    return [];
  }
}

// Get current logged-in user
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
  } catch (e) {
    return null;
  }
}

// Name validator: strictly alphabets and spaces
function isValidName(name) {
  return /^[A-Za-z\s]{2,50}$/.test(name.trim());
}

// Mobile validator: strictly 10 digits
function isValidPhone(phone) {
  const cleanPhone = phone.replace(/\D/g, "");
  return /^\d{10}$/.test(cleanPhone);
}

// Password Validator: at least 8 characters, at least 1 uppercase, at least 1 number, at least 1 special char
function isValidPassword(password) {
  if (!password || password.length < 8) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUppercase && hasNumber && hasSpecial;
}

// Password Strength Evaluator for UI feedback
function evaluatePasswordStrength(password) {
  if (!password) return { text: "Empty", color: "#e2e8f0", percent: 0 };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (password.length >= 12) score += 1;

  if (score < 4) {
    return {
      text: "Needs 8+ chars, 1 uppercase, 1 number & 1 special character",
      color: "#ef4444",
      percent: 35,
    };
  } else if (score === 4) {
    return {
      text: "Good password (meets all requirements)",
      color: "#f59e0b",
      percent: 75,
    };
  } else {
    return {
      text: "Excellent strong password",
      color: "#10b981",
      percent: 100,
    };
  }
}

/**
 * Display explicit error message for a specific input field
 */
function setFieldError(input, message) {
  if (!input) return;
  input.classList.add("is-invalid");
  const group = input.closest(".form-group") || input.parentElement;
  if (group) {
    group.classList.add("has-error");
    let fb = group.querySelector(".invalid-feedback");
    if (!fb) {
      fb = document.createElement("div");
      fb.className = "invalid-feedback show-error";
      group.appendChild(fb);
    }
    if (message) {
      fb.textContent = message;
    }
    fb.classList.add("show-error");
    fb.style.display = "block";
  }
}

/**
 * Clear error message for a specific input field
 */
function clearFieldError(input) {
  if (!input) return;
  input.classList.remove("is-invalid");
  const group = input.closest(".form-group") || input.parentElement;
  if (group) {
    group.classList.remove("has-error");
    const fb = group.querySelector(".invalid-feedback");
    if (fb) {
      fb.classList.remove("show-error");
      fb.style.display = "none";
    }
  }
}

// Initialize on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  initializeAuthStorage();
  initSignInForm();
  initSignUpForm();
  initPasswordToggles();
  initNamePhoneInputsRestraints();
});

/**
 * Real-time input restraints for Names (alphabets only) and Phone (numbers only, max 10)
 */
function initNamePhoneInputsRestraints() {
  const alphaInputs = document.querySelectorAll(
    ".input-alpha-only, #signup-firstname, #signup-lastname, #contact-name"
  );
  alphaInputs.forEach((input) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^A-Za-z\s]/g, "");
    });
  });

  const phoneInputs = document.querySelectorAll(
    ".input-phone-10, #signup-phone, #contact-phone"
  );
  phoneInputs.forEach((input) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 10);
    });
  });
}

/**
 * Password Visibility Toggle
 */
function initPasswordToggles() {
  const toggleButtons = document.querySelectorAll(".password-toggle-btn");
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.closest(".password-input-group").querySelector("input");
      if (input.type === "password") {
        input.type = "text";
        btn.innerHTML = "👁️";
        btn.setAttribute("aria-label", "Hide password");
      } else {
        input.type = "password";
        btn.innerHTML = "🔒";
        btn.setAttribute("aria-label", "Show password");
      }
    });
  });
}

/**
 * Handle Sign In:
 * Allows login with ANY valid email address and compliant password (8+ chars, uppercase, number, symbol),
 * irrespective of whether it was previously registered!
 */
function initSignInForm() {
  const signInForm = document.getElementById("signin-form");
  if (!signInForm) return;

  const emailInput = document.getElementById("signin-email");
  const passwordInput = document.getElementById("signin-password");
  const roleInput = document.getElementById("signin-role");
  const alertBox = document.getElementById("signin-alert");

  // Real-time error clearing on input
  [emailInput, passwordInput, roleInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => clearFieldError(input));
    input.addEventListener("change", () => clearFieldError(input));
  });

  signInForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    const role = roleInput ? roleInput.value : "";

    let firstInvalid = null;

    [emailInput, passwordInput, roleInput].forEach((el) => clearFieldError(el));
    if (alertBox) alertBox.style.display = "none";

    // Role check
    if (!role) {
      setFieldError(
        roleInput,
        "Please select your portal role (Patient, Doctor, or Admin)."
      );
      if (!firstInvalid) firstInvalid = roleInput;
    }

    // Email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setFieldError(
        emailInput,
        "Please provide a valid email address (e.g. name@example.com)."
      );
      if (!firstInvalid) firstInvalid = emailInput;
    }

    // Password check with required complexity
    if (!password || !isValidPassword(password)) {
      setFieldError(
        passwordInput,
        "Password must have at least 8 characters including 1 uppercase, 1 number & 1 special character."
      );
      if (!firstInvalid) firstInvalid = passwordInput;
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // Check if user is registered in localStorage; if not, dynamically synthesize account
    const users = getUsers();
    let foundUser = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.role.toLowerCase() === role.toLowerCase()
    );

    // If not found in registered accounts, create dynamic session from email prefix
    if (!foundUser) {
      const emailParts = email.split("@")[0].split(/[._-]/);
      const cap = (s) =>
        s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
      const fName = cap(emailParts[0]) || "Member";
      const lName =
        cap(emailParts[1]) || (role === "Doctor" ? "Clinician" : "User");

      foundUser = {
        id: "usr_" + Date.now(),
        firstName: fName,
        lastName: lName,
        email: email,
        password: password,
        role: role,
        phone: "9876543210",
      };

      // Also persist to users array for future reference
      users.push(foundUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    // Store active session
    const sessionUser = {
      id: foundUser.id,
      firstName: foundUser.firstName,
      lastName: foundUser.lastName,
      email: foundUser.email,
      role: foundUser.role,
      phone: foundUser.phone || "",
      loginTimestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      lastLogin: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };

    localStorage.setItem(
      STORAGE_KEYS.CURRENT_USER,
      JSON.stringify(sessionUser)
    );
    localStorage.setItem(STORAGE_KEYS.ROLE, sessionUser.role);

    // Redirect to role-specific dashboard
    window.location.href = "dashboard.html";
  });
}

/**
 * Handle Sign Up
 */
function initSignUpForm() {
  const signUpForm = document.getElementById("signup-form");
  if (!signUpForm) return;

  const firstNameInput = document.getElementById("signup-firstname");
  const lastNameInput = document.getElementById("signup-lastname");
  const emailInput = document.getElementById("signup-email");
  const phoneInput = document.getElementById("signup-phone");
  const roleInput = document.getElementById("signup-role");
  const passwordInput = document.getElementById("signup-password");
  const confirmPasswordInput = document.getElementById(
    "signup-confirmpassword"
  );
  const termsCheckbox = document.getElementById("signup-terms");
  const alertBox = document.getElementById("signup-alert");
  const strengthMeter = document.getElementById("signup-strength-meter");
  const strengthText = document.getElementById("signup-strength-text");

  // Real-time strength meter
  if (passwordInput && strengthMeter && strengthText) {
    passwordInput.addEventListener("input", () => {
      const evaluation = evaluatePasswordStrength(passwordInput.value);
      strengthMeter.style.width = evaluation.percent + "%";
      strengthMeter.style.backgroundColor = evaluation.color;
      strengthText.textContent = evaluation.text;
      strengthText.style.color = evaluation.color;
    });
  }

  // Real-time clearing of error states on input/change
  [
    firstNameInput,
    lastNameInput,
    emailInput,
    phoneInput,
    roleInput,
    passwordInput,
    confirmPasswordInput,
    termsCheckbox,
  ].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => clearFieldError(input));
    input.addEventListener("change", () => clearFieldError(input));
  });

  signUpForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Reset validations
    [
      firstNameInput,
      lastNameInput,
      emailInput,
      phoneInput,
      roleInput,
      passwordInput,
      confirmPasswordInput,
      termsCheckbox,
    ].forEach((el) => clearFieldError(el));
    if (alertBox) alertBox.style.display = "none";

    let firstInvalid = null;

    // Role
    if (!roleInput.value) {
      setFieldError(roleInput, "Please choose your portal role.");
      if (!firstInvalid) firstInvalid = roleInput;
    }

    // First Name: only alphabets
    if (!firstNameInput.value.trim() || !isValidName(firstNameInput.value)) {
      setFieldError(
        firstNameInput,
        "First name must contain alphabets only (min. 2 characters)."
      );
      if (!firstInvalid) firstInvalid = firstNameInput;
    }

    // Last Name: only alphabets
    if (!lastNameInput.value.trim() || !isValidName(lastNameInput.value)) {
      setFieldError(
        lastNameInput,
        "Last name must contain alphabets only (min. 2 characters)."
      );
      if (!firstInvalid) firstInvalid = lastNameInput;
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
      setFieldError(
        emailInput,
        "Please provide a valid email address (e.g. sarah.jenkins@example.com)."
      );
      if (!firstInvalid) firstInvalid = emailInput;
    }

    // Mobile: exactly 10 digits
    if (!isValidPhone(phoneInput.value)) {
      setFieldError(phoneInput, "Mobile number must be exactly 10 digits.");
      if (!firstInvalid) firstInvalid = phoneInput;
    }

    // Password validation: 8+ chars, 1 uppercase, 1 number, 1 special char
    if (!isValidPassword(passwordInput.value)) {
      setFieldError(
        passwordInput,
        "Password must have at least 8 characters including 1 uppercase, 1 number & 1 special character."
      );
      if (!firstInvalid) firstInvalid = passwordInput;
    }

    // Confirm password match
    if (
      confirmPasswordInput.value !== passwordInput.value ||
      !confirmPasswordInput.value
    ) {
      setFieldError(
        confirmPasswordInput,
        "Passwords do not match. Please re-enter your password."
      );
      if (!firstInvalid) firstInvalid = confirmPasswordInput;
    }

    // Terms checkbox
    if (!termsCheckbox.checked) {
      setFieldError(
        termsCheckbox,
        "You must accept the Terms of Use and Privacy Policy to register."
      );
      if (!firstInvalid) firstInvalid = termsCheckbox;
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // Uniqueness check
    const users = getUsers();
    const existing = users.find(
      (u) => u.email.toLowerCase() === emailInput.value.trim().toLowerCase()
    );
    if (existing) {
      if (alertBox) {
        alertBox.textContent =
          "An account with this email address already exists. Please Sign In.";
        alertBox.style.display = "block";
      }
      emailInput.classList.add("is-invalid");
      emailInput.focus();
      return;
    }

    // Save new user (No residential address)
    const newUser = {
      id: "usr_" + Date.now(),
      firstName: firstNameInput.value.trim(),
      lastName: lastNameInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value,
      role: roleInput.value,
      phone: phoneInput.value.replace(/\D/g, "").slice(0, 10),
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    if (successBox) {
      successBox.textContent = `Account created successfully for ${newUser.firstName} as ${newUser.role}! Redirecting to Sign In...`;
      successBox.style.display = "block";
    }

    setTimeout(() => {
      window.location.href = "sign-in.html";
    }, 1500);
  });
}
