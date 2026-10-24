/**
 * Guest Management Service
 */

import { localDB, generateSecureToken, getFirebaseInstance } from '../firebase-config.js';
import { getSessionUser } from './auth.js';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

export function getGuestsForEvent(eventId, { search = '', status = 'ALL' } = {}) {
  if (localDB.applyCheckinsToGuests) {
    localDB.applyCheckinsToGuests();
  }

  const checkins = Object.values(localDB.data.checkins || {}).filter(c => c && c.result === 'SUCCESS');
  const checkedInTokens = new Set(checkins.map(c => c.token ? String(c.token).trim().toUpperCase() : ''));
  const checkedInGuestIds = new Set(checkins.map(c => c.guestId ? String(c.guestId).trim() : ''));

  let list = Object.values(localDB.data.guests).filter(g => g && g.eventId === eventId).map(g => {
    const isCancelled = g.invitationStatus === 'CANCELLED' || g.invitationStatus === 'REVOKED';
    if (isCancelled) return g;

    const cleanToken = g.token ? String(g.token).trim().toUpperCase() : '';
    const hasCheckin = g.invitationStatus === 'CHECKED_IN' || 
                       checkedInGuestIds.has(String(g.id).trim()) || 
                       (cleanToken && checkedInTokens.has(cleanToken));

    if (hasCheckin) {
      const match = checkins.find(c => c.guestId === g.id || (cleanToken && c.token && String(c.token).trim().toUpperCase() === cleanToken));
      return {
        ...g,
        invitationStatus: 'CHECKED_IN',
        checkedInAt: g.checkedInAt || match?.timestamp || new Date().toISOString(),
        checkedInBy: g.checkedInBy || match?.employeeName || match?.employeeUid || 'Staff'
      };
    }
    return g;
  });

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

export async function addGuest({ eventId, fullName, company, email, phone, companionLimit = 0, notes = '' }) {
  const cleanName = (fullName || '').trim();
  const cleanCompany = (company || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPhone = (phone || '').trim();

  if (!cleanName) throw new Error('يرجى إدخال اسم الضيف.');
  if (!cleanCompany) throw new Error('يرجى إدخال الشركة / الجهة.');

  const id = 'gst-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
  const token = generateSecureToken();
  const user = getSessionUser();

  const newGuest = {
    id,
    eventId,
    fullName: cleanName,
    company: cleanCompany,
    email: cleanEmail || '',
    phone: cleanPhone || '',
    invitationStatus: 'VALID',
    token,
    companionLimit: parseInt(companionLimit, 10) || 0,
    notes: (notes || '').trim(),
    checkedInAt: null,
    checkedInBy: null,
    createdAt: new Date().toISOString()
  };

  // Cloud Firestore Sync
  const { isReal, db, auth } = getFirebaseInstance();
  if (isReal && db) {
    if (!auth || !auth.currentUser) {
      throw new Error('يجب تسجيل الدخول أولاً لتتمكن من إضافة الضيوف إلى سيرفر Firebase.');
    }
    try {
      await setDoc(doc(db, 'guests', id), newGuest);
    } catch (e) {
      console.error('Firestore guest sync error:', e);
      if (e.code === 'permission-denied') {
        throw new Error('تم رفض إضافة الضيف من Firebase (Permission Denied). يرجى التأكد من قواعد Firestore Rules وصلاحيات الأدمن.');
      }
      throw new Error('فشل حفظ الضيف في Firebase: ' + (e.message || e));
    }
  }

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
  return newGuest;
}

export async function updateGuest(id, updates) {
  const guest = localDB.data.guests[id];
  if (!guest) throw new Error('Guest not found.');

  const cleanUpdates = { ...updates, updatedAt: new Date().toISOString() };
  Object.assign(guest, cleanUpdates);

  // Cloud Firestore Sync
  const { isReal, db, auth } = getFirebaseInstance();
  if (isReal && db) {
    if (!auth || !auth.currentUser) throw new Error('يجب تسجيل الدخول أولاً.');
    try {
      await updateDoc(doc(db, 'guests', id), cleanUpdates);
    } catch (e) {
      console.error('Firestore guest update error:', e);
      if (e.code === 'permission-denied') {
        throw new Error('تم رفض تعديل الضيف من Firebase (Permission Denied).');
      }
      throw new Error('فشل التعديل على سيرفر Firebase: ' + (e.message || e));
    }
  }

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
  return guest;
}

export async function cancelInvitation(id, reason = 'Administrative cancellation') {
  const guest = localDB.data.guests[id];
  if (!guest) throw new Error('Guest not found.');

  guest.invitationStatus = 'CANCELLED';
  guest.updatedAt = new Date().toISOString();

  // Cloud Firestore Sync
  const { isReal, db, auth } = getFirebaseInstance();
  if (isReal && db) {
    if (!auth || !auth.currentUser) throw new Error('يجب تسجيل الدخول أولاً.');
    try {
      await updateDoc(doc(db, 'guests', id), {
        invitationStatus: 'CANCELLED',
        updatedAt: guest.updatedAt
      });
    } catch (e) {
      console.error('Firestore cancel sync error:', e);
      if (e.code === 'permission-denied') {
        throw new Error('تم رفض إلغاء الدعوة من Firebase (Permission Denied).');
      }
      throw new Error('فشل إلغاء الدعوة في Firebase: ' + (e.message || e));
    }
  }

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
  return guest;
}

export async function reissueInvitation(id) {
  const guest = localDB.data.guests[id];
  if (!guest) throw new Error('Guest not found.');

  const oldToken = guest.token;
  const newToken = generateSecureToken();

  guest.token = newToken;
  guest.invitationStatus = 'VALID';
  guest.checkedInAt = null;
  guest.checkedInBy = null;
  guest.updatedAt = new Date().toISOString();

  // Cloud Firestore Sync
  const { isReal, db, auth } = getFirebaseInstance();
  if (isReal && db) {
    if (!auth || !auth.currentUser) throw new Error('يجب تسجيل الدخول أولاً.');
    try {
      await updateDoc(doc(db, 'guests', id), {
        token: newToken,
        invitationStatus: 'VALID',
        checkedInAt: null,
        checkedInBy: null,
        updatedAt: guest.updatedAt
      });
    } catch (e) {
      console.error('Firestore reissue sync error:', e);
      if (e.code === 'permission-denied') {
        throw new Error('تم رفض إعادة إصدار الدعوة من Firebase (Permission Denied).');
      }
      throw new Error('فشل إعادة الإصدار في Firebase: ' + (e.message || e));
    }
  }

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
