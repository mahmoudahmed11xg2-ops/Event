/**
 * Main Vanilla JavaScript Application Controller
 * Connects all modules: Auth, Events, Guests, Scanner, Excel Import, Badges & Stats
 */

import { initFirebase, localDB } from './firebase-config.js';
import { getLanguage, setLanguage, applyLanguageToDOM, t } from './services/i18n.js';
import { getSessionUser, loginUser, logoutUser, createEmployeeAccount, toggleUserStatus } from './services/auth.js';
import { getAllEvents, getActiveEvent, getActiveEventId, setActiveEventId, createEvent, updateEvent } from './services/events.js';
import { getGuestsForEvent, getGuestById, addGuest, cancelInvitation, reissueInvitation, exportGuestsCsv } from './services/guests.js';
import { calculateEventStats, getRecentCheckins, getCheckinHistory, exportHistoryCsv } from './services/stats.js';
import { renderInvitationBadgeCanvas, downloadCanvasAsPng, exportAllInvitationsPdf } from './services/qr.js';
import { parseSpreadsheetFile, validateImportBatch, executeBatchImport, downloadErrorReport } from './services/excel.js';
import { startCameraScanner, stopCameraScanner, handleTokenVerification, resetScannerDebounce, isCameraActive } from './services/checkin.js';

// Application State
let currentPanel = 'panel-dashboard';
let parsedImportBatches = null;
let currentPreviewGuest = null;
let employeeTodayScanCount = 0;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initFirebase();
  applyLanguageToDOM();
  setupEventListeners();
  checkInitialSession();
  setupRealtimeListeners();
});

