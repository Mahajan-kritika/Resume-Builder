(() => {
  "use strict";

  const STORAGE_KEY = "resume-builder-data-v1";
  const SECTIONS = [
    { key: "summary", label: "Professional summary", icon: "✦" },
    { key: "experience", label: "Experience", icon: "▣" },
    { key: "education", label: "Education", icon: "▤" },
    { key: "projects", label: "Projects", icon: "⌘" },
    { key: "skills", label: "Skills", icon: "◈" },
    { key: "certifications", label: "Certifications", icon: "◇" },
    { key: "achievements", label: "Achievements & activities", icon: "✧" }
  ];
  const TEMPLATES = ["modern", "creative", "classic"];
  const DEFAULT_RESUME = {
    profile: {
      fullName: "Alex Morgan",
      email: "alex.morgan@email.com",
      phone: "+1 (555) 014-2086",
      location: "Austin, TX",
      linkedin: "linkedin.com/in/alexmorgan",
      github: "github.com/alexmorgan",
      portfolio: "alexmorgan.dev",
      headline: "Software Engineer"
    },
    summary: "Curious software engineer who enjoys turning complex problems into simple, thoughtful products. Experienced in building accessible web applications and collaborating across product and design teams.",
    education: [{ institution: "University of Texas at Austin", degree: "B.S. Computer Science", field: "Computer Science", startYear: "2020", endYear: "2024", grade: "3.8 / 4.0" }],
    skills: { technical: "JavaScript, TypeScript, HTML, CSS, REST APIs", languages: "JavaScript, Python, Java", tools: "React, Node.js, Git, Figma", soft: "Communication, collaboration, problem solving" },
    projects: [{ title: "FocusFlow", description: "Built a lightweight productivity app that helps students plan focused study sessions. Improved task completion through a simple, accessible interface.", technologies: "React, TypeScript, CSS", link: "github.com/alexmorgan/focusflow" }],
    experience: [{ company: "Northstar Labs", role: "Software Engineering Intern", duration: "Jun 2023 – Aug 2023", responsibilities: "Shipped three customer-facing dashboard features with the product team.\nReduced initial page load time by 28% by improving component rendering." }],
    certifications: [{ name: "AWS Certified Cloud Practitioner", organization: "Amazon Web Services", date: "2024", link: "" }],
    achievements: [{ title: "HackUTD Finalist", organization: "University of Texas at Dallas", date: "2023", description: "Led a 4-person team to build an accessible campus navigation prototype." }],
    template: "modern",
    sectionOrder: SECTIONS.map(section => section.key)
  };

  const fields = {
    profile: [
      { key: "fullName", label: "Full name", placeholder: "e.g. Alex Morgan", required: true },
      { key: "headline", label: "Professional title", placeholder: "e.g. Software Engineer" },
      { key: "email", label: "Email address", type: "email", placeholder: "you@example.com" },
      { key: "phone", label: "Phone number", type: "tel", placeholder: "+1 (555) 000-0000" },
      { key: "location", label: "Location", placeholder: "City, Country" },
      { key: "linkedin", label: "LinkedIn profile", type: "url", placeholder: "linkedin.com/in/you" },
      { key: "github", label: "GitHub profile", type: "url", placeholder: "github.com/you" },
      { key: "portfolio", label: "Portfolio website", type: "url", placeholder: "yourwebsite.com" }
    ],
    education: [
      { key: "institution", label: "Institution name", placeholder: "University or school", required: true },
      { key: "degree", label: "Degree / course", placeholder: "B.S. Computer Science" },
      { key: "field", label: "Field of study", placeholder: "Computer Science" },
      { key: "startYear", label: "Start year", placeholder: "2020" },
      { key: "endYear", label: "Graduation year", placeholder: "2024" },
      { key: "grade", label: "CGPA / percentage", placeholder: "3.8 / 4.0" }
    ],
    projects: [
      { key: "title", label: "Project title", placeholder: "Project name", required: true },
      { key: "description", label: "Project description", placeholder: "What did you build? Include impact where possible.", type: "textarea", full: true },
      { key: "technologies", label: "Technologies used", placeholder: "React, Node.js, PostgreSQL", full: true },
      { key: "link", label: "Project link", placeholder: "github.com/you/project", type: "url", full: true }
    ],
    experience: [
      { key: "company", label: "Company / organization", placeholder: "Company name", required: true },
      { key: "role", label: "Job title / role", placeholder: "Software Engineer" },
      { key: "duration", label: "Duration", placeholder: "Jun 2023 – Aug 2024", full: true },
      { key: "responsibilities", label: "Responsibilities & achievements", placeholder: "Use one achievement per line; start with action verbs.", type: "textarea", full: true }
    ],
    certifications: [
      { key: "name", label: "Certification name", placeholder: "Certification title", required: true },
      { key: "organization", label: "Issuing organization", placeholder: "Organization" },
      { key: "date", label: "Completion date", placeholder: "Month YYYY" },
      { key: "link", label: "Credential link", placeholder: "credential.example.com", type: "url", full: true }
    ],
    achievements: [
      { key: "title", label: "Award / activity", placeholder: "Award, leadership role, volunteer work", required: true },
      { key: "organization", label: "Organization", placeholder: "Organization or group" },
      { key: "date", label: "Date", placeholder: "2024" },
      { key: "description", label: "Details", placeholder: "What you contributed or accomplished", type: "textarea", full: true }
    ]
  };
  const repeatable = ["education", "projects", "experience", "certifications", "achievements"];
  const editor = document.querySelector("#editor");
  const preview = document.querySelector("#resume-preview");
  const previewScroll = document.querySelector("#preview-scroll");
  const previewStage = document.querySelector("#preview-stage");
  const templateSelect = document.querySelector("#template-select");
  const zoomSelect = document.querySelector("#zoom-select");
  const loadInput = document.querySelector("#load-input");
  const toast = document.querySelector("#toast");
  let storageLoadError = "";
  let state = loadStoredState() || structuredClone(DEFAULT_RESUME);
  let activePage = 0;
  let toastTimer;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function isObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
  function isNonEmpty(value) { return typeof value === "string" && value.trim().length > 0; }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }
  function safeLink(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      const url = new URL(href);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch { return ""; }
  }
  function loadStoredState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      return normalizeResume(JSON.parse(stored));
    } catch (error) {
      storageLoadError = `Could not read the saved resume: ${error.message}. Your saved data has not been overwritten.`;
      return null;
    }
  }
  function normalizeResume(input) {
    if (!isObject(input) || !isObject(input.profile) || typeof input.summary !== "string") {
      throw new Error("This file is not a valid Resume Builder backup.");
    }
    const normalized = clone(DEFAULT_RESUME);
    for (const field of fields.profile) {
      if (typeof input.profile[field.key] === "string") normalized.profile[field.key] = input.profile[field.key].slice(0, 250);
    }
    normalized.summary = input.summary.slice(0, 1200);
    for (const key of repeatable) {
      if (!Array.isArray(input[key])) throw new Error(`The ${key} section is missing or invalid.`);
      normalized[key] = input[key].slice(0, 100).map(entry => {
        if (!isObject(entry)) throw new Error(`An entry in ${key} is invalid.`);
        const result = {};
        for (const field of fields[key]) result[field.key] = typeof entry[field.key] === "string" ? entry[field.key].slice(0, 5000) : "";
        return result;
      });
    }
    if (!isObject(input.skills)) throw new Error("The skills section is missing or invalid.");
    for (const key of Object.keys(normalized.skills)) normalized.skills[key] = typeof input.skills[key] === "string" ? input.skills[key].slice(0, 2000) : "";
    normalized.template = TEMPLATES.includes(input.template) ? input.template : "modern";
    if (Array.isArray(input.sectionOrder)) {
      const order = input.sectionOrder.filter(key => SECTIONS.some(section => section.key === key));
      normalized.sectionOrder = [...new Set(order), ...SECTIONS.map(section => section.key).filter(key => !order.includes(key))];
    }
    return normalized;
  }
  function showToast(message, error = false) {
    toast.textContent = message;
    toast.style.background = error ? "#8c3944" : "";
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 3000);
  }
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      document.querySelector("#save-status").textContent = `Saved on this device · ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } catch (error) {
      document.querySelector("#save-status").textContent = "Could not save to this device";
      showToast(`Local save failed: ${error.message}`, true);
    }
  }
  function fieldMarkup(field, value, path, extraClass = "") {
    const id = `field-${path.replace(/[.[\]]/g, "-")}`;
    const type = field.type === "email" || field.type === "tel" ? field.type : "text";
    const inputAttrs = `id="${id}" data-path="${path}" ${field.required ? "required" : ""} maxlength="${field.key === "summary" ? 1200 : 5000}"`;
    const content = field.type === "textarea"
      ? `<textarea class="${field.short ? "short" : ""}" ${inputAttrs} placeholder="${escapeHtml(field.placeholder || "")}">${escapeHtml(value || "")}</textarea>`
      : `<input type="${type}" ${inputAttrs} value="${escapeHtml(value || "")}" placeholder="${escapeHtml(field.placeholder || "")}">`;
    const hint = field.key === "summary" ? `<span class="field-hint">${String(value || "").length}/1,200 · Keep it concise</span>` : "";
    return `<label class="field ${field.full ? "full" : ""} ${extraClass}" for="${id}"><span class="field-label">${escapeHtml(field.label)}${hint}</span>${content}</label>`;
  }
  function renderSimpleSection(key, title, icon, fieldList, object, open = false) {
    return `<details class="form-section" ${open ? "open" : ""}><summary><span class="summary-label"><span class="summary-icon">${icon}</span>${title}</span></summary><div class="form-section-content"><div class="field-grid">${fieldList.map(field => fieldMarkup(field, object[field.key], `${key}.${field.key}`)).join("")}</div></div></details>`;
  }
  function renderRepeatableSection(key, title, icon) {
    const entries = state[key] || [];
    const cards = entries.map((entry, index) => `<div class="entry-card">
      <div class="entry-card-heading"><span>${escapeHtml(title.replace(/s$/, ""))} ${index + 1}</span><button type="button" class="remove-entry" data-remove="${key}" data-index="${index}" aria-label="Remove ${escapeHtml(title.replace(/s$/, ""))} ${index + 1}">Remove</button></div>
      <div class="field-grid">${fields[key].map(field => fieldMarkup(field, entry[field.key], `${key}.${index}.${field.key}`)).join("")}</div>
    </div>`).join("");
    return `<details class="form-section" ${key === "education" ? "open" : ""}><summary><span class="summary-label"><span class="summary-icon">${icon}</span>${title}</span><span class="entry-count">${entries.length} ${entries.length === 1 ? "entry" : "entries"}</span></summary><div class="form-section-content">${cards}<button class="add-entry" type="button" data-add="${key}">+ Add ${title.replace(/s$/, "")}</button></div></details>`;
  }
  function renderEditor() {
    editor.innerHTML = `
      ${renderSimpleSection("profile", "Personal information", "◎", fields.profile, state.profile, true)}
      <details class="form-section" open><summary><span class="summary-label"><span class="summary-icon">✦</span>Professional summary</span></summary><div class="form-section-content"><div class="field-grid">${fieldMarkup({ key: "summary", label: "Summary", placeholder: "A brief introduction, career objective or professional description.", type: "textarea", full: true }, state.summary, "summary")}</div></div></details>
      <div class="section-order"><div class="order-heading"><span>Resume section order</span><span class="order-help">Drag to reorder</span></div><div class="order-list" id="order-list">${state.sectionOrder.map(key => { const section = SECTIONS.find(item => item.key === key); return `<div class="order-item" draggable="true" data-section="${key}" title="Drag to reorder ${escapeHtml(section.label)}">${escapeHtml(section.label)}</div>`; }).join("")}</div></div>
      ${renderRepeatableSection("education", "Education", "▤")}
      ${renderSimpleSection("skills", "Skills", "◈", [
        { key: "technical", label: "Technical skills", placeholder: "Add skills separated by commas", type: "textarea", full: true },
        { key: "languages", label: "Programming languages", placeholder: "JavaScript, Python", type: "textarea", full: true, short: true },
        { key: "tools", label: "Tools & technologies", placeholder: "Git, React, Figma", type: "textarea", full: true, short: true },
        { key: "soft", label: "Soft skills", placeholder: "Communication, leadership", type: "textarea", full: true, short: true }
      ], state.skills)}
      ${renderRepeatableSection("projects", "Projects", "⌘")}
      ${renderRepeatableSection("experience", "Experience", "▣")}
      ${renderRepeatableSection("certifications", "Certifications", "◇")}
      ${renderRepeatableSection("achievements", "Achievements & activities", "✧")}`;
  }
  function dateRange(entry, startKey, endKey) {
    return [entry[startKey], entry[endKey]].filter(isNonEmpty).join(" – ");
  }
  function itemMarkup(title, subtitle, date, description, link, extra = "") {
    if (![title, subtitle, date, description, link].some(isNonEmpty)) return "";
    const linkUrl = safeLink(link);
    return `<div class="resume-item ${extra}"><div class="resume-item-heading">${isNonEmpty(title) ? `<h3 class="resume-item-title">${escapeHtml(title)}</h3>` : "<span></span>"}${isNonEmpty(date) ? `<span class="resume-item-date">${escapeHtml(date)}</span>` : ""}</div>${isNonEmpty(subtitle) ? `<p class="resume-item-subtitle">${escapeHtml(subtitle)}</p>` : ""}${isNonEmpty(description) ? `<p class="resume-item-copy">${escapeHtml(description)}</p>` : ""}${linkUrl ? `<a class="resume-item-link" href="${escapeHtml(linkUrl)}">${escapeHtml(link)}</a>` : ""}</div>`;
  }
  function renderSection(key) {
    let content = "";
    let title = SECTIONS.find(section => section.key === key)?.label || "";
    switch (key) {
      case "summary":
        content = isNonEmpty(state.summary) ? `<p class="resume-item-copy">${escapeHtml(state.summary)}</p>` : "";
        break;
      case "education":
        content = state.education.map(entry => itemMarkup(entry.degree || entry.field || entry.institution, entry.institution, dateRange(entry, "startYear", "endYear"), entry.grade, "")).join("");
        break;
      case "experience":
        content = state.experience.map(entry => itemMarkup(entry.role || entry.company, entry.role && entry.company ? entry.company : "", entry.duration, entry.responsibilities, "")).join("");
        break;
      case "projects":
        content = state.projects.map(entry => itemMarkup(entry.title, entry.technologies, "", entry.description, entry.link, "project-item")).join("");
        break;
      case "certifications":
        content = state.certifications.map(entry => itemMarkup(entry.name, entry.organization, entry.date, "", entry.link)).join("");
        break;
      case "achievements":
        content = state.achievements.map(entry => itemMarkup(entry.title, entry.organization, entry.date, entry.description, "")).join("");
        break;
      case "skills": {
        const labels = { technical: "Technical skills", languages: "Languages", tools: "Tools & technologies", soft: "Soft skills" };
        content = Object.entries(labels).filter(([field]) => isNonEmpty(state.skills[field])).map(([field, label]) => `<p class="skill-line"><strong>${label}:</strong> ${escapeHtml(state.skills[field].split(/[,;\n]/).map(value => value.trim()).filter(Boolean).join(" · "))}</p>`).join("");
        break;
      }
    }
    return content ? `<section class="resume-section"><h2 class="resume-section-title">${escapeHtml(title)}</h2>${content}</section>` : "";
  }
  function contactMarkup() {
    const links = [
      ["email", state.profile.email, value => `mailto:${value}`],
      ["phone", state.profile.phone, value => `tel:${value.replace(/[^\d+]/g, "")}`],
      ["location", state.profile.location, value => ""],
      ["linkedin", state.profile.linkedin, safeLink],
      ["github", state.profile.github, safeLink],
      ["portfolio", state.profile.portfolio, safeLink]
    ];
    return links.filter(([, value]) => isNonEmpty(value)).map(([key, value, makeHref]) => {
      const href = makeHref(value);
      const text = escapeHtml(value);
      return href ? `<a href="${escapeHtml(href)}">${text}</a>` : `<span>${text}</span>`;
    }).join("<span aria-hidden=\"true\">·</span>");
  }
  function renderPreview() {
    const name = isNonEmpty(state.profile.fullName) ? state.profile.fullName : "Your name";
    const hasContent = [state.summary, ...Object.values(state.profile), ...repeatable.flatMap(key => state[key].flatMap(Object.values)), ...Object.values(state.skills)].some(isNonEmpty);
    if (!hasContent) {
      preview.innerHTML = `<div class="empty-preview"><strong>Your resume starts here</strong><p>Add your details in the editor and watch your professional resume take shape.</p></div>`;
    } else {
      const sections = state.sectionOrder.map(renderSection).join("");
      const header = `<header class="resume-header"><h1 class="resume-name">${escapeHtml(name)}</h1>${isNonEmpty(state.profile.headline) ? `<p class="resume-headline">${escapeHtml(state.profile.headline)}</p>` : ""}<div class="contact-line">${contactMarkup()}</div></header>`;
      preview.innerHTML = state.template === "creative" ? `${header}<div class="resume-content">${sections}</div>` : `${header}<div class="resume-content">${sections}</div>`;
    }
    preview.className = `resume-sheet template-${TEMPLATES.includes(state.template) ? state.template : "modern"}`;
    templateSelect.value = state.template;
    updatePages();
  }
  function updatePages() {
    const zoom = Number(zoomSelect.value) || .8;
    preview.style.setProperty("--zoom", zoom);
    previewStage.style.setProperty("--zoom", zoom);
    previewStage.style.width = `${210 * zoom}mm`;
    requestAnimationFrame(() => {
      const pageHeight = 1122.52 * zoom;
      const pages = Math.max(1, Math.ceil((preview.offsetHeight * zoom) / pageHeight));
      activePage = Math.min(activePage, pages - 1);
      document.querySelector("#page-indicator").textContent = `Page ${activePage + 1} of ${pages}`;
      document.querySelector('[data-action="previous-page"]').disabled = activePage === 0;
      document.querySelector('[data-action="next-page"]').disabled = activePage >= pages - 1;
      previewStage.style.height = `${Math.max(297 * zoom, preview.offsetHeight * zoom)}px`;
    });
  }
  function setField(path, value) {
    const parts = path.split(".");
    let target = state;
    for (let index = 0; index < parts.length - 1; index++) target = target[parts[index]];
    target[parts[parts.length - 1]] = value;
  }
  function reorder(from, to) {
    const fromIndex = state.sectionOrder.indexOf(from);
    const toIndex = state.sectionOrder.indexOf(to);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
    const [item] = state.sectionOrder.splice(fromIndex, 1);
    state.sectionOrder.splice(toIndex, 0, item);
    persist();
    renderEditor();
    renderPreview();
  }
  function saveJson() {
    const file = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(state.profile.fullName || "resume").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "resume"}-resume.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast("Resume backup downloaded as JSON.");
  }
  async function loadJson(file) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      state = normalizeResume(parsed);
      persist();
      activePage = 0;
      renderEditor();
      renderPreview();
      showToast("Resume restored successfully.");
    } catch (error) {
      showToast(`Could not load resume: ${error.message || "Invalid JSON file."}`, true);
    } finally {
      loadInput.value = "";
    }
  }
  function clearResume(blank = false) {
    state = clone(DEFAULT_RESUME);
    if (blank) {
      state.profile = Object.fromEntries(fields.profile.map(field => [field.key, ""]));
      state.summary = "";
      state.education = [];
      state.skills = { technical: "", languages: "", tools: "", soft: "" };
      state.projects = [];
      state.experience = [];
      state.certifications = [];
      state.achievements = [];
    }
    activePage = 0;
    persist();
    renderEditor();
    renderPreview();
  }

  editor.addEventListener("input", event => {
    const control = event.target.closest("[data-path]");
    if (!control) return;
    setField(control.dataset.path, control.value);
    if (control.type === "email" && control.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(control.value)) {
      control.classList.add("invalid");
      control.setAttribute("aria-invalid", "true");
    } else {
      control.classList.remove("invalid");
      control.removeAttribute("aria-invalid");
    }
    if (control.dataset.path === "summary") {
      const hint = control.closest(".field").querySelector(".field-hint");
      if (hint) hint.textContent = `${control.value.length}/1,200 · Keep it concise`;
    }
    persist();
    renderPreview();
  });
  editor.addEventListener("click", event => {
    const remove = event.target.closest("[data-remove]");
    const add = event.target.closest("[data-add]");
    if (remove) {
      const key = remove.dataset.remove;
      state[key].splice(Number(remove.dataset.index), 1);
      renderEditor();
      persist();
      renderPreview();
    } else if (add) {
      const key = add.dataset.add;
      state[key].push(Object.fromEntries(fields[key].map(field => [field.key, ""])));
      renderEditor();
      persist();
      renderPreview();
      const details = [...editor.querySelectorAll(".form-section")].find(element => element.querySelector(`[data-add="${key}"]`));
      if (details) details.open = true;
      const added = editor.querySelectorAll(`[data-path^="${key}.${state[key].length - 1}."]`);
      if (added.length) added[0].focus();
    }
  });
  let draggedSection = "";
  editor.addEventListener("dragstart", event => {
    const item = event.target.closest(".order-item");
    if (!item) return;
    draggedSection = item.dataset.section;
    item.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggedSection);
  });
  editor.addEventListener("dragend", event => {
    event.target.closest(".order-item")?.classList.remove("dragging");
    editor.querySelectorAll(".drag-over").forEach(element => element.classList.remove("drag-over"));
  });
  editor.addEventListener("dragover", event => {
    const item = event.target.closest(".order-item");
    if (!item) return;
    event.preventDefault();
    item.classList.add("drag-over");
  });
  editor.addEventListener("dragleave", event => event.target.closest(".order-item")?.classList.remove("drag-over"));
  editor.addEventListener("drop", event => {
    const item = event.target.closest(".order-item");
    if (!item) return;
    event.preventDefault();
    item.classList.remove("drag-over");
    reorder(draggedSection || event.dataTransfer.getData("text/plain"), item.dataset.section);
    draggedSection = "";
  });
  templateSelect.addEventListener("change", () => {
    state.template = TEMPLATES.includes(templateSelect.value) ? templateSelect.value : "modern";
    persist();
    renderPreview();
  });
  zoomSelect.addEventListener("change", updatePages);
  previewScroll.addEventListener("scroll", () => {
    const zoom = Number(zoomSelect.value) || .8;
    activePage = Math.floor(previewScroll.scrollTop / (1122.52 * zoom));
    updatePages();
  });
  document.addEventListener("click", event => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    switch (action) {
      case "print":
        {
          const invalid = editor.querySelector(":invalid");
          if (invalid) {
            invalid.setAttribute("aria-invalid", "true");
            invalid.reportValidity();
            invalid.focus();
            showToast("Please complete required fields and correct invalid values before exporting.", true);
            break;
          }
        }
        window.print();
        break;
      case "save": saveJson(); break;
      case "load": loadInput.click(); break;
      case "clear":
        if (window.confirm("Clear all resume information and start with a blank resume? This cannot be undone unless you saved a JSON backup.")) {
          clearResume(true);
          showToast("Resume cleared. Your blank resume is ready.");
        }
        break;
      case "blank":
        if (window.confirm("Start with a blank resume? Your current resume will be replaced.")) {
          clearResume(true);
          showToast("Started with a blank resume.");
        }
        break;
      case "reset-template":
        state.template = "modern";
        persist();
        renderPreview();
        showToast("Template reset to Modern professional.");
        break;
      case "next-page": {
        const zoom = Number(zoomSelect.value) || .8;
        previewScroll.scrollTo({ top: (activePage + 1) * 1122.52 * zoom, behavior: "smooth" });
        break;
      }
      case "previous-page": {
        const zoom = Number(zoomSelect.value) || .8;
        previewScroll.scrollTo({ top: Math.max(0, activePage - 1) * 1122.52 * zoom, behavior: "smooth" });
        break;
      }
    }
  });
  loadInput.addEventListener("change", () => loadJson(loadInput.files?.[0]));
  window.addEventListener("resize", updatePages);

  renderEditor();
  renderPreview();
  if (storageLoadError) showToast(storageLoadError, true);
  else persist();
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(error => {
      console.warn("Offline caching is unavailable:", error);
    }));
  }
})();
