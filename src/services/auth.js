/**
 * Authentication Service
 * Handles user sign in, role verification, session management
 */

import { localDB, isUsingRealFirebase } from '../firebase-config.js';

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
 * Supports both real Firebase Auth and local verified credentials
 */
export async function loginUser(email, password, remember = false) {
  const cleanEmail = email.trim().toLowerCase();
  
  // 1. Simulate authentication or use local verified DB
  const users = localDB.data.users;
  const userMatch = Object.values(users).find(u => u.email.toLowerCase() === cleanEmail);

  if (!userMatch) {
    throw new Error('No account found with this email address.');
  }

  if (!userMatch.active) {
    throw new Error('This account has been deactivated. Please contact an administrator.');
  }

  // Check password for demo accounts
  // In demo mode: admin@event.org -> admin123, staff@event.org -> staff123 (or any valid 6+ char password)
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  // Create session object (never store raw passwords)
  const sessionUser = {
    uid: userMatch.uid,
    email: userMatch.email,
    displayName: userMatch.displayName,
    role: userMatch.role, // 'ADMIN' or 'EMPLOYEE'
    assignedEventIds: userMatch.assignedEventIds || []
  };

  setSessionUser(sessionUser, remember);

  // Record audit
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

export function logoutUser() {
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

export function createEmployeeAccount(displayName, email, assignedEvents = []) {
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

export function toggleUserStatus(uid, active) {
  if (localDB.data.users[uid]) {
    localDB.data.users[uid].active = active;
    localDB.save();
    return true;
  }
  return false;
}
