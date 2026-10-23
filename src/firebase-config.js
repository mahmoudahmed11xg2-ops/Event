/**
 * Firebase Initialization & Resilient Data Layer
 * Handles Firebase Auth & Cloud Firestore with atomic transactions
 * Includes local Firestore simulator for immediate zero-config testing & GitHub Pages standalone preview
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  runTransaction, 
  serverTimestamp, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';

// Default / cached Firebase configuration
const STORAGE_KEY_CONFIG = 'ems_firebase_config';
const STORAGE_KEY_LOCAL_DB = 'ems_firestore_mock_db';

let app = null;
let auth = null;
let db = null;
let isRealFirebase = false;

// Default demo event and initial bootstrap data
export const DEFAULT_INITIAL_DATA = {
  users: {
    'admin-root-uid': {
      uid: 'admin-root-uid',
      email: 'admin@event.org',
      displayName: 'System Administrator',
      role: 'ADMIN',
      active: true,
      createdAt: new Date().toISOString()
    },
    'employee-01-uid': {
      uid: 'employee-01-uid',
      email: 'staff@event.org',
      displayName: 'Entrance Gate 1 (Staff)',
      role: 'EMPLOYEE',
      active: true,
      assignedEventIds: ['evt-summit-2026'],
      createdAt: new Date().toISOString()
    }
  },
  events: {
    'evt-summit-2026': {
      id: 'evt-summit-2026',
      name: 'Global Innovation & Tech Summit 2026',
      description: 'Annual corporate gathering for industry leaders, partners and executive keynote speakers.',
      venue: 'Metropolitan Convention Grand Ballroom',
      startAt: '2026-11-15T09:00',
      endAt: '2026-11-15T18:00',
      timeZone: 'UTC+3 (Riyadh / Dubai)',
      status: 'Active',
      createdAt: new Date().toISOString(),
      createdBy: 'admin-root-uid'
    }
  },
  guests: {
    'gst-001': {
      id: 'gst-001',
      eventId: 'evt-summit-2026',
      fullName: 'Dr. Sarah Al-Mansoor',
      company: 'Apex Robotics International',
      email: 'sarah.mansoor@apexrobotics.io',
      phone: '+971 50 123 4567',
      invitationStatus: 'VALID',
      token: 'INV-A7F2-99B4-4D1E',
      companionLimit: 1,
      notes: 'VIP Keynote Speaker',
      checkedInAt: null,
      checkedInBy: null,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    'gst-002': {
      id: 'gst-002',
      eventId: 'evt-summit-2026',
      fullName: 'Marcus Vance',
      company: 'Quantum Cybernetics',
      email: 'm.vance@quantumcyber.com',
      phone: '+1 415 890 2341',
      invitationStatus: 'VALID',
      token: 'INV-C3B8-18E2-7F0A',
      companionLimit: 0,
      notes: 'Investor Delegate',
      checkedInAt: null,
      checkedInBy: null,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    'gst-003': {
      id: 'gst-003',
      eventId: 'evt-summit-2026',
      fullName: 'Noura Khalid',
      company: 'CloudSphere Solutions',
      email: 'noura@cloudsphere.sa',
      phone: '+966 54 888 9911',
      invitationStatus: 'CHECKED_IN',
      token: 'INV-9D4E-55A1-2C8B',
      companionLimit: 2,
      notes: 'Media Partner',
      checkedInAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      checkedInBy: 'employee-01-uid',
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    'gst-004': {
      id: 'gst-004',
      eventId: 'evt-summit-2026',
      fullName: 'David Sterling',
      company: 'Sterling Capital Advisors',
      email: 'david@sterlingcap.com',
      phone: '+44 20 7946 0912',
      invitationStatus: 'CANCELLED',
      token: 'INV-1B7A-44C9-8E3D',
      companionLimit: 0,
      notes: 'Cancelled attendance by email request',
      checkedInAt: null,
      checkedInBy: null,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
    }
  },
  checkins: {
    'chk-001': {
      id: 'chk-001',
      eventId: 'evt-summit-2026',
      guestId: 'gst-003',
      guestName: 'Noura Khalid',
      company: 'CloudSphere Solutions',
      token: 'INV-9D4E-55A1-2C8B',
      result: 'SUCCESS',
      employeeUid: 'employee-01-uid',
      employeeName: 'Entrance Gate 1 (Staff)',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  },
  checkinAttempts: [
    {
      id: 'att-001',
      eventId: 'evt-summit-2026',
      token: 'INV-9D4E-55A1-2C8B',
      result: 'ALREADY_CHECKED_IN',
      rejectionReason: 'Invitation has already been redeemed at Gate 1.',
      employeeUid: 'employee-01-uid',
      timestamp: new Date(Date.now() - 1800000).toISOString()
    }
  ],
  auditLogs: [
    {
      id: 'aud-001',
      actorUid: 'admin-root-uid',
      action: 'EVENT_INITIALIZED',
      targetType: 'EVENT',
      targetId: 'evt-summit-2026',
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      details: 'Created event Global Innovation & Tech Summit 2026'
    }
  ]
};

// Check if user has saved real Firebase configuration in localStorage
function getSavedConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading saved Firebase config:', e);
  }
  return null;
}

export function saveFirebaseConfig(cfg) {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cfg));
    return true;
  } catch (e) {
    console.error('Error saving config:', e);
    return false;
  }
}

// In-Memory / LocalStorage Synchronous Engine
class LocalFirestoreEngine {
  constructor() {
    this.listeners = new Set();
    this.data = this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LOCAL_DB);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Using fresh default data');
    }
    this.save(DEFAULT_INITIAL_DATA);
    return JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
  }

  save(data = this.data) {
    this.data = data;
    try {
      localStorage.setItem(STORAGE_KEY_LOCAL_DB, JSON.stringify(this.data));
    } catch (e) {
      console.error('Local save error', e);
    }
    this.notify();
  }

  notify() {
    this.listeners.forEach(cb => {
      try { cb(this.data); } catch (e) { console.error('Listener err', e); }
    });
  }

  subscribe(cb) {
    this.listeners.add(cb);
    cb(this.data);
    return () => this.listeners.delete(cb);
  }

  // Atomic Check-in Execution (guarantees single-use check-in)
  atomicCheckin(token, eventId, employee) {
    // 1. Validate inputs
    if (!token || !eventId) {
      return { success: false, code: 'INVALID_TOKEN', reason: 'Token or Event ID missing' };
    }

    const cleanToken = token.trim().toUpperCase();
    const event = this.data.events[eventId];
    if (!event || event.status !== 'Active') {
      const attempt = {
        id: 'att-' + Date.now(),
        eventId,
        token: cleanToken,
        result: 'EVENT_NOT_ACTIVE',
        rejectionReason: 'Event is either completed, cancelled, or not currently active.',
        employeeUid: employee?.uid || 'anonymous',
        timestamp: new Date().toISOString()
      };
      this.data.checkinAttempts.unshift(attempt);
      this.save();
      return { success: false, code: 'EVENT_NOT_ACTIVE', reason: attempt.rejectionReason };
    }

    // 2. Find guest with this token
    const guestEntry = Object.entries(this.data.guests).find(([_, g]) => {
      return g.token && g.token.toUpperCase() === cleanToken && g.eventId === eventId;
    });

    if (!guestEntry) {
      const attempt = {
        id: 'att-' + Date.now(),
        eventId,
        token: cleanToken,
        result: 'INVALID_TOKEN',
        rejectionReason: 'Invitation token is not recognized in this event database.',
        employeeUid: employee?.uid || 'anonymous',
        timestamp: new Date().toISOString()
      };
      this.data.checkinAttempts.unshift(attempt);
      this.save();
      return { success: false, code: 'INVALID_TOKEN', reason: attempt.rejectionReason };
    }

    const [guestId, guest] = guestEntry;

    // 3. Check invitation status
    if (guest.invitationStatus === 'CANCELLED' || guest.invitationStatus === 'REVOKED') {
      const attempt = {
        id: 'att-' + Date.now(),
        eventId,
        token: cleanToken,
        result: 'CANCELLED_INVITATION',
        rejectionReason: `Invitation was ${guest.invitationStatus.toLowerCase()} by an administrator.`,
        employeeUid: employee?.uid || 'anonymous',
        timestamp: new Date().toISOString()
      };
      this.data.checkinAttempts.unshift(attempt);
      this.save();
      return { 
        success: false, 
        code: 'CANCELLED_INVITATION', 
        reason: attempt.rejectionReason,
        guest: { fullName: guest.fullName, company: guest.company }
      };
    }

    if (guest.invitationStatus === 'CHECKED_IN') {
      const attempt = {
        id: 'att-' + Date.now(),
        eventId,
        token: cleanToken,
        result: 'ALREADY_CHECKED_IN',
        rejectionReason: `Already checked in at ${new Date(guest.checkedInAt).toLocaleTimeString()}`,
        employeeUid: employee?.uid || 'anonymous',
        timestamp: new Date().toISOString()
      };
      this.data.checkinAttempts.unshift(attempt);
      this.save();
      return { 
        success: false, 
        code: 'ALREADY_CHECKED_IN', 
        reason: attempt.rejectionReason,
        originalCheckinTime: guest.checkedInAt,
        guest: { fullName: guest.fullName, company: guest.company }
      };
    }

    // 4. ATOMIC CHECK-IN SUCCESS
    const checkinTime = new Date().toISOString();
    guest.invitationStatus = 'CHECKED_IN';
    guest.checkedInAt = checkinTime;
    guest.checkedInBy = employee?.uid || 'staff';

    const checkinRecord = {
      id: 'chk-' + Date.now(),
      eventId,
      guestId,
      guestName: guest.fullName,
      company: guest.company,
      token: cleanToken,
      result: 'SUCCESS',
      employeeUid: employee?.uid || 'staff',
      employeeName: employee?.displayName || 'Staff Member',
      timestamp: checkinTime
    };

    this.data.checkins[checkinRecord.id] = checkinRecord;
    this.save();

    return {
      success: true,
      code: 'SUCCESS',
      guest: {
        id: guestId,
        fullName: guest.fullName,
        company: guest.company,
        email: guest.email,
        phone: guest.phone,
        companionLimit: guest.companionLimit || 0,
        notes: guest.notes || ''
      },
      checkinTime
    };
  }
}

export const localDB = new LocalFirestoreEngine();

// Cryptographically secure token generator
export function generateSecureToken() {
  const bytes = new Uint8Array(6);
  window.crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
  return `INV-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

// Initialize Firebase if user config exists
export function initFirebase() {
  const cfg = getSavedConfig();
  if (cfg && cfg.apiKey && cfg.projectId) {
    try {
      app = initializeApp(cfg);
      auth = getAuth(app);
      db = getFirestore(app);
      isRealFirebase = true;
      console.log('Firebase initialized with custom configuration:', cfg.projectId);
      return { app, auth, db, isReal: true };
    } catch (e) {
      console.error('Failed to initialize Firebase with provided config:', e);
    }
  }
  isRealFirebase = false;
  return { app: null, auth: null, db: null, isReal: false };
}

export function isUsingRealFirebase() {
  return isRealFirebase;
}

export function getDatabase() {
  return { isReal: isRealFirebase, db, localDB };
}