function setupEventListeners() {
  // Language toggle
  const langToggleBtn = document.getElementById('lang-toggle-btn');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      const next = getLanguage() === 'en' ? 'ar' : 'en';
      setLanguage(next);
      renderCurrentPanel();
    });
  }

  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;
      const remember = document.getElementById('login-remember').checked;
      const alertEl = document.getElementById('login-error-alert');
      const submitBtn = document.getElementById('login-submit-btn');

      alertEl.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = t('signingIn');

      try {
        const user = await loginUser(email, pass, remember);
        updateAuthUI(user);
      } catch (err) {
        alertEl.textContent = err.message || 'Login failed';
        alertEl.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = t('signInBtn');
      }
    });
  }

  // Password visibility toggle
  const togglePassBtn = document.getElementById('toggle-password-btn');
  if (togglePassBtn) {
    togglePassBtn.addEventListener('click', () => {
      const passInput = document.getElementById('login-password');
      if (passInput.type === 'password') {
        passInput.type = 'text';
        togglePassBtn.textContent = t('hidePassword');
      } else {
        passInput.type = 'password';
        togglePassBtn.textContent = t('showPassword');
      }
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      stopCameraScanner();
      logoutUser();
      updateAuthUI(null);
    });
  }

  // Navigation items
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetPanel = btn.getAttribute('data-panel');
      switchPanel(targetPanel);
    });
  });

  // Active Event Switcher in Header
  const activeEventSelect = document.getElementById('active-event-select');
  if (activeEventSelect) {
    activeEventSelect.addEventListener('change', (e) => {
      setActiveEventId(e.target.value);
      renderCurrentPanel();
    });
  }

  // Quick Action Buttons on Dashboard
  const quickAddGuestBtn = document.getElementById('dash-quick-add-guest');
  if (quickAddGuestBtn) {
    quickAddGuestBtn.addEventListener('click', () => openAddGuestModal());
  }
  const quickScanBtn = document.getElementById('dash-quick-scan');
  if (quickScanBtn) {
    quickScanBtn.addEventListener('click', () => switchPanel('panel-terminal'));
  }

  // Guest Search & Status Filter
  const guestSearch = document.getElementById('guest-search-input');
  const guestFilter = document.getElementById('guest-status-filter');
  if (guestSearch) {
    guestSearch.addEventListener('input', () => renderGuestsTable());
  }
  if (guestFilter) {
    guestFilter.addEventListener('change', () => renderGuestsTable());
  }

  // Export CSV
  const exportGuestsCsvBtn = document.getElementById('btn-export-guests-csv');
  if (exportGuestsCsvBtn) {
    exportGuestsCsvBtn.addEventListener('click', () => {
      const activeEvent = getActiveEvent();
      if (activeEvent) exportGuestsCsv(activeEvent.id);
    });
  }

  const exportHistoryCsvBtn = document.getElementById('btn-export-history-csv');
  if (exportHistoryCsvBtn) {
    exportHistoryCsvBtn.addEventListener('click', () => {
      const activeEvent = getActiveEvent();
      exportHistoryCsv(activeEvent?.id);
    });
  }

  // History Search & Filter
  const historySearch = document.getElementById('history-search-input');
  const historyFilter = document.getElementById('history-result-filter');
  if (historySearch) historySearch.addEventListener('input', () => renderHistoryTable());
  if (historyFilter) historyFilter.addEventListener('change', () => renderHistoryTable());

  // Modals Open/Close triggers
  document.querySelectorAll('.close-modal-btn').forEach(b => {
    b.addEventListener('click', () => closeAllModals());
  });

  const btnOpenAddGuest = document.getElementById('btn-open-add-guest');
  if (btnOpenAddGuest) {
    btnOpenAddGuest.addEventListener('click', () => openAddGuestModal());
  }

  const btnOpenCreateEvent = document.getElementById('btn-open-create-event');
  if (btnOpenCreateEvent) {
    btnOpenCreateEvent.addEventListener('click', () => openCreateEventModal());
  }

  const btnOpenCreateStaff = document.getElementById('btn-open-create-staff');
  if (btnOpenCreateStaff) {
    btnOpenCreateStaff.addEventListener('click', () => {
      document.getElementById('modal-staff').style.display = 'flex';
    });
  }

  // Add Guest Form Submit
  const formGuest = document.getElementById('form-guest');
  if (formGuest) {
    formGuest.addEventListener('submit', async (e) => {
      e.preventDefault();
      const activeEvent = getActiveEvent();
      if (!activeEvent) {
        alert('يرجى إنشاء فعالية واختيارها أولاً قبل إضافة الضيوف.');
        return;
      }

      const submitBtn = formGuest.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري الحفظ على السيرفر...';
      }

      const fullName = document.getElementById('guest-name').value;
      const company = document.getElementById('guest-company').value;
      const email = document.getElementById('guest-email').value;
      const phone = document.getElementById('guest-phone').value;
      const companionLimit = document.getElementById('guest-companions').value;
      const notes = document.getElementById('guest-notes').value;

      try {
        await addGuest({
          eventId: activeEvent.id,
          fullName,
          company,
          email,
          phone,
          companionLimit,
          notes
        });
        closeAllModals();
        formGuest.reset();
        renderGuestsTable();
        renderDashboardStats();
      } catch (err) {
        alert(err.message || 'حدث خطأ أثناء حفظ الضيف.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }

  // Create Event Form Submit
  const formEvent = document.getElementById('form-event');
  if (formEvent) {
    formEvent.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = formEvent.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري الحفظ على السيرفر...';
      }

      const name = document.getElementById('event-name').value;
      const venue = document.getElementById('event-venue').value;
      const startAt = document.getElementById('event-start').value;
      const endAt = document.getElementById('event-end').value;
      const timeZone = document.getElementById('event-timezone').value;
      const status = document.getElementById('event-status').value;
      const description = document.getElementById('event-desc').value;

      try {
        await createEvent({ name, venue, startAt, endAt, timeZone, status, description });
        closeAllModals();
        formEvent.reset();
        populateEventsDropdown();
        renderEventsTable();
        renderDashboardStats();
      } catch (err) {
        alert(err.message || 'حدث خطأ أثناء حفظ الفعالية.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }

  // Add Staff Form Submit
  const formStaff = document.getElementById('form-staff');
  if (formStaff) {
    const btnTogglePw = document.getElementById('btn-toggle-staff-pw');
    const inputPw = document.getElementById('staff-password');
    if (btnTogglePw && inputPw) {
      btnTogglePw.addEventListener('click', () => {
        if (inputPw.type === 'password') {
          inputPw.type = 'text';
          btnTogglePw.textContent = '🔒';
        } else {
          inputPw.type = 'password';
          btnTogglePw.textContent = '👁️';
        }
      });
    }

    formStaff.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btn-submit-staff') || formStaff.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : '';

      const name = document.getElementById('staff-name').value;
      const email = document.getElementById('staff-email').value;
      const password = document.getElementById('staff-password').value;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = t('creatingStaff') || 'جاري إنشاء الحساب في فايربيس...';
      }

      try {
        await createEmployeeAccount(name, email, password);
        closeAllModals();
        formStaff.reset();
        renderStaffTable();
        alert(t('staffCreatedSuccess') || 'تم إنشاء حساب الموظف وربطه في Firebase بنجاح!');
      } catch (err) {
        alert(err.message || 'حدث خطأ أثناء إنشاء حساب الموظف.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }

  // Excel Dropzone & Input
  setupExcelImportHandlers();

  // QR Badge preview & PDF
  setupBadgeHandlers();

  // Employee Scanner handlers
  setupScannerHandlers();
}

function checkInitialSession() {
  const user = getSessionUser();
  updateAuthUI(user);
}

function updateAuthUI(user) {
  const loginView = document.getElementById('view-login');
  const authView = document.getElementById('view-authenticated');
  const userBadge = document.getElementById('user-badge');
  const eventWrap = document.getElementById('header-event-selector-wrap');
  const sidebar = document.getElementById('app-sidebar');

  if (!user) {
    loginView.style.display = 'flex';
    authView.style.display = 'none';
    userBadge.style.display = 'none';
    eventWrap.style.display = 'none';
    return;
  }

  loginView.style.display = 'none';
  authView.style.display = 'flex';
  userBadge.style.display = 'flex';
  eventWrap.style.display = 'flex';

  document.getElementById('user-display-name').textContent = user.displayName;
  const roleTag = document.getElementById('user-role-tag');
  roleTag.textContent = user.role;
  roleTag.className = `role-tag ${user.role.toLowerCase()}`;

  // Role Protection
  if (user.role === 'EMPLOYEE') {
    // Hide all admin nav items
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    switchPanel('panel-terminal');
  } else {
    // Admin has access to all
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'flex');
    populateEventsDropdown();
    switchPanel('panel-dashboard');
  }
}

function switchPanel(panelId) {
  currentPanel = panelId;
  document.querySelectorAll('.content-panel').forEach(p => p.style.display = 'none');
  const target = document.getElementById(panelId);
  if (target) {
    target.style.display = 'block';
  }

  document.querySelectorAll('.nav-item').forEach(b => {
    if (b.getAttribute('data-panel') === panelId) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  // Stop camera if navigating away from terminal
  if (panelId !== 'panel-terminal') {
    stopCameraScanner();
  }

  renderCurrentPanel();
}

function renderCurrentPanel() {
  populateEventsDropdown();
  updateEventHeaderTitles();

  switch (currentPanel) {
    case 'panel-dashboard':
      renderDashboardStats();
      renderLiveCheckinTable();
      break;
    case 'panel-events':
      renderEventsTable();
      break;
    case 'panel-guests':
      renderGuestsTable();
      break;
    case 'panel-qr':
      renderQrPanel();
      break;
    case 'panel-history':
      renderHistoryTable();
      renderAuditTable();
      break;
    case 'panel-employees':
      renderStaffTable();
      break;
    case 'panel-terminal':
      renderTerminalHeader();
      break;
  }
}

function updateEventHeaderTitles() {
  const activeEvent = getActiveEvent();
  const title = activeEvent ? activeEvent.name : 'No Event Selected';
  const dashTitle = document.getElementById('dashboard-active-event-title');
  if (dashTitle) dashTitle.textContent = title;
  const termTitle = document.getElementById('terminal-event-name');
  if (termTitle) termTitle.textContent = title;
}

function populateEventsDropdown() {
  const select = document.getElementById('active-event-select');
  if (!select) return;
  const events = getAllEvents();
  const currentActiveId = getActiveEventId();

  if (events.length === 0) {
    select.innerHTML = `<option value="">${t('noActiveEventSelected')}</option>`;
    return;
  }

  select.innerHTML = events.map(e => `
    <option value="${e.id}" ${e.id === currentActiveId ? 'selected' : ''}>
      ${e.name} (${e.status})
    </option>
  `).join('');
}

// 1. DASHBOARD
function renderDashboardStats() {
  const activeEvent = getActiveEvent();
  if (!activeEvent) {
    document.getElementById('stat-total-guests').textContent = '0';
    document.getElementById('stat-valid-invitations').textContent = '0';
    document.getElementById('stat-checked-in').textContent = '0';
    document.getElementById('stat-yet-to-arrive').textContent = '0';
    document.getElementById('stat-cancelled').textContent = '0';
    document.getElementById('stat-attendance-rate').textContent = '0%';
    const bar = document.getElementById('stat-progress-bar');
    if (bar) bar.style.width = '0%';
    return;
  }

  const stats = calculateEventStats(activeEvent.id);
  document.getElementById('stat-total-guests').textContent = stats.totalGuests;
  document.getElementById('stat-valid-invitations').textContent = stats.validInvitations;
  document.getElementById('stat-checked-in').textContent = stats.checkedIn;
  document.getElementById('stat-yet-to-arrive').textContent = stats.yetToArrive;
  document.getElementById('stat-cancelled').textContent = stats.cancelled;
  document.getElementById('stat-attendance-rate').textContent = `${stats.attendanceRate}%`;

  const bar = document.getElementById('stat-progress-bar');
  if (bar) bar.style.width = `${stats.attendanceRate}%`;
}

function renderLiveCheckinTable() {
  const tbody = document.getElementById('live-checkin-table-body');
  if (!tbody) return;

  const activeEvent = getActiveEvent();
  const recent = getRecentCheckins(activeEvent?.id, 8);

  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-dim); padding:1.5rem;">${t('noRecentActivity')}</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(c => `
    <tr>
      <td>${new Date(c.timestamp).toLocaleTimeString()}</td>
      <td style="font-weight:600; color:#fff;">${c.guestName}</td>
      <td>${c.company || '—'}</td>
      <td><span class="token-code">${c.token}</span></td>
      <td>${c.employeeName || 'Staff'}</td>
      <td><span class="status-pill checked_in">${t('statusCheckedIn')}</span></td>
    </tr>
  `).join('');
}

// 2. EVENTS
function renderEventsTable() {
  const tbody = document.getElementById('events-table-body');
  if (!tbody) return;
  const events = getAllEvents();
  const activeId = getActiveEventId();

  if (events.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-dim); padding:1.5rem;">${t('noActiveEventSelected')}</td></tr>`;
    return;
  }

  tbody.innerHTML = events.map(e => {
    const statusKey = 'status' + (e.status || 'Active');
    const translatedStatus = t(statusKey) || e.status;
    return `
      <tr>
        <td style="font-weight:600; color:#fff;">
          ${e.name}
          ${e.id === activeId ? `<span class="status-pill valid" style="margin-inline-start:6px; font-size:0.65rem;">${t('currentBadge')}</span>` : ''}
        </td>
        <td>${e.venue}</td>
        <td style="font-size:0.8rem; color:var(--text-muted);">${e.startAt ? new Date(e.startAt).toLocaleString() : '—'}</td>
        <td style="font-size:0.8rem;">${e.timeZone}</td>
        <td><span class="status-pill ${e.status.toLowerCase()}">${translatedStatus}</span></td>
        <td>
          ${e.id !== activeId ? `<button class="btn btn-secondary btn-sm btn-activate-event" data-id="${e.id}">${t('setActiveBtn')}</button>` : `<span style="color:#10b981; font-size:0.8rem;">${t('currentBadge')}</span>`}
        </td>
      </tr>
    `;
  }).join('');

  document.querySelectorAll('.btn-activate-event').forEach(b => {
    b.addEventListener('click', () => {
      setActiveEventId(b.getAttribute('data-id'));
      renderEventsTable();
      renderDashboardStats();
    });
  });
}

// 3. GUESTS
function renderGuestsTable() {
  const tbody = document.getElementById('guests-table-body');
  if (!tbody) return;

  const activeEvent = getActiveEvent();
  if (!activeEvent) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:1.5rem;">${t('noActiveEventTerminal')}</td></tr>`;
    return;
  }

  const search = document.getElementById('guest-search-input')?.value || '';
  const status = document.getElementById('guest-status-filter')?.value || 'ALL';
  const guests = getGuestsForEvent(activeEvent.id, { search, status });

  if (guests.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-dim); padding:1.5rem;">${t('noGuestsMatch')}</td></tr>`;
    return;
  }

  tbody.innerHTML = guests.map(g => {
    const isCancelled = g.invitationStatus === 'CANCELLED' || g.invitationStatus === 'REVOKED';
    const isCheckedIn = g.invitationStatus === 'CHECKED_IN';
    const statusText = g.invitationStatus === 'VALID' ? t('statusValid') :
                       g.invitationStatus === 'CHECKED_IN' ? t('statusCheckedIn') :
                       g.invitationStatus === 'CANCELLED' ? t('statusCancelledInv') : t('statusRevoked');

    return `
      <tr>
        <td style="font-weight:600; color:#fff;">${g.fullName}</td>
        <td>${g.company}</td>
        <td style="font-size:0.8rem; color:var(--text-muted);">${g.email || '—'}</td>
        <td style="font-size:0.8rem;">${g.phone || '—'}</td>
        <td style="text-align:center;">${g.companionLimit || 0}</td>
        <td><span class="status-pill ${g.invitationStatus.toLowerCase()}">${statusText}</span></td>
        <td><span class="token-code">${g.token}</span></td>
        <td>
          <div style="display:flex; gap:4px;">
            <button class="btn btn-secondary btn-sm btn-view-badge" data-id="${g.id}" title="${t('viewBadge')}">🪪</button>
            <button class="btn btn-secondary btn-sm btn-reissue-guest" data-id="${g.id}" title="${t('reissue')}">🔄</button>
            ${!isCancelled && !isCheckedIn ? `<button class="btn btn-danger btn-sm btn-cancel-guest" data-id="${g.id}" title="${t('cancelInvitation')}">✕</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Wire buttons
  document.querySelectorAll('.btn-view-badge').forEach(b => {
    b.addEventListener('click', () => openSingleBadgeModal(b.getAttribute('data-id')));
  });
  document.querySelectorAll('.btn-reissue-guest').forEach(b => {
    b.addEventListener('click', () => {
      if (confirm(t('confirmReissue'))) {
        reissueInvitation(b.getAttribute('data-id'));
        renderGuestsTable();
        renderDashboardStats();
      }
    });
  });
  document.querySelectorAll('.btn-cancel-guest').forEach(b => {
    b.addEventListener('click', () => {
      if (confirm(t('confirmCancelGuest'))) {
        cancelInvitation(b.getAttribute('data-id'));
        renderGuestsTable();
        renderDashboardStats();
      }
    });
  });
}

// 4. EXCEL IMPORT
function setupExcelImportHandlers() {
  const dropzone = document.getElementById('excel-dropzone');
  const fileInput = document.getElementById('excel-file-input');
  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImportFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      processImportFile(e.target.files[0]);
    }
  });

  const btnConfirmImport = document.getElementById('btn-confirm-import');
  if (btnConfirmImport) {
    btnConfirmImport.addEventListener('click', async () => {
      if (!parsedImportBatches || !parsedImportBatches.validRows.length) return;
      const activeEvent = getActiveEvent();
      if (!activeEvent) return;

      const progressContainer = document.getElementById('import-progress-container');
      const progressBar = document.getElementById('import-progress-bar');
      const progressText = document.getElementById('import-progress-text');

      progressContainer.style.display = 'block';
      btnConfirmImport.disabled = true;

      const result = await executeBatchImport(parsedImportBatches.validRows, activeEvent.id, (done, total) => {
        const pct = Math.round((done / total) * 100);
        progressBar.style.width = `${pct}%`;
        progressText.textContent = `${done} / ${total} (${pct}%)`;
      });

      alert(`Successfully imported ${result.importedCount} guests into ${activeEvent.name}!`);
      document.getElementById('import-preview-section').style.display = 'none';
      progressContainer.style.display = 'none';
      btnConfirmImport.disabled = false;
      parsedImportBatches = null;
      renderDashboardStats();
    });
  }

  const btnCancelImport = document.getElementById('btn-cancel-import');
  if (btnCancelImport) {
    btnCancelImport.addEventListener('click', () => {
      document.getElementById('import-preview-section').style.display = 'none';
      parsedImportBatches = null;
      fileInput.value = '';
    });
  }

  const btnDownloadErrors = document.getElementById('btn-download-import-errors');
  if (btnDownloadErrors) {
    btnDownloadErrors.addEventListener('click', () => {
      if (parsedImportBatches) {
        const errors = [...parsedImportBatches.invalidRows, ...parsedImportBatches.duplicateRows];
        downloadErrorReport(errors);
      }
    });
  }
}

async function processImportFile(file) {
  const activeEvent = getActiveEvent();
  if (!activeEvent) {
    alert('Please select an active event before importing.');
    return;
  }

  try {
    const rawRows = await parseSpreadsheetFile(file);
    const batches = validateImportBatch(rawRows, activeEvent.id);
    parsedImportBatches = batches;

    document.getElementById('import-count-valid').textContent = batches.validRows.length;
    document.getElementById('import-count-dup').textContent = batches.duplicateRows.length;
    document.getElementById('import-count-invalid').textContent = batches.invalidRows.length;

    // Show preview section
    const previewSection = document.getElementById('import-preview-section');
    previewSection.style.display = 'block';

    const tbody = document.getElementById('import-preview-tbody');
    const allPreview = [
      ...batches.validRows.map(r => ({ ...r, status: 'valid' })),
      ...batches.duplicateRows.map(r => ({ ...r, status: 'dup' })),
      ...batches.invalidRows.map(r => ({ ...r, status: 'invalid' }))
    ].slice(0, 50);

    tbody.innerHTML = allPreview.map(r => `
      <tr>
        <td>${r.rowNumber}</td>
        <td style="font-weight:600; color:#fff;">${r.fullName || '<span style="color:#ef4444;">Missing</span>'}</td>
        <td>${r.company || '<span style="color:#ef4444;">Missing</span>'}</td>
        <td>${r.email || '—'}</td>
        <td>${r.phone || '—'}</td>
        <td>${r.companionLimit || 0}</td>
        <td>
          ${r.status === 'valid' ? '<span class="status-pill valid">Ready</span>' : 
            r.status === 'dup' ? `<span class="status-pill revoked">${r.reason}</span>` : 
            `<span class="status-pill cancelled">${r.reason}</span>`}
        </td>
      </tr>
    `).join('');

    const btnDownloadErrors = document.getElementById('btn-download-import-errors');
    if (batches.duplicateRows.length > 0 || batches.invalidRows.length > 0) {
      btnDownloadErrors.style.display = 'inline-flex';
    } else {
      btnDownloadErrors.style.display = 'none';
    }
  } catch (err) {
    alert('Error reading file: ' + err.message);
  }
}

// 5. QR BADGES & PASSES
function setupBadgeHandlers() {
  const select = document.getElementById('badge-guest-select');
  if (select) {
    select.addEventListener('change', (e) => {
      const guest = getGuestById(e.target.value);
      if (guest) renderBadgePreview(guest);
    });
  }

  const btnDownloadPng = document.getElementById('btn-download-badge-png');
  if (btnDownloadPng) {
    btnDownloadPng.addEventListener('click', () => {
      const canvas = document.getElementById('invitation-badge-canvas');
      downloadCanvasAsPng(canvas, `VIP_Pass_${currentPreviewGuest?.fullName || 'guest'}.png`);
    });
  }

  const btnExportPdf = document.getElementById('btn-export-all-pdf');
  if (btnExportPdf) {
    btnExportPdf.addEventListener('click', async () => {
      const activeEvent = getActiveEvent();
      if (!activeEvent) return;
      const guests = getGuestsForEvent(activeEvent.id, { status: 'VALID' });
      btnExportPdf.disabled = true;
      btnExportPdf.textContent = 'Generating PDF badges...';
      try {
        await exportAllInvitationsPdf(guests, activeEvent);
      } catch (e) {
        alert('PDF error: ' + e.message);
      } finally {
        btnExportPdf.disabled = false;
        btnExportPdf.textContent = t('downloadPdf');
      }
    });
  }
}

function renderQrPanel() {
  const activeEvent = getActiveEvent();
  if (!activeEvent) return;

  const guests = getGuestsForEvent(activeEvent.id);
  const select = document.getElementById('badge-guest-select');
  if (!select) return;

  select.innerHTML = guests.map(g => `
    <option value="${g.id}">${g.fullName} (${g.company}) - ${g.token}</option>
  `).join('');

  if (guests.length > 0) {
    renderBadgePreview(guests[0]);
  }
}

async function renderBadgePreview(guest) {
  currentPreviewGuest = guest;
  const canvas = document.getElementById('invitation-badge-canvas');
  const activeEvent = getActiveEvent();
  const infoBox = document.getElementById('badge-guest-details-box');

  const statusText = guest.invitationStatus === 'VALID' ? t('statusValid') :
                     guest.invitationStatus === 'CHECKED_IN' ? t('statusCheckedIn') :
                     guest.invitationStatus === 'CANCELLED' ? t('statusCancelledInv') : t('statusRevoked');

  if (infoBox) {
    infoBox.innerHTML = `
      <div><strong>${t('attendeeLabel')}:</strong> ${guest.fullName}</div>
      <div><strong>${t('company')}:</strong> ${guest.company}</div>
      <div><strong>${t('invitationStatus')}:</strong> <span class="status-pill ${guest.invitationStatus.toLowerCase()}">${statusText}</span></div>
      <div style="margin-top:0.35rem;"><strong>${t('uniqueTokenLabel')}:</strong> <span class="token-code">${guest.token}</span></div>
    `;
  }

  await renderInvitationBadgeCanvas(canvas, guest, activeEvent);
}

// 6. SINGLE BADGE MODAL
async function openSingleBadgeModal(guestId) {
  const guest = getGuestById(guestId);
  if (!guest) return;
  const activeEvent = getActiveEvent();

  const modal = document.getElementById('modal-badge-view');
  const canvas = document.getElementById('modal-single-badge-canvas');
  const tokenText = document.getElementById('modal-badge-token-text');

  tokenText.textContent = guest.token;
  modal.style.display = 'flex';

  await renderInvitationBadgeCanvas(canvas, guest, activeEvent);

  const downloadBtn = document.getElementById('modal-download-badge-btn');
  downloadBtn.onclick = () => {
    downloadCanvasAsPng(canvas, `VIP_Pass_${guest.fullName}.png`);
  };
}

// 7. CHECK-IN TERMINAL
function setupScannerHandlers() {
  const btnStart = document.getElementById('btn-start-camera');
  const btnStop = document.getElementById('btn-stop-camera');
  const btnNext = document.getElementById('btn-next-scan');
  const idleOverlay = document.getElementById('scanner-idle-overlay');

  if (btnStart) {
    btnStart.addEventListener('click', async () => {
      try {
        idleOverlay.style.display = 'none';
        btnStart.style.display = 'none';
        btnStop.style.display = 'inline-flex';
        btnNext.style.display = 'inline-flex';

        await startCameraScanner('scanner-viewport', onScanReceived, onScanError);
      } catch (e) {
        alert('Could not start camera: ' + e.message + '\nPlease check camera permissions.');
        idleOverlay.style.display = 'flex';
        btnStart.style.display = 'inline-flex';
        btnStop.style.display = 'none';
        btnNext.style.display = 'none';
      }
    });
  }

  if (btnStop) {
    btnStop.addEventListener('click', async () => {
      await stopCameraScanner();
      idleOverlay.style.display = 'flex';
      btnStart.style.display = 'inline-flex';
      btnStop.style.display = 'none';
      btnNext.style.display = 'none';
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      resetScannerDebounce();
      const resContainer = document.getElementById('scan-result-container');
      if (resContainer) resContainer.style.display = 'none';
    });
  }

  // Manual token input
  const manualBtn = document.getElementById('manual-token-btn');
  const manualInput = document.getElementById('manual-token-input');
  if (manualBtn && manualInput) {
    const runManualVerification = async () => {
      const token = manualInput.value.trim();
      if (token) {
        manualBtn.disabled = true;
        manualBtn.textContent = '...';
        try {
          await handleTokenVerification(token, onScanReceived);
        } finally {
          manualBtn.disabled = false;
          manualBtn.textContent = t('validateTokenBtn') || 'Verify';
          manualInput.value = '';
        }
      }
    };

    manualBtn.addEventListener('click', runManualVerification);
    manualInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        runManualVerification();
      }
    });
  }
}

