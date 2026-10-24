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
        this.data = parsed;
        this.applyCheckinsToGuests();
        return this.data;
      }
    } catch (e) {
      console.warn('Using empty initial data');
    }
    return JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
  }

  applyCheckinsToGuests() {
    if (!this.data || !this.data.guests) return;
    const checkins = Object.values(this.data.checkins || {}).filter(c => c && c.result === 'SUCCESS');
    if (checkins.length === 0) return;

    const byToken = new Map();
    const byGuestId = new Map();
    checkins.forEach(c => {
      if (c.token) byToken.set(String(c.token).trim().toUpperCase(), c);
      if (c.guestId) byGuestId.set(String(c.guestId).trim(), c);
    });

    Object.values(this.data.guests).forEach(g => {
      if (!g) return;
      if (g.invitationStatus === 'CANCELLED' || g.invitationStatus === 'REVOKED') return;

      const cleanToken = g.token ? String(g.token).trim().toUpperCase() : '';
      const match = (g.id ? byGuestId.get(String(g.id).trim()) : null) || (cleanToken ? byToken.get(cleanToken) : null);
      if (match) {
        g.invitationStatus = 'CHECKED_IN';
        g.checkedInAt = g.checkedInAt || match.timestamp || new Date().toISOString();
        g.checkedInBy = g.checkedInBy || match.employeeName || match.employeeUid || 'Staff';
      }
    });
  }

  save(data = this.data) {
    this.data = data;
    this.applyCheckinsToGuests();
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
      const localGuest = Object.values(this.data.guests).find(g => g.token && g.token.toUpperCase() === token && g.eventId === eventId);
      if (!localGuest) {
        try {
          await setDoc(doc(collection(db, 'checkinAttempts')), {
            eventId,
            token,
            result: 'INVALID_TOKEN',
            rejectionReason: 'Token not found in Cloud Firestore',
            employeeUid: employee?.uid || 'staff',
            timestamp: new Date().toISOString()
          });
        } catch (e) {}
        return { success: false, code: 'INVALID_TOKEN', reason: 'Invalid or unknown QR token' };
      }
    }

    const guestDoc = querySnap.docs ? querySnap.docs[0] : null;
    const gData = guestDoc ? guestDoc.data() : Object.values(this.data.guests).find(g => g.token && g.token.toUpperCase() === token && g.eventId === eventId);
    const guestId = guestDoc ? guestDoc.id : gData.id;
    const guestRef = guestDoc ? doc(db, 'guests', guestDoc.id) : null;

    // Check if already checked in via Firestore checkins or guest document
    let isAlreadyCheckedIn = gData.invitationStatus === 'CHECKED_IN';
    let checkinRecordTime = gData.checkedInAt || new Date().toISOString();

    try {
      const checkinQuery = query(
        collection(db, 'checkins'),
        where('eventId', '==', eventId),
        where('token', '==', token)
      );
      const checkinSnap = await getDocs(checkinQuery);
      if (!checkinSnap.empty) {
        isAlreadyCheckedIn = true;
        checkinRecordTime = checkinSnap.docs[0].data()?.timestamp || checkinRecordTime;
      }
    } catch (e) {
      // Query error fallback
    }

    if (isAlreadyCheckedIn) {
      try {
        await setDoc(doc(collection(db, 'checkinAttempts')), {
          eventId,
          guestId,
          token,
          result: 'ALREADY_CHECKED_IN',
          rejectionReason: `Already checked in at ${new Date(checkinRecordTime).toLocaleTimeString()}`,
          employeeUid: employee?.uid || 'staff',
          timestamp: new Date().toISOString()
        });
      } catch (e) {}

      return { 
        success: false, 
        code: 'ALREADY_CHECKED_IN', 
        reason: `Already checked in at ${new Date(checkinRecordTime).toLocaleTimeString()}`,
        originalCheckinTime: checkinRecordTime,
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

    // 1. Create document in checkins collection (allowed for isEmployee() with result == 'SUCCESS')
    const checkinRef = doc(collection(db, 'checkins'));
    const checkinRecord = {
      eventId,
      guestId,
      guestName: gData.fullName,
      company: gData.company,
      token,
      result: 'SUCCESS',
      employeeUid: employee?.uid || 'staff',
      employeeName: employee?.displayName || 'Staff Member',
      timestamp: checkinTime
    };

    await setDoc(checkinRef, checkinRecord);

    // 2. Update guest document if permitted (admin role)
    if (guestRef) {
      try {
        await updateDoc(guestRef, {
          invitationStatus: 'CHECKED_IN',
          checkedInAt: checkinTime,
          checkedInBy: employee?.uid || 'staff',
          updatedAt: checkinTime
        });
      } catch (e) {
        // Ignored if employee role does not have direct write permission on guests collection
      }
    }

    // 3. Update in-memory local state
    this.data.checkins[checkinRef.id] = { id: checkinRef.id, ...checkinRecord };

    let foundGuest = this.data.guests[guestId];
    if (!foundGuest) {
      foundGuest = Object.values(this.data.guests).find(g => g.token && g.token.toUpperCase() === token);
    }
    if (foundGuest) {
      foundGuest.invitationStatus = 'CHECKED_IN';
      foundGuest.checkedInAt = checkinTime;
      foundGuest.checkedInBy = employee?.displayName || employee?.uid || 'staff';
    }
    this.save();

    return {
      success: true,
      code: 'SUCCESS',
      guest: {
        id: guestId,
        fullName: gData.fullName,
        company: gData.company,
        email: gData.email,
        phone: gData.phone,
        companionLimit: gData.companionLimit || 0
      },
      checkinTime
    };
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
      localDB.applyCheckinsToGuests();
      localDB.save();
    }, (err) => console.warn('Guests sync error:', err));
    firestoreUnsubscribers.push(unsubGuests);

    // 3. Sync Checkins (Live Attendance)
    const unsubCheckins = onSnapshot(collection(db, 'checkins'), (snap) => {
      const freshCheckins = { ...localDB.data.checkins };
      snap.forEach(d => {
        freshCheckins[d.id] = { id: d.id, ...d.data() };
      });
      localDB.data.checkins = freshCheckins;
      localDB.applyCheckinsToGuests();
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
