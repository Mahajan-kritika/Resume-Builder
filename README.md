# Resume Builder

A free, privacy-first resume maker for students, fresh graduates, and job seekers. Build a polished resume in your browser, preview it on an A4 page, save a local JSON backup, and print or save a selectable-text PDF. Resume details are never sent to a server.

## Features

- Live A4 resume preview with Modern Professional, Creative Modern, and Classic ATS-friendly templates.
- Personal information, a guided professional summary, skills, and repeatable education, project, experience, certification, and achievement entries.
- Drag-and-drop section ordering, adjustable preview zoom, and page navigation for longer resumes.
- Browser print dialog export (choose “Save as PDF”); long resumes flow onto additional pages.
- Download and restore complete JSON backups, including template and section order.
- Automatic browser LocalStorage persistence, sample resume for first-time use, blank-resume option, and confirmed clear action.
- Responsive interface and a service worker that caches the app for offline use after the first successful load.
- No dependencies, third-party APIs, external fonts, analytics, or network requests containing resume details.

## Technologies

HTML5, CSS3, vanilla JavaScript, browser LocalStorage, JSON files, the browser Print API, and a service worker.

## Setup

Serve this folder over HTTP or HTTPS. For example, with Python installed:

```sh
python -m http.server 8000
```

Open `http://localhost:8000` in a modern browser. No package installation or build step is needed. The service worker requires HTTP/HTTPS (localhost is supported); once loaded successfully, the application shell is cached for offline use. A browser may require a reload after the first visit before offline mode is available.

## Usage

1. Edit the sample resume or choose **Start blank**.
2. Expand editor sections to add, update, or remove information. Drag the section chips to reorder the preview and exported resume.
3. Switch templates or choose a preview zoom level.
4. Choose **Export PDF**, then select **Save as PDF** in the browser print dialog. For A4 output, use the A4 paper size and enable background graphics if desired.
5. Use **Save JSON** to download a backup or **Load JSON** to restore one. Browser auto-save is local to the current browser profile.

## Privacy and limitations

The app has no backend and does not transmit resume information. LocalStorage is temporary browser storage: clearing site data or changing browsers can remove it, so download a JSON backup for safekeeping. Service-worker offline caching is available when served over HTTP/HTTPS, not when opening the HTML file directly. Browser print layout can vary slightly; review the print preview before saving a PDF.