function onScanReceived(result) {
  const container = document.getElementById('scan-result-container');
  if (!container || !result) return;

  container.style.display = 'block';

  if (result.success && result.guest) {
    employeeTodayScanCount++;
    const staffScanEl = document.getElementById('staff-scan-count');
    if (staffScanEl) staffScanEl.textContent = employeeTodayScanCount;

    renderDashboardStats();
    renderLiveCheckinTable();
    renderGuestsTable();

    container.className = 'result-banner success';
    container.innerHTML = `
      <div style="font-size: 2.2rem; margin-bottom: 0.25rem;">✅</div>
      <h3 style="margin: 0 0 0.5rem 0;">${t('entryApproved')}</h3>
      <p style="color:#d1fae5; font-size:0.95rem; margin-bottom: 0.75rem;">${t('checkinSuccessMsg')}</p>
      <div class="guest-result-details">
        <div><strong>${t('fullName')}:</strong> ${result.guest.fullName}</div>
        <div><strong>${t('company')}:</strong> ${result.guest.company}</div>
        <div><strong>${t('firstScanAt')}</strong> ${new Date(result.checkinTime).toLocaleTimeString()}</div>
        ${result.guest.companionLimit > 0 ? `<div style="color:#34d399; margin-top:4px;"><strong>+ ${result.guest.companionLimit} ${t('companions')}</strong></div>` : ''}
      </div>
      <button class="btn btn-secondary btn-sm" id="btn-banner-next-guest" style="margin-top: 0.75rem; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: #fff;">
        ${t('nextGuestBtn')} ➔
      </button>
    `;
  } else if (result.code === 'ALREADY_CHECKED_IN') {
    container.className = 'result-banner duplicate';
    container.innerHTML = `
      <div style="font-size: 2.2rem; margin-bottom: 0.25rem;">⚠️</div>
      <h3 style="margin: 0 0 0.5rem 0;">${t('alreadyCheckedIn')}</h3>
      <p style="color:#fde68a; font-size:0.95rem; margin-bottom: 0.75rem;">${result.reason}</p>
      ${result.guest ? `
        <div class="guest-result-details">
          <div><strong>${t('fullName')}:</strong> ${result.guest.fullName}</div>
          <div><strong>${t('company')}:</strong> ${result.guest.company}</div>
        </div>
      ` : ''}
      <button class="btn btn-secondary btn-sm" id="btn-banner-next-guest" style="margin-top: 0.75rem; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: #fff;">
        ${t('nextGuestBtn')} ➔
      </button>
    `;
  } else {
    container.className = 'result-banner invalid';
    container.innerHTML = `
      <div style="font-size: 2.2rem; margin-bottom: 0.25rem;">❌</div>
      <h3 style="margin: 0 0 0.5rem 0;">${result.code === 'CANCELLED_INVITATION' ? t('invitationRevoked') : t('invalidInvitation')}</h3>
      <p style="color:#fecaca; font-size:0.95rem; margin-bottom: 0.75rem;">${result.reason || 'Entry forbidden'}</p>
      <button class="btn btn-secondary btn-sm" id="btn-banner-next-guest" style="margin-top: 0.75rem; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: #fff;">
        ${t('nextGuestBtn')} ➔
      </button>
    `;
  }

  const bannerNext = document.getElementById('btn-banner-next-guest');
  if (bannerNext) {
    bannerNext.addEventListener('click', () => {
      resetScannerDebounce();
      container.style.display = 'none';
    });
  }
}

