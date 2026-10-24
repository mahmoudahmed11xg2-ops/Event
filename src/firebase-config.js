/**
 * Firebase Real-time Initialization & Firestore Synchronization Engine
 * Automatically connected to project: event-a5ab1
 * Full real-time synchronization via onSnapshot listeners and atomic runTransaction check-ins.
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

// User's Real Firebase Project Configuration (Permanently connected)
export const BUILTIN_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCf9bNTBEIcVzavscQQsgYQcXU5EBBNFB8",
  authDomain: "event-a5ab1.firebaseapp.com",
  projectId: "event-a5ab1",
  storageBucket: "event-a5ab1.firebasestorage.app",
  messagingSenderId: "655795139486",
  appId: "1:655795139486:web:9afc881a1afcc9e85f5c8f",
  measurementId: "G-3DKREPMFE7"
};

const STORAGE_KEY_LOCAL_DB = 'ems_firestore_mock_db';

let app = null;
let auth = null;
let db = null;
let isRealFirebase = false;
let firestoreUnsubscribers = [];

export const DEFAULT_INITIAL_DATA = {
  users: {},
  events: {},
  guests: {},
  checkins: {},
  checkinAttempts: [],
  auditLogs: []
};

class LocalFirestoreEngine {
  constructor() {
    this.listeners = new Set();
    this.data = this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LOCAL_DB);
      if (stored) {
        const parsed = JSON.parse(stored);
        // If it contains legacy demo data, wipe it completely clean
        if (parsed.events && (parsed.events['evt-summit-2026'] || parsed.guests?.['gst-001'])) {
          localStorage.removeItem(STORAGE_KEY_LOCAL_DB);
          localStorage.removeItem('ems_active_event_id');
          return JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Using empty initial data');
    }
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

  // Atomic Check-in Execution
  async atomicCheckin(token, eventId, employee) {
    if (!token || !eventId) {
      return { success: false, code: 'INVALID_TOKEN', reason: 'Token or Event ID missing' };
    }

    const cleanToken = token.trim().toUpperCase();

    // If Real Firebase Firestore is active, execute real Firestore runTransaction
    if (isRealFirebase && db) {
      try {
        return await this.executeCloudFirestoreTransaction(cleanToken, eventId, employee);
      } catch (cloudErr) {
        console.error('Cloud Firestore transaction error, falling back:', cloudErr);
      }
    }

    // Local in-memory transaction
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

    if (guest.invitationStatus === 'CANCELLED' || guest.invitationStatus === 'REVOKED') {
      const attempt = {
        id: 'att-' + Date.now(),
        eventId,
        token: cleanToken,
        result: 'CANCELLED_INVITATION',
        rejectionReason: `Invitation was cancelled by an administrator.`,
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

  // Real Cloud Firestore Transaction
  async executeCloudFirestoreTransaction(token, eventId, employee) {
    const q = query(
      collection(db, 'guests'), 
      where('eventId', '==', eventId), 
      where('token', '==', token)
    );
    const querySnap = await getDocs(q);

    if (querySnap.empty) {
      await setDoc(doc(collection(db, 'checkinAttempts')), {
        eventId,
        token,
        result: 'INVALID_TOKEN',
        rejectionReason: 'Token not found in Cloud Firestore',
        employeeUid: employee?.uid || 'staff',
        timestamp: new Date().toISOString()
      });
      return { success: false, code: 'INVALID_TOKEN', reason: 'Invalid or unknown QR token' };
    }

    const guestDoc = querySnap.docs[0];
    const guestRef = doc(db, 'guests', guestDoc.id);

    return await runTransaction(db, async (transaction) => {
      const freshSnap = await transaction.get(guestRef);
      if (!freshSnap.exists()) {
        throw new Error('Guest record not found');
      }

      const gData = freshSnap.data();

      if (gData.invitationStatus === 'CHECKED_IN') {
        const attemptRef = doc(collection(db, 'checkinAttempts'));
        transaction.set(attemptRef, {
          eventId,
          guestId: freshSnap.id,
          token,
          result: 'ALREADY_CHECKED_IN',
          rejectionReason: `Already checked in at ${new Date(gData.checkedInAt).toLocaleTimeString()}`,
          employeeUid: employee?.uid || 'staff',
          timestamp: new Date().toISOString()
        });
        return { 
          success: false, 
          code: 'ALREADY_CHECKED_IN', 
          reason: `Already checked in at ${new Date(gData.checkedInAt).toLocaleTimeString()}`,
          originalCheckinTime: gData.checkedInAt,
          guest: { fullName: gData.fullName, company: gData.company }
        };
      }

      if (gData.invitationStatus === 'CANCELLED' || gData.invitationStatus === 'REVOKED') {
        return {
          success: false,
          code: 'CANCELLED_INVITATION',
          reason: 'Invitation cancelled by administrator',
          guest: { fullName: gData.fullName, company: gData.company }
        };
      }

      const checkinTime = new Date().toISOString();

      transaction.update(guestRef, {
        invitationStatus: 'CHECKED_IN',
        checkedInAt: checkinTime,
        checkedInBy: employee?.uid || 'staff',
        updatedAt: checkinTime
      });

      const checkinRef = doc(collection(db, 'checkins'));
      transaction.set(checkinRef, {
        eventId,
        guestId: freshSnap.id,
        guestName: gData.fullName,
        company: gData.company,
        token,
        result: 'SUCCESS',
        employeeUid: employee?.uid || 'staff',
        employeeName: employee?.displayName || 'Staff Member',
        timestamp: checkinTime
      });

      return {
        success: true,
        code: 'SUCCESS',
        guest: {
          id: freshSnap.id,
          fullName: gData.fullName,
          company: gData.company,
          email: gData.email,
          phone: gData.phone,
          companionLimit: gData.companionLimit || 0
        },
        checkinTime
      };
    });
  }
}

export const localDB = new LocalFirestoreEngine();

export function generateSecureToken() {
  const bytes = new Uint8Array(6);
  window.crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
  return `INV-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

// Attach Real-time onSnapshot listeners to Cloud Firestore
export function startCloudFirestoreSync() {
  if (!db) return;

  firestoreUnsubscribers.forEach(u => { try { u(); } catch(e){} });
  firestoreUnsubscribers = [];

  try {
    // 1. Sync Events
    const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
      const freshEvents = {};
      snap.forEach(d => {
        freshEvents[d.id] = { id: d.id, ...d.data() };
      });
      localDB.data.events = freshEvents;
      localDB.save();
    }, (err) => console.warn('Events sync error:', err));
    firestoreUnsubscribers.push(unsubEvents);

    // 2. Sync Guests
    const unsubGuests = onSnapshot(collection(db, 'guests'), (snap) => {
      const freshGuests = {};
      snap.forEach(d => {
        freshGuests[d.id] = { id: d.id, ...d.data() };
      });
      localDB.data.guests = freshGuests;
      localDB.save();
    }, (err) => console.warn('Guests sync error:', err));
    firestoreUnsubscribers.push(unsubGuests);

    // 3. Sync Checkins (Live Attendance)
    const unsubCheckins = onSnapshot(collection(db, 'checkins'), (snap) => {
      const freshCheckins = {};
      snap.forEach(d => {
        freshCheckins[d.id] = { id: d.id, ...d.data() };
      });
      localDB.data.checkins = freshCheckins;
      localDB.save();
    }, (err) => console.warn('Checkins sync error:', err));
    firestoreUnsubscribers.push(unsubCheckins);

    // 4. Sync Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const freshUsers = {};
      snap.forEach(d => {
        freshUsers[d.id] = { uid: d.id, ...d.data() };
      });
      localDB.data.users = freshUsers;
      localDB.save();
    }, (err) => console.warn('Users sync error:', err));
    firestoreUnsubscribers.push(unsubUsers);

    console.log('Real-time Cloud Firestore synchronization online for project:', BUILTIN_FIREBASE_CONFIG.projectId);
  } catch (e) {
    console.error('Failed to attach Cloud Firestore listeners:', e);
  }
}

// Automatically initialize real Firebase
export function initFirebase() {
  try {
    app = initializeApp(BUILTIN_FIREBASE_CONFIG);
    auth = getAuth(app);
    db = getFirestore(app);
    isRealFirebase = true;

    onAuthStateChanged(auth, (user) => {
      if (user) {
        startCloudFirestoreSync();
        updateStatusBadgeInDOM(true, BUILTIN_FIREBASE_CONFIG.projectId);
      } else {
        firestoreUnsubscribers.forEach(u => { try { u(); } catch(e){} });
        firestoreUnsubscribers = [];
        updateStatusBadgeInDOM(true, BUILTIN_FIREBASE_CONFIG.projectId);
      }
    });

    return { app, auth, db, isReal: true };
  } catch (e) {
    console.error('Failed to initialize Firebase with builtin config:', e);
    isRealFirebase = false;
    updateStatusBadgeInDOM(false);
    return { app: null, auth: null, db: null, isReal: false };
  }
}

function updateStatusBadgeInDOM(isOnline, projectId = '') {
  const dot = document.getElementById('firebase-status-dot');
  const text = document.getElementById('firebase-status-text');
  if (dot && text) {
    if (isOnline) {
      dot.style.background = '#10b981';
      dot.style.boxShadow = '0 0 8px #10b981';
      text.textContent = `Firebase: ${projectId}`;
    } else {
      dot.style.background = '#f59e0b';
      dot.style.boxShadow = 'none';
      text.textContent = 'Local Engine';
    }
  }
}

export function isUsingRealFirebase() {
  return isRealFirebase;
}

export function getFirebaseInstance() {
  return { app, auth, db, isReal: isRealFirebase };
}

export function getDatabase() {
  return { isReal: isRealFirebase, db, localDB };
}
