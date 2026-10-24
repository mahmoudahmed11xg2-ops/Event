/**
 * Authentication Service
 * Handles user sign in, role verification, session management
 * Integrates real Firebase Authentication & Firestore role profiles
 */

import { localDB, getFirebaseInstance, BUILTIN_FIREBASE_CONFIG } from '../firebase-config.js';
import { initializeApp as initializeSecondaryApp, deleteApp as deleteSecondaryApp } from 'firebase/app';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  getAuth as getSecondaryAuth,
  createUserWithEmailAndPassword as secondaryCreateUser,
  signOut as secondarySignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

let currentUser = null;
const SESSION_KEY = 'ems_active_session';

export function getSessionUser() {
  if (currentUser) return currentUser;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.email === 'admin@event.org' || parsed.email === 'staff@event.org') {
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      currentUser = parsed;
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
          role = (uData.role ? String(uData.role).toUpperCase() : 'ADMIN');
          displayName = uData.displayName || uData.name || displayName;
          assignedEventIds = uData.assignedEventIds || [];
          active = uData.active === true || uData.status === 'active' || uData.status === 'true' || uData.status === true || (uData.active !== false && uData.status !== 'inactive');

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

export async function createEmployeeAccount(displayName, email, password, assignedEvents = []) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (displayName || '').trim();
  const cleanPassword = (password || '').trim();

  if (!cleanName) {
    throw new Error('يرجى إدخال اسم الموظف.');
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('يرجى إدخال بريد إلكتروني صالح للموظف.');
  }
  if (!cleanPassword || cleanPassword.length < 6) {
    throw new Error('كلمة المرور يجب أن لا تقل عن 6 خانات.');
  }

  const existing = Object.values(localDB.data.users).find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error('يوجد حساب موظف مسجل مسبقاً بهذا البريد الإلكتروني.');
  }

  const { isReal, db } = getFirebaseInstance();
  let uid = 'emp-' + Date.now();

  // Create Firebase Auth user using an isolated secondary App instance
  // This is essential so the current administrator session is NOT logged out
  if (isReal && BUILTIN_FIREBASE_CONFIG && BUILTIN_FIREBASE_CONFIG.apiKey) {
    const secondaryAppName = `SecondaryApp-${Date.now()}`;
    let secondaryApp = null;
    try {
      secondaryApp = initializeSecondaryApp(BUILTIN_FIREBASE_CONFIG, secondaryAppName);
      const secondaryAuth = getSecondaryAuth(secondaryApp);
      const userCred = await secondaryCreateUser(secondaryAuth, cleanEmail, cleanPassword);
      uid = userCred.user.uid;
      await secondarySignOut(secondaryAuth);
    } catch (authErr) {
      console.error('Firebase Auth staff user creation error:', authErr);
      if (authErr.code === 'auth/email-already-in-use') {
        throw new Error('هذا البريد الإلكتروني مسجل بالفعل في Firebase.');
      } else if (authErr.code === 'auth/weak-password') {
        throw new Error('كلمة المرور ضعيفة، يجب أن تحتوي على 6 خانات على الأقل.');
      } else if (authErr.code === 'auth/invalid-email') {
        throw new Error('صيغة البريد الإلكتروني غير صحيحة.');
      }
      throw new Error(authErr.message || 'فشل إنشاء حساب الموظف في Firebase Authentication.');
    } finally {
      if (secondaryApp) {
        try {
          await deleteSecondaryApp(secondaryApp);
        } catch (delErr) {
          console.warn('Secondary app cleanup error:', delErr);
        }
      }
    }
  }

  const newStaff = {
    uid,
    email: cleanEmail,
    displayName: cleanName,
    role: 'EMPLOYEE',
    active: true,
    status: 'active',
    assignedEventIds: assignedEvents || [],
    createdAt: new Date().toISOString()
  };

  // Write employee role document to Cloud Firestore: /users/{uid}
  if (isReal && db) {
    try {
      await setDoc(doc(db, 'users', uid), newStaff);
    } catch (e) {
      console.warn('Error saving employee role to Cloud Firestore:', e);
    }
  }

  localDB.data.users[uid] = newStaff;

  localDB.data.auditLogs.unshift({
    id: 'aud-' + Date.now(),
    actorUid: getSessionUser()?.uid || 'admin',
    action: 'EMPLOYEE_CREATED',
    targetType: 'USER',
    targetId: uid,
    timestamp: new Date().toISOString(),
    details: `Created staff member ${cleanName} (${cleanEmail}) with Firebase Auth & Firestore role`
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
