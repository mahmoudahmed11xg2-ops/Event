/**
 * Guest Management Service
 */

import { localDB, generateSecureToken, getFirebaseInstance } from '../firebase-config.js';
import { getSessionUser } from './auth.js';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

export function getGuestsForEvent(eventId, { search = '', status = 'ALL' } = {}) {
  let list = Object.values(localDB.data.guests).filter(g => g.eventId === eventId);

  if (status !== 'ALL') {
    list = list.filter(g => g.invitationStatus === status);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(g => 
      (g.fullName && g.fullName.toLowerCase().includes(q)) ||
      (g.company && g.company.toLowerCase().includes(q)) ||
      (g.email && g.email.toLowerCase().includes(q)) ||
      (g.token && g.token.toLowerCase().includes(q)) ||
      (g.phone && g.phone.toLowerCase().includes(q))
    );
  }

  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getGuestById(id) {
  return localDB.data.guests[id] || null;
}

export function addGuest({ eventId, fullName, company, email, phone, companionLimit = 0, notes = '' }) {
  const cleanName = (fullName || '').trim();
  const cleanCompany = (company || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPhone = (phone || '').trim();

  if (!cleanName) throw new Error('Guest full name is required.');
  if (!cleanCompany) throw new Error('Company / Organization is required.');

  // Check duplicate email in this event if provided
  if (cleanEmail) {
    const dup = Object.values(localDB.data.guests).find(g => 
      g.eventId === eventId && g.email && g.email.toLowerCase() === cleanEmail
    );
    if (dup) {
      console.warn('Duplicate email detected for event:', cleanEmail);
    }
  }

  const id = 'gst-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
  const token = generateSecureToken();
  const user = getSessionUser();

  const newGuest = {
    id,
    eventId,
    fullName: cleanName,
    company: cleanCompany,
    email: cleanEmail,
    phone: cleanPhone,
    invitationStatus: 'VALID',
    token,
    companionLimit: parseInt(companionLimit, 10) || 0,
    notes: (notes || '').trim(),
    checkedInAt: null,
    checkedInBy: null,
    createdAt: new Date().toISOString()
  };

  localDB.data.guests[id] = newGuest;

  localDB.data.auditLogs.unshift({
    id: 'aud-' + Date.now(),
    actorUid: user?.uid || 'admin',
    action: 'GUEST_CREATED',
    targetType: 'GUEST',
    targetId: id,
    eventId,
    timestamp: new Date().toISOString(),
    details: `Added guest ${cleanName} (${cleanCompany}) with token ${token}`
  });

  localDB.save();

  // Cloud Firestore Sync
  const { isReal, db } = getFirebaseInstance();
  if (isReal && db) {
    try {
      setDoc(doc(db, 'guests', id), newGuest).catch(e => console.warn('Firestore guest sync error:', e));
    } catch (e) {
      console.warn('Firestore guest sync error:', e);
    }
  }

  return newGuest;
}

export function updateGuest(id, updates) {
  const guest = localDB.data.guests[id];
  if (!guest) throw new Error('Guest not found.');

  Object.assign(guest, updates, { updatedAt: new Date().toISOString() });

  localDB.data.auditLogs.unshift({
    id: 'aud-' + Date.now(),
    actorUid: getSessionUser()?.uid || 'admin',
    action: 'GUEST_UPDATED',
    targetType: 'GUEST',
    targetId: id,
    eventId: guest.eventId,
    timestamp: new Date().toISOString(),
    details: `Updated details for ${guest.fullName}`
  });

  localDB.save();

  // Cloud Firestore Sync
  const { isReal, db } = getFirebaseInstance();
  if (isReal && db) {
    try {
      updateDoc(doc(db, 'guests', id), updates).catch(e => console.warn('Firestore guest update error:', e));
    } catch (e) {
      console.warn('Firestore guest update error:', e);
    }
  }

  return guest;
}

export function cancelInvitation(id, reason = 'Administrative cancellation') {
  const guest = localDB.data.guests[id];
  if (!guest) throw new Error('Guest not found.');

  guest.invitationStatus = 'CANCELLED';
  guest.updatedAt = new Date().toISOString();

  localDB.data.auditLogs.unshift({
    id: 'aud-' + Date.now(),
    actorUid: getSessionUser()?.uid || 'admin',
    action: 'INVITATION_CANCELLED',
    targetType: 'GUEST',
    targetId: id,
    eventId: guest.eventId,
    timestamp: new Date().toISOString(),
    details: `Cancelled invitation for ${guest.fullName}: ${reason}`
  });

  localDB.save();

  // Cloud Firestore Sync
  const { isReal, db } = getFirebaseInstance();
  if (isReal && db) {
    try {
      updateDoc(doc(db, 'guests', id), {
        invitationStatus: 'CANCELLED',
        updatedAt: guest.updatedAt
      }).catch(e => console.warn('Firestore cancel sync error:', e));
    } catch (e) {
      console.warn('Firestore cancel sync error:', e);
    }
  }

  return guest;
}

export function reissueInvitation(id) {
  const guest = localDB.data.guests[id];
  if (!guest) throw new Error('Guest not found.');

  const oldToken = guest.token;
  const newToken = generateSecureToken();

  guest.token = newToken;
  guest.invitationStatus = 'VALID';
  guest.checkedInAt = null;
  guest.checkedInBy = null;
  guest.updatedAt = new Date().toISOString();

  localDB.data.auditLogs.unshift({
    id: 'aud-' + Date.now(),
    actorUid: getSessionUser()?.uid || 'admin',
    action: 'INVITATION_REISSUED',
    targetType: 'GUEST',
    targetId: id,
    eventId: guest.eventId,
    timestamp: new Date().toISOString(),
    details: `Reissued invitation for ${guest.fullName}. Revoked: ${oldToken}, New Token: ${newToken}`
  });

  localDB.save();

  // Cloud Firestore Sync
  const { isReal, db } = getFirebaseInstance();
  if (isReal && db) {
    try {
      updateDoc(doc(db, 'guests', id), {
        token: newToken,
        invitationStatus: 'VALID',
        checkedInAt: null,
        checkedInBy: null,
        updatedAt: guest.updatedAt
      }).catch(e => console.warn('Firestore reissue sync error:', e));
    } catch (e) {
      console.warn('Firestore reissue sync error:', e);
    }
  }

  return guest;
}

export function exportGuestsCsv(eventId) {
  const guests = getGuestsForEvent(eventId);
  const headers = ['Full Name', 'Company', 'Email', 'Phone', 'Status', 'Token', 'Checked In At', 'Created At'];
  const rows = guests.map(g => [
    `"${(g.fullName || '').replace(/"/g, '""')}"`,
    `"${(g.company || '').replace(/"/g, '""')}"`,
    `"${(g.email || '').replace(/"/g, '""')}"`,
    `"${(g.phone || '').replace(/"/g, '""')}"`,
    `"${g.invitationStatus}"`,
    `"${g.token}"`,
    `"${g.checkedInAt ? new Date(g.checkedInAt).toLocaleString() : ''}"`,
    `"${new Date(g.createdAt).toLocaleString()}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `guests_event_${eventId}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