function onScanError(err) {
  console.warn('Scanner error:', err);
}

function renderTerminalHeader() {
  updateEventHeaderTitles();
}

// 8. HISTORY & AUDIT
function renderHistoryTable() {
  const tbody = document.getElementById('history-table-body');
  if (!tbody) return;

  const activeEvent = getActiveEvent();
  const search = document.getElementById('history-search-input')?.value || '';
  const result = document.getElementById('history-result-filter')?.value || 'ALL';

  const history = getCheckinHistory(activeEvent?.id, { search, result });

  if (history.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-dim); padding:1.5rem;">${t('noHistoryRecords')}</td></tr>`;
    return;
  }

  tbody.innerHTML = history.map(h => {
    const isSuccess = h.result === 'SUCCESS';
    const isDup = h.result === 'ALREADY_CHECKED_IN';
    const pillClass = isSuccess ? 'valid' : isDup ? 'revoked' : 'cancelled';
    const resText = isSuccess ? t('resSuccess') : isDup ? t('resAlreadyUsed') : h.result === 'INVALID_TOKEN' ? t('resInvalid') : t('resCancelled');

    return `
      <tr>
        <td style="font-size:0.8rem; color:var(--text-muted);">${new Date(h.timestamp).toLocaleString()}</td>
        <td><span class="status-pill ${pillClass}">${resText}</span></td>
        <td style="font-weight:600; color:#fff;">${h.guestName}</td>
        <td>${h.company}</td>
        <td><span class="token-code">${h.token}</span></td>
        <td style="font-size:0.8rem; color:var(--text-muted);">${h.details || '—'}</td>
        <td style="font-size:0.8rem;">${h.employeeName || 'Staff'}</td>
      </tr>
    `;
  }).join('');
}

