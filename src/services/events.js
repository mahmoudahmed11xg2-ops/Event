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

export function createEvent({ name, description, venue, startAt, endAt, timeZone, status = 'Active' }) {
  const id = 'evt-' + Date.now();
  const user = getSessionUser();
  
  const newEvent = {
    id,
    name: name.trim(),
    description: (description || '').trim(),
    venue: venue.trim(),
    startAt,
    endAt,
    timeZone: timeZone || 'UTC+3 (Riyadh / Dubai)',
    status: status || 'Active',
    createdAt: new Date().toISOString(),
    createdBy: user?.uid || 'admin'
  };

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

  // Cloud Firestore Sync
  const { isReal, db } = getFirebaseInstance();
  if (isReal && db) {
    try {
      setDoc(doc(db, 'events', id), newEvent).catch(e => console.warn('Firestore event sync error:', e));
    } catch (e) {
      console.warn('Firestore event sync error:', e);
    }
  }

  return newEvent;
}

export function updateEvent(id, updates) {
  const event = localDB.data.events[id];
  if (!event) throw new Error('Event not found.');

  Object.assign(event, updates, { updatedAt: new Date().toISOString() });

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

  // Cloud Firestore Sync
  const { isReal, db } = getFirebaseInstance();
  if (isReal && db) {
    try {
      updateDoc(doc(db, 'events', id), updates).catch(e => console.warn('Firestore event update error:', e));
    } catch (e) {
      console.warn('Firestore event update error:', e);
    }
  }

  return event;
}
