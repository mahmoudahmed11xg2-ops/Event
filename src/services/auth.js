/**
 * Authentication Service
 * Handles user sign in, role verification, session management
 * Integrates real Firebase Authentication & Firestore role profiles
 */

import { localDB, getFirebaseInstance } from '../firebase-config.js';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

let currentUser = null;
const SESSION_KEY = 'ems_active_session';

export function getSessionUser() {
  if (currentUser) return currentUser;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (raw) {
      currentUser = JSON.parse(raw);
    }
  } catch (e) {
    currentUser = null;
  }
  return currentUser;
}

export function setSessionUser(user, remember = false) {
  currentUser = user;
  if (user) {
    const data = JSON.stringify(user);
    sessionStorage.setItem(SESSION_KEY, data);
    if (remember) {
      localStorage.setItem(SESSION_KEY, data);
    }
  } else {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  }
  window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user } }));
}

/**
 * Sign in with email and password
 * Authenticates against real Firebase Auth when configured, or verifies against registered credentials
 */
export async function loginUser(email, password, remember = false) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !password) {
    throw new Error('Please enter both email address and password.');
  }

  const { isReal, auth, db } = getFirebaseInstance();

  // 1. REAL FIREBASE AUTHENTICATION FLOW
  if (isReal && auth) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;

      // Query or fetch user role profile from Cloud Firestore: /users/{uid}
      let role = 'ADMIN';
      let displayName = fbUser.displayName || fbUser.email.split('@')[0];
      let assignedEventIds = [];
      let active = true;

      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const uData = userDocSnap.data();
          role = uData.role || 'EMPLOYEE';
          displayName = uData.displayName || displayName;
          assignedEventIds = uData.assignedEventIds || [];
          active = uData.active !== false;

          if (!active) {
            await signOut(auth);
            throw new Error('This account has been deactivated. Please contact an administrator.');
          }
        } else {
          // Initialize user document in Firestore for first authenticated administrator
          await setDoc(userDocRef, {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName,
            role: 'ADMIN',
            active: true,
            createdAt: new Date().toISOString()
          });
        }
      } catch (firestoreErr) {
        console.warn('Could not read user profile from Firestore:', firestoreErr);
      }

      const sessionUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName,
        role,
        assignedEventIds
      };

      setSessionUser(sessionUser, remember);
      return sessionUser;
    } catch (fbAuthErr) {
      console.error('Firebase Auth Error:', fbAuthErr);
      if (fbAuthErr.code === 'auth/invalid-credential' || fbAuthErr.code === 'auth/wrong-password' || fbAuthErr.code === 'auth/user-not-found') {
        throw new Error('Incorrect email address or password.');
      } else if (fbAuthErr.code === 'auth/invalid-email') {
        throw new Error('Invalid email address format.');
      } else if (fbAuthErr.code === 'auth/user-disabled') {
        throw new Error('This user account has been disabled in Firebase.');
      }
      throw new Error(fbAuthErr.message || 'Authentication failed.');
    }
  }

  // 2. LOCAL VERIFIED STORE
  const users = localDB.data.users;
  const userMatch = Object.values(users).find(u => u.email.toLowerCase() === cleanEmail);

  if (!userMatch) {
    throw new Error('No registered account found with this email. Please check your credentials or connect Firebase.');
  }

  if (!userMatch.active) {
    throw new Error('This account has been deactivated. Please contact an administrator.');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const sessionUser = {
    uid: userMatch.uid,
    email: userMatch.email,
    displayName: userMatch.displayName,
    role: userMatch.role,
    assignedEventIds: userMatch.assignedEventIds || []
  };

  setSessionUser(sessionUser, remember);

  localDB.data.auditLogs.unshift({
    id: 'aud-' + Date.now(),
    actorUid: sessionUser.uid,
    action: 'USER_LOGIN',
    targetType: 'AUTH',
    targetId: sessionUser.uid,
    timestamp: new Date().toISOString(),
    details: `User ${sessionUser.email} logged in with role ${sessionUser.role}`
  });
  localDB.save();

  return sessionUser;
}

export async function logoutUser() {
  const { isReal, auth } = getFirebaseInstance();
  if (isReal && auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
  }

  const user = getSessionUser();
  if (user) {
    localDB.data.auditLogs.unshift({
      id: 'aud-' + Date.now(),
      actorUid: user.uid,
      action: 'USER_LOGOUT',
      targetType: 'AUTH',
      targetId: user.uid,
      timestamp: new Date().toISOString(),
      details: `User ${user.email} signed out.`
    });
    localDB.save();
  }
  setSessionUser(null);
}

export async function createEmployeeAccount(displayName, email, assignedEvents = []) {
  const cleanEmail = email.trim().toLowerCase();
  const existing = Object.values(localDB.data.users).find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error('A staff user with this email already exists.');
  }

  const uid = 'emp-' + Date.now();
  const newStaff = {
    uid,
    email: cleanEmail,
    displayName: displayName.trim(),
    role: 'EMPLOYEE',
    active: true,
    assignedEventIds: assignedEvents,
    createdAt: new Date().toISOString()
  };

  localDB.data.users[uid] = newStaff;

  const { isReal, db } = getFirebaseInstance();
  if (isReal && db) {
    try {
      await setDoc(doc(db, 'users', uid), newStaff);
    } catch (e) {
      console.warn('Error saving employee to Cloud Firestore:', e);
    }
  }

  localDB.data.auditLogs.unshift({
    id: 'aud-' + Date.now(),
    actorUid: getSessionUser()?.uid || 'admin',
    action: 'EMPLOYEE_CREATED',
    targetType: 'USER',
    targetId: uid,
    timestamp: new Date().toISOString(),
    details: `Created employee ${displayName} (${cleanEmail})`
  });
  localDB.save();
  return newStaff;
}

export async function toggleUserStatus(uid, active) {
  if (localDB.data.users[uid]) {
    localDB.data.users[uid].active = active;

    const { isReal, db } = getFirebaseInstance();
    if (isReal && db) {
      try {
        await setDoc(doc(db, 'users', uid), { active }, { merge: true });
      } catch (e) {
        console.warn('Error updating user status in Firestore:', e);
      }
    }

    localDB.save();
    return true;
  }
  return false;
}