function renderAuditTable() {
  const tbody = document.getElementById('audit-table-body');
  if (!tbody) return;

  const logs = (localDB.data.auditLogs || []).slice(0, 30);
  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-dim); padding:1rem;">${t('noAuditLogs')}</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(l => `
    <tr>
      <td style="font-size:0.8rem; color:var(--text-muted);">${new Date(l.timestamp).toLocaleTimeString()}</td>
      <td style="font-weight:600; color:#cbd5e1;">${l.action}</td>
      <td style="font-size:0.8rem;">${l.targetType}</td>
      <td style="font-size:0.8rem; color:var(--text-muted);">${l.details}</td>
      <td style="font-size:0.8rem;">${l.actorUid}</td>
    </tr>
  `).join('');
}

// 9. STAFF ACCOUNTS
function renderStaffTable() {
  const tbody = document.getElementById('staff-table-body');
  if (!tbody) return;

  const staff = Object.values(localDB.data.users).filter(u => u.role === 'EMPLOYEE');
  if (staff.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:1.5rem;">${t('noStaffAccounts')}</td></tr>`;
    return;
  }

  tbody.innerHTML = staff.map(u => `
    <tr>
      <td style="font-weight:600; color:#fff;">${u.displayName}</td>
      <td>${u.email}</td>
      <td><span class="role-tag employee">${t('roleEmployee')}</span></td>
      <td>
        <span class="status-pill ${u.active ? 'valid' : 'cancelled'}">
          ${u.active ? t('activeLabel') : t('disabledLabel')}
        </span>
      </td>
      <td style="font-size:0.8rem; color:var(--text-muted);">${new Date(u.createdAt).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-secondary btn-sm btn-toggle-staff" data-uid="${u.uid}" data-active="${u.active}">
          ${u.active ? t('disableBtn') : t('enableBtn')}
        </button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.btn-toggle-staff').forEach(b => {
    b.addEventListener('click', () => {
      const uid = b.getAttribute('data-uid');
      const cur = b.getAttribute('data-active') === 'true';
      toggleUserStatus(uid, !cur);
      renderStaffTable();
    });
  });
}

// Modals management
function openAddGuestModal() {
  document.getElementById('modal-guest').style.display = 'flex';
}

function openCreateEventModal() {
  document.getElementById('modal-event').style.display = 'flex';
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
}

// Real-time listener: when any checkin happens, update dashboard & history
function setupRealtimeListeners() {
  localDB.subscribe(() => {
    if (currentPanel === 'panel-dashboard') {
      renderDashboardStats();
      renderLiveCheckinTable();
    } else if (currentPanel === 'panel-history') {
      renderHistoryTable();
      renderAuditTable();
    } else if (currentPanel === 'panel-guests') {
      renderGuestsTable();
    }
  });
}
