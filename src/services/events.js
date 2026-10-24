/**
 * Event Management Service
 */

import { localDB, getFirebaseInstance } from '../firebase-config.js';
import { getSessionUser } from './auth.js';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

const STORAGE_ACTIVE_EVENT_KEY = 'ems_active_event_id';

export function getAllEvents() {
  return Object.values(localDB.data.events).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getEventById(id) {
  return localDB.data.events[id] || null;
}

export function getActiveEventId() {
  const saved = localStorage.getItem(STORAGE_ACTIVE_EVENT_KEY);
  if (saved && localDB.data.events[saved]) {
    return saved;
  }
  // Default to first active or first event
  const events = getAllEvents();
  const active = events.find(e => e.status === 'Active') || events[0];
  return active ? active.id : null;
}

export function setActiveEventId(id) {
  if (localDB.data.events[id]) {
    localStorage.setItem(STORAGE_ACTIVE_EVENT_KEY, id);
    window.dispatchEvent(new CustomEvent('activeEventChanged', { detail: { eventId: id } }));
    return true;
  }
  return false;
}

export function getActiveEvent() {
  const id = getActiveEventId();
  return id ? getEventById(id) : null;
}

export async function createEvent({ name, description, venue, startAt, endAt, timeZone, status = 'Active' }) {
  const cleanName = (name || '').trim();
  const cleanVenue = (venue || '').trim();
  if (!cleanName) throw new Error('يرجى إدخال اسم الفعالية.');
  if (!cleanVenue) throw new Error('يرجى إدخال مكان الفعالية.');

  const id = 'evt-' + Date.now();
  const user = getSessionUser();
  
  const newEvent = {
    id,
    name: cleanName,
    description: (description || '').trim(),
    venue: cleanVenue,
    startAt: startAt || new Date().toISOString(),
    endAt: endAt || new Date(Date.now() + 86400000).toISOString(),
    timeZone: timeZone || 'UTC+3 (Riyadh / Dubai)',
    status: status || 'Active',
    createdAt: new Date().toISOString(),
    createdBy: user?.uid || 'admin'
  };

  // Cloud Firestore Sync
  const { isReal, db, auth } = getFirebaseInstance();
  if (isReal && db) {
    if (!auth || !auth.currentUser) {
      throw new Error('يجب تسجيل الدخول بحساب الأدمن أولاً ليتم حفظ الفعالية على سيرفر Firebase.');
    }
    try {
      await setDoc(doc(db, 'events', id), newEvent);
    } catch (e) {
      console.error('Firestore event sync error:', e);
      if (e.code === 'permission-denied') {
        throw new Error('تم رفض الحفظ من سيرفر Firebase (Permission Denied).\nالسبب: قواعد الأمان (Firestore Rules) تشترط أن يكون حسابك مفعل كـ ADMIN ولديه active: true. يرجى التأكد من الـ Rules وتحديثها لتشمل status == "true".');
      }
      throw new Error('فشل الحفظ على سيرفر Firebase: ' + (e.message || e));
    }
  }

  localDB.data.events[id] = newEvent;
  
  // Set as active if none was set or if status is Active
  if (!getActiveEventId() || status === 'Active') {
    setActiveEventId(id);
  }

  localDB.data.auditLogs.unshift({
    id: 'aud-' + Date.now(),
    actorUid: user?.uid || 'admin',
    action: 'EVENT_CREATED',
    targetType: 'EVENT',
    targetId: id,
    timestamp: new Date().toISOString(),
    details: `Created new event: ${newEvent.name}`
  });

  localDB.save();
  return newEvent;
}

export async function updateEvent(id, updates) {
  const event = localDB.data.events[id];
  if (!event) throw new Error('Event not found.');

  const cleanUpdates = { ...updates, updatedAt: new Date().toISOString() };
  Object.assign(event, cleanUpdates);

  // Cloud Firestore Sync
  const { isReal, db, auth } = getFirebaseInstance();
  if (isReal && db) {
    if (!auth || !auth.currentUser) {
      throw new Error('يجب تسجيل الدخول بحساب الأدمن أولاً.');
    }
    try {
      await updateDoc(doc(db, 'events', id), cleanUpdates);
    } catch (e) {
      console.error('Firestore event update error:', e);
      if (e.code === 'permission-denied') {
        throw new Error('تم رفض التعديل من Firebase (Permission Denied). يرجى التحقق من صلاحيات الأدمن وقواعد Firestore.');
      }
      throw new Error('فشل التعديل على سيرفر Firebase: ' + (e.message || e));
    }
  }

  localDB.data.auditLogs.unshift({
    id: 'aud-' + Date.now(),
    actorUid: getSessionUser()?.uid || 'admin',
    action: 'EVENT_UPDATED',
    targetType: 'EVENT',
    targetId: id,
    timestamp: new Date().toISOString(),
    details: `Updated event: ${event.name}`
  });

  localDB.save();
  return event;
}
