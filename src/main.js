/**
 * Main Application Controller - Executive Arabic & English Visual Identity
 * Pixel-perfect adaptation matching Arabic Event Invitation Dashboard reference
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
  setupLiveClock();
  setupEventListeners();
  checkInitialSession();
  setupRealtimeListeners();
});

// Live Date & Time Clock Updater
function setupLiveClock() {
  updateLiveClock();
  setInterval(updateLiveClock, 1000);
}

function updateLiveClock() {
  const now = new Date();
  const lang = getLanguage();
  const timeEl = document.getElementById('header-live-time');
  const dateEl = document.getElementById('header-live-date');

  if (timeEl) {
    timeEl.textContent = now.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}

function setupEventListeners() {
  // Language toggle
  const langToggleBtn = document.getElementById('lang-toggle-btn');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      const next = getLanguage() === 'en' ? 'ar' : 'en';
      setLanguage(next);
      updateLiveClock();
      renderCurrentPanel();
      const currentUser = getSessionUser();
      if (currentUser) updateAuthUI(currentUser);
    });
  }

  // User profile dropdown toggle
  const profileToggleBtn = document.getElementById('user-profile-toggle-btn');
  const userDropdown = document.getElementById('user-dropdown');
  if (profileToggleBtn && userDropdown) {
    profileToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!userDropdown.contains(e.target) && !profileToggleBtn.contains(e.target)) {
        userDropdown.classList.remove('show');
      }
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

  // Staff Password toggle
  const toggleStaffPwBtn = document.getElementById('btn-toggle-staff-pw');
  if (toggleStaffPwBtn) {
    toggleStaffPwBtn.addEventListener('click', () => {
      const passInput = document.getElementById('staff-password');
      if (passInput.type === 'password') {
        passInput.type = 'text';
      } else {
        passInput.type = 'password';
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
      if (userDropdown) userDropdown.classList.remove('show');
    });
  }

  // Navigation items
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetPanel = btn.getAttribute('data-panel');
      if (targetPanel) switchPanel(targetPanel);
    });
  });

  // Docked bottom quick scan button in sidebar
  const dockedQuickScanBtn = document.getElementById('docked-quick-scan-btn');
  if (dockedQuickScanBtn) {
    dockedQuickScanBtn.addEventListener('click', () => {
      switchPanel('panel-terminal');
      triggerCameraStart();
    });
  }

  // Notification Bell
  const bellBtn = document.getElementById('btn-notifications-bell');
  if (bellBtn) {
    bellBtn.addEventListener('click', () => {
      switchPanel('panel-notifications');
    });
  }

  // Link "View all" in live check-ins card
  const linkViewAll = document.getElementById('link-view-all-history');
  if (linkViewAll) {
    linkViewAll.addEventListener('click', () => {
      switchPanel('panel-history');
    });
  }

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

  // Open Camera Button on Dashboard Card
  const dashOpenCameraBtn = document.getElementById('dash-open-camera-btn');
  if (dashOpenCameraBtn) {
    dashOpenCameraBtn.addEventListener('click', () => {
      switchPanel('panel-terminal');
      triggerCameraStart();
    });
  }

  // Upload QR Image Button & Hidden File Input
  const dashUploadQrBtn = document.getElementById('dash-upload-qr-btn');
  const qrFileInput = document.getElementById('qr-file-input');
  if (dashUploadQrBtn && qrFileInput) {
    dashUploadQrBtn.addEventListener('click', () => {
      qrFileInput.click();
    });

    qrFileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const originalHtml = dashUploadQrBtn.innerHTML;
      try {
        dashUploadQrBtn.disabled = true;
        dashUploadQrBtn.textContent = 'جاري تحليل رمز QR...';

        const Html5QrcodeClass = window.Html5Qrcode || (await import('html5-qrcode')).Html5Qrcode;
        
        let tempDiv = document.getElementById('temp-qr-scanner-box');
        if (!tempDiv) {
          tempDiv = document.createElement('div');
          tempDiv.id = 'temp-qr-scanner-box';
          tempDiv.style.display = 'none';
          document.body.appendChild(tempDiv);
        }

        const scanner = new Html5QrcodeClass('temp-qr-scanner-box');
        const token = await scanner.scanFile(file, false);
        try { scanner.clear(); } catch (_) {}

        if (token) {
          const result = await handleTokenVerification(token);
          renderDashboardStats();
          renderLiveCheckinTable();
          if (result.success) {
            alert(`✅ ${t('entryApproved') || 'تم تأكيد الدخول بنجاح!'}\nالاسم: ${result.guest?.fullName || token}\nالشركة: ${result.guest?.company || ''}`);
          } else {
            alert(`⚠️ ${result.reason || t('invalidInvitation') || 'رمز غير صالح أو تم استخدامه مسبقاً.'}`);
          }
        }
      } catch (err) {
        alert('لم يتم العثور على رمز QR واضح في الصورة المرفوعة أو الرمز غير صالح.');
      } finally {
        dashUploadQrBtn.disabled = false;
        dashUploadQrBtn.innerHTML = originalHtml;
        qrFileInput.value = '';
      }
    });
  }

  // Switch to Import from Guests
  const btnSwitchImport = document.getElementById('btn-switch-to-import');
  if (btnSwitchImport) {
    btnSwitchImport.addEventListener('click', () => {
      switchPanel('panel-import');
    });
  }

  // Guest Search & Status Filter
  const guestSearch = document.getElementById('guest-search-input');
  const guestFilter = document.getElementById('guest-status-filter');
  if (guestSearch) guestSearch.addEventListener('input', () => renderGuestsTable());
  if (guestFilter) guestFilter.addEventListener('change', () => renderGuestsTable());

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

  // Staff Account Form Submit
  const formStaff = document.getElementById('form-staff');
  if (formStaff) {
    formStaff.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btn-submit-staff');
      const originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري إنشاء الحساب في فايربيس...';
      }

      const name = document.getElementById('staff-name').value;
      const email = document.getElementById('staff-email').value;
      const password = document.getElementById('staff-password').value;

      try {
        await createEmployeeAccount(email, password, name);
        closeAllModals();
        formStaff.reset();
        renderStaffTable();
        alert('تم إنشاء حساب الموظف وربطه في Firebase بنجاح!');
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

  // Firebase Config Save
  const btnSaveConfig = document.getElementById('btn-save-firebase-config');
  if (btnSaveConfig) {
    btnSaveConfig.addEventListener('click', () => {
      const txt = document.getElementById('firebase-config-input')?.value.trim();
      if (txt) {
        try {
          const config = JSON.parse(txt);
          localStorage.setItem('custom_firebase_config', JSON.stringify(config));
          alert('تم حفظ إعدادات Firebase بنجاح. سيتم إعادة تهيئة الاتصال الآن.');
          location.reload();
        } catch (e) {
          alert('صيغة JSON غير صحيحة: ' + e.message);
        }
      }
    });
  }

  // Reset Demo Data
  const btnResetDemo = document.getElementById('btn-reset-demo-data');
  if (btnResetDemo) {
    btnResetDemo.addEventListener('click', () => {
      if (confirm(t('resetConfirm'))) {
        localStorage.clear();
        location.reload();
      }
    });
  }
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

  const displayName = user.displayName || user.email.split('@')[0];
  document.getElementById('user-display-name').textContent = displayName;

  const initialEl = document.getElementById('user-avatar-initial');
  if (initialEl) {
    initialEl.textContent = displayName.charAt(0).toUpperCase();
  }

  const roleTag = document.getElementById('user-role-tag');
  if (roleTag) {
    const isAr = getLanguage() === 'ar';
    roleTag.textContent = user.role === 'ADMIN' ? (isAr ? 'مدير النظام' : 'Admin') : (isAr ? 'موظف' : 'Staff');
  }

  // Role Protection
  if (user.role === 'EMPLOYEE') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    switchPanel('panel-terminal');
  } else {
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
      break;
    case 'panel-notifications':
      renderNotificationsPanel();
      break;
    case 'panel-settings':
      renderStaffTable();
      break;
    case 'panel-terminal':
      renderTerminalHeader();
      break;
  }
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
    updateAttendanceGauge(0);
    return;
  }

  const stats = calculateEventStats(activeEvent.id);
  document.getElementById('stat-total-guests').textContent = stats.totalGuests;
  document.getElementById('stat-valid-invitations').textContent = stats.validInvitations;
  document.getElementById('stat-checked-in').textContent = stats.checkedIn;
  document.getElementById('stat-yet-to-arrive').textContent = stats.yetToArrive;
  document.getElementById('stat-cancelled').textContent = stats.cancelled;
  updateAttendanceGauge(stats.attendanceRate);
}

function updateAttendanceGauge(percentage) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // 238.761
  const fillCircle = document.getElementById('gauge-circle-fill');
  const textEl = document.getElementById('stat-attendance-rate');

  if (textEl) {
    textEl.textContent = `${percentage}%`;
  }

  if (fillCircle) {
    const offset = circumference - (percentage / 100) * circumference;
    fillCircle.style.strokeDashoffset = offset;
  }
}

function renderLiveCheckinTable() {
  const tbody = document.getElementById('live-checkin-table-body');
  if (!tbody) return;

  const activeEvent = getActiveEvent();
  const recent = getRecentCheckins(activeEvent?.id, 8);

  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:2rem;">${t('noRecentActivity')}</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(c => `
    <tr>
      <td style="font-size:0.85rem; color:var(--text-muted);">${new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
      <td style="font-weight:700; color:var(--text-main);">${c.guestName}</td>
      <td style="color:var(--text-body);">${c.company || '—'}</td>
      <td><span class="token-pill">${c.token}</span></td>
      <td style="color:var(--text-muted); font-size:0.85rem;">${c.employeeName || 'Staff'}</td>
      <td><span class="badge-status checked-in">${t('statusCheckedIn')}</span></td>
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
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:2rem;">${t('noActiveEventSelected')}</td></tr>`;
    return;
  }

  tbody.innerHTML = events.map(e => {
    const statusKey = 'status' + (e.status || 'Active');
    const translatedStatus = t(statusKey) || e.status;
    return `
      <tr>
        <td style="font-weight:700; color:var(--text-main);">
          ${e.name}
          ${e.id === activeId ? `<span class="badge-status valid" style="margin-inline-start:6px; font-size:0.7rem;">${t('currentBadge')}</span>` : ''}
        </td>
        <td>${e.venue}</td>
        <td style="font-size:0.82rem; color:var(--text-muted);">${e.startAt ? new Date(e.startAt).toLocaleString() : '—'}</td>
        <td style="font-size:0.82rem;">${e.timeZone}</td>
        <td><span class="badge-status ${e.status.toLowerCase()}">${translatedStatus}</span></td>
        <td>
          ${e.id !== activeId ? `<button class="btn btn-secondary btn-sm btn-activate-event" data-id="${e.id}">${t('setActiveBtn')}</button>` : `<span style="color:var(--status-green-text); font-weight:700; font-size:0.82rem;">${t('currentBadge')}</span>`}
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
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">${t('noActiveEventSelected')}</td></tr>`;
    return;
  }

  const search = document.getElementById('guest-search-input')?.value || '';
  const status = document.getElementById('guest-status-filter')?.value || 'ALL';
  const guests = getGuestsForEvent(activeEvent.id, { search, status });

  if (guests.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:2rem;">${t('noGuestsMatch')}</td></tr>`;
    return;
  }

  tbody.innerHTML = guests.map(g => {
    const isCancelled = g.invitationStatus === 'CANCELLED' || g.invitationStatus === 'REVOKED';
    const isCheckedIn = g.invitationStatus === 'CHECKED_IN';
    const statusText = g.invitationStatus === 'VALID' ? t('statusValid') :
                       g.invitationStatus === 'CHECKED_IN' ? t('statusCheckedIn') :
                       g.invitationStatus === 'CANCELLED' ? t('statusCancelledInv') : t('statusRevoked');
    const badgeClass = g.invitationStatus.toLowerCase().replace('_', '-');

    return `
      <tr>
        <td style="font-weight:700; color:var(--text-main);">${g.fullName}</td>
        <td>${g.company}</td>
        <td style="font-size:0.82rem; color:var(--text-muted);">${g.email || '—'}</td>
        <td style="font-size:0.82rem;">${g.phone || '—'}</td>
        <td style="text-align:center; font-weight:600;">${g.companionLimit || 0}</td>
        <td><span class="badge-status ${badgeClass}">${statusText}</span></td>
        <td><span class="token-pill">${g.token}</span></td>
        <td>
          <div style="display:flex; gap:6px;">
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
    b.addEventListener('click', async () => {
      const guestId = b.getAttribute('data-id');
      const guest = getGuestById(guestId);
      const guestName = guest?.fullName || '';

      if (confirm(`هل تريد بالتأكيد إعادة توليد رمز QR جديد للضيف "${guestName}"؟\nسيتم إبطال الرمز القديم تماماً وتفعيل الرمز الجديد.`)) {
        b.disabled = true;
        try {
          const updated = await reissueInvitation(guestId);
          renderGuestsTable();
          renderDashboardStats();
          renderLiveCheckinTable();
          alert(`✅ تم توليد رمز QR جديد بنجاح للضيف "${updated.fullName}".\nرمز الدعوة الجديد: ${updated.token}`);
        } catch (err) {
          alert('حدث خطأ أثناء إعادة توليد الرمز: ' + (err.message || err));
        } finally {
          b.disabled = false;
        }
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
        <td style="font-weight:700; color:var(--text-main);">${r.fullName || '<span style="color:var(--status-red);">Missing</span>'}</td>
        <td>${r.company || '<span style="color:var(--status-red);">Missing</span>'}</td>
        <td style="font-size:0.82rem; color:var(--text-muted);">${r.email || '—'}</td>
        <td style="font-size:0.82rem;">${r.phone || '—'}</td>
        <td style="text-align:center;">${r.companionLimit || 0}</td>
        <td>
          ${r.status === 'valid' ? '<span class="badge-status valid">جاهز للاستيراد</span>' : 
            r.status === 'dup' ? `<span class="badge-status warning">${r.reason}</span>` : 
            `<span class="badge-status cancelled">${r.reason}</span>`}
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
  const badgeClass = guest.invitationStatus.toLowerCase().replace('_', '-');

  if (infoBox) {
    infoBox.innerHTML = `
      <div style="margin-bottom:0.35rem;"><strong>الاسم:</strong> ${guest.fullName}</div>
      <div style="margin-bottom:0.35rem;"><strong>الجهة / الشركة:</strong> ${guest.company}</div>
      <div style="margin-bottom:0.35rem;"><strong>الحالة:</strong> <span class="badge-status ${badgeClass}">${statusText}</span></div>
      <div style="margin-top:0.5rem;"><strong>رمز الدعوة:</strong> <span class="token-pill">${guest.token}</span></div>
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

  if (btnStart) {
    btnStart.addEventListener('click', triggerCameraStart);
  }

  if (btnStop) {
    btnStop.addEventListener('click', async () => {
      await stopCameraScanner();
      const idleOverlay = document.getElementById('scanner-idle-overlay');
      if (idleOverlay) idleOverlay.style.display = 'flex';
      btnStart.style.display = 'inline-flex';
      btnStop.style.display = 'none';
      if (btnNext) btnNext.style.display = 'none';
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

async function triggerCameraStart() {
  const btnStart = document.getElementById('btn-start-camera');
  const btnStop = document.getElementById('btn-stop-camera');
  const btnNext = document.getElementById('btn-next-scan');
  const idleOverlay = document.getElementById('scanner-idle-overlay');

  try {
    if (idleOverlay) idleOverlay.style.display = 'none';
    if (btnStart) btnStart.style.display = 'none';
    if (btnStop) btnStop.style.display = 'inline-flex';
    if (btnNext) btnNext.style.display = 'inline-flex';

    await startCameraScanner('scanner-viewport', onScanReceived, onScanError);
  } catch (e) {
    alert('تعذر تشغيل الكاميرا: ' + e.message + '\nيرجى التأكد من منح صلاحية استخدام الكاميرا.');
    if (idleOverlay) idleOverlay.style.display = 'flex';
    if (btnStart) btnStart.style.display = 'inline-flex';
    if (btnStop) btnStop.style.display = 'none';
    if (btnNext) btnNext.style.display = 'none';
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

    container.className = 'scan-result-card success';
    container.innerHTML = `
      <div style="font-size: 2.2rem; margin-bottom: 0.25rem;">✅</div>
      <h3 style="margin: 0 0 0.5rem 0; font-weight:800;">دخول مصرح (ناجح)</h3>
      <p style="font-size:0.95rem; margin-bottom: 0.75rem;">تم تسجيل الحضور والمزامنة اللحظية بنجاح.</p>
      <div style="background: rgba(255,255,255,0.6); padding: 0.85rem; border-radius: var(--radius-sm); font-size: 0.88rem; line-height: 1.6;">
        <div><strong>الاسم:</strong> ${result.guest.fullName}</div>
        <div><strong>الجهة:</strong> ${result.guest.company}</div>
        <div><strong>وقت الدخول:</strong> ${new Date(result.checkinTime).toLocaleTimeString()}</div>
        ${result.guest.companionLimit > 0 ? `<div style="color:var(--status-green-text); font-weight:700; margin-top:4px;"><strong>+ ${result.guest.companionLimit} مرافقين</strong></div>` : ''}
      </div>
      <button class="btn btn-primary btn-sm" id="btn-banner-next-guest" style="margin-top: 1rem;">
        فحص الضيف التالي ➔
      </button>
    `;
  } else if (result.code === 'ALREADY_CHECKED_IN') {
    container.className = 'scan-result-card error';
    container.innerHTML = `
      <div style="font-size: 2.2rem; margin-bottom: 0.25rem;">⚠️</div>
      <h3 style="margin: 0 0 0.5rem 0; font-weight:800;">رمز مستخدم مسبقاً!</h3>
      <p style="font-size:0.95rem; margin-bottom: 0.75rem;">${result.reason}</p>
      ${result.guest ? `
        <div style="background: rgba(255,255,255,0.6); padding: 0.85rem; border-radius: var(--radius-sm); font-size: 0.88rem;">
          <div><strong>الاسم:</strong> ${result.guest.fullName}</div>
          <div><strong>الجهة:</strong> ${result.guest.company}</div>
        </div>
      ` : ''}
      <button class="btn btn-secondary btn-sm" id="btn-banner-next-guest" style="margin-top: 1rem;">
        فحص الضيف التالي ➔
      </button>
    `;
  } else {
    container.className = 'scan-result-card error';
    container.innerHTML = `
      <div style="font-size: 2.2rem; margin-bottom: 0.25rem;">❌</div>
      <h3 style="margin: 0 0 0.5rem 0; font-weight:800;">${result.code === 'CANCELLED_INVITATION' ? 'دعوة ملغاة' : 'رمز غير صالح'}</h3>
      <p style="font-size:0.95rem; margin-bottom: 0.75rem;">${result.reason || 'الدخول غير مسموح'}</p>
      <button class="btn btn-secondary btn-sm" id="btn-banner-next-guest" style="margin-top: 1rem;">
        فحص الضيف التالي ➔
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
  // Non-critical frame error
}

function renderTerminalHeader() {
  const activeEvent = getActiveEvent();
  const title = activeEvent ? activeEvent.name : 'لم يتم اختيار فعالية';
  const termTitle = document.getElementById('terminal-event-name');
  if (termTitle) termTitle.textContent = title;
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
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:2rem;">لا توجد سجلات دخول مسجلة حالياً.</td></tr>`;
    return;
  }

  tbody.innerHTML = history.map(h => {
    const isSuccess = h.result === 'SUCCESS';
    const isDup = h.result === 'ALREADY_CHECKED_IN';
    const pillClass = isSuccess ? 'success' : isDup ? 'warning' : 'cancelled';
    const resText = isSuccess ? 'دخول مصرح' : isDup ? 'مستخدم مسبقاً' : h.result === 'INVALID_TOKEN' ? 'رمز غير صالح' : 'دعوة ملغاة';

    return `
      <tr>
        <td style="font-size:0.82rem; color:var(--text-muted);">${new Date(h.timestamp).toLocaleString()}</td>
        <td><span class="badge-status ${pillClass}">${resText}</span></td>
        <td style="font-weight:700; color:var(--text-main);">${h.guestName}</td>
        <td>${h.company}</td>
        <td><span class="token-pill">${h.token}</span></td>
        <td style="font-size:0.82rem; color:var(--text-muted);">${h.details || '—'}</td>
        <td style="font-size:0.82rem;">${h.employeeName || 'Staff'}</td>
      </tr>
    `;
  }).join('');
}

function renderAuditTable() {
  // Administrative audit trail removed per user request
}

// 9. NOTIFICATIONS FEED
function renderNotificationsPanel() {
  const container = document.getElementById('notifications-list');
  if (!container) return;
  const activeEvent = getActiveEvent();
  const recent = getRecentCheckins(activeEvent?.id, 20);

  if (recent.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2.5rem;">لا توجد تنبيهات جديدة مسجلة حالياً.</div>`;
    return;
  }

  container.innerHTML = recent.map(r => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
      <div style="display: flex; align-items: center; gap: 0.85rem;">
        <span style="font-size: 1.35rem;">✅</span>
        <div>
          <div style="font-weight: 700; color: var(--text-main); font-size: 0.92rem;">تم تسجيل دخول: ${r.guestName}</div>
          <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">${r.company || '—'} · رمز الدعوة: <span class="token-pill">${r.token}</span></div>
        </div>
      </div>
      <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 500;">${new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  `).join('');
}

// 10. STAFF ACCOUNTS
function renderStaffTable() {
  const tbody = document.getElementById('staff-table-body');
  if (!tbody) return;

  const staff = Object.values(localDB.data.users).filter(u => u.role === 'EMPLOYEE');
  if (staff.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">${t('noStaffAccounts')}</td></tr>`;
    return;
  }

  tbody.innerHTML = staff.map(u => `
    <tr>
      <td style="font-weight:700; color:var(--text-main);">${u.displayName}</td>
      <td>${u.email}</td>
      <td><span class="badge-status valid">${t('roleEmployee')}</span></td>
      <td>
        <span class="badge-status ${u.active ? 'success' : 'cancelled'}">
          ${u.active ? t('activeBadge') : t('inactiveBadge')}
        </span>
      </td>
      <td style="font-size:0.82rem; color:var(--text-muted);">${new Date(u.createdAt).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-secondary btn-sm btn-toggle-staff" data-uid="${u.uid}" data-active="${u.active}">
          ${u.active ? 'تعطيل' : 'تفعيل'}
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
    } else if (currentPanel === 'panel-guests') {
      renderGuestsTable();
    } else if (currentPanel === 'panel-notifications') {
      renderNotificationsPanel();
    }
  });
}
