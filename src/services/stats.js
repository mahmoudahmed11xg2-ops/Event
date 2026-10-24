/**
 * Real-Time Statistics & Attendance Reporting Service
 */

import { localDB } from '../firebase-config.js';
import { getGuestsForEvent } from './guests.js';

export function calculateEventStats(eventId) {
  if (!eventId) {
    return {
      totalGuests: 0,
      validInvitations: 0,
      checkedIn: 0,
      yetToArrive: 0,
      cancelled: 0,
      attendanceRate: 0
    };
  }

  if (localDB.applyCheckinsToGuests) {
    localDB.applyCheckinsToGuests();
  }

  const checkins = Object.values(localDB.data.checkins || {}).filter(c => (!eventId || c.eventId === eventId) && c && c.result === 'SUCCESS');
  const checkedInTokens = new Set(checkins.map(c => c.token ? String(c.token).trim().toUpperCase() : ''));
  const checkedInGuestIds = new Set(checkins.map(c => c.guestId ? String(c.guestId).trim() : ''));

  const allGuests = Object.values(localDB.data.guests).filter(g => g && g.eventId === eventId).map(g => {
    const isCancelled = g.invitationStatus === 'CANCELLED' || g.invitationStatus === 'REVOKED';
    if (isCancelled) return g;

    const cleanToken = g.token ? String(g.token).trim().toUpperCase() : '';
    const hasCheckin = g.invitationStatus === 'CHECKED_IN' || 
                       checkedInGuestIds.has(String(g.id).trim()) || 
                       (cleanToken && checkedInTokens.has(cleanToken));
    if (hasCheckin) {
      return { ...g, invitationStatus: 'CHECKED_IN' };
    }
    return g;
  });
  
  const totalGuests = allGuests.length;
  const checkedIn = allGuests.filter(g => g.invitationStatus === 'CHECKED_IN').length;
  const cancelled = allGuests.filter(g => g.invitationStatus === 'CANCELLED' || g.invitationStatus === 'REVOKED').length;
  const validInvitations = allGuests.filter(g => g.invitationStatus === 'VALID').length;
  
  // Eligible guests = all non-cancelled guests (checkedIn + valid yet to arrive)
  const eligibleGuests = checkedIn + validInvitations;
  const yetToArrive = validInvitations;

  const attendanceRate = eligibleGuests > 0 
    ? Math.round((checkedIn / eligibleGuests) * 100) 
    : 0;

  return {
    totalGuests,
    validInvitations,
    checkedIn,
    yetToArrive,
    cancelled,
    attendanceRate
  };
}

export function getRecentCheckins(eventId, limit = 10) {
  const checkins = Object.values(localDB.data.checkins)
    .filter(c => !eventId || c.eventId === eventId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  return checkins;
}

export function getCheckinHistory(eventId, { search = '', result = 'ALL' } = {}) {
  // Combine successful checkins and rejected attempts
  const successes = Object.values(localDB.data.checkins).map(c => ({
    id: c.id,
    eventId: c.eventId,
    guestName: c.guestName,
    company: c.company,
    token: c.token,
    result: 'SUCCESS',
    details: 'Entry authorized',
    employeeName: c.employeeName,
    employeeUid: c.employeeUid,
    timestamp: c.timestamp
  }));

  const attempts = (localDB.data.checkinAttempts || []).map(a => ({
    id: a.id,
    eventId: a.eventId,
    guestName: a.guest ? a.guest.fullName : 'Unknown Guest',
    company: a.guest ? a.guest.company : 'N/A',
    token: a.token,
    result: a.result,
    details: a.rejectionReason,
    employeeName: a.employeeUid || 'Staff',
    employeeUid: a.employeeUid,
    timestamp: a.timestamp
  }));

  let combined = [...successes, ...attempts];

  if (eventId) {
    combined = combined.filter(item => item.eventId === eventId);
  }

  if (result !== 'ALL') {
    combined = combined.filter(item => item.result === result);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    combined = combined.filter(item => 
      (item.guestName && item.guestName.toLowerCase().includes(q)) ||
      (item.company && item.company.toLowerCase().includes(q)) ||
      (item.token && item.token.toLowerCase().includes(q)) ||
      (item.details && item.details.toLowerCase().includes(q))
    );
  }

  return combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function exportHistoryCsv(eventId) {
  const history = getCheckinHistory(eventId);
  const headers = ['Timestamp', 'Result', 'Guest Name', 'Company', 'Token', 'Details / Reason', 'Staff'];
  const rows = history.map(h => [
    `"${new Date(h.timestamp).toLocaleString()}"`,
    `"${h.result}"`,
    `"${(h.guestName || '').replace(/"/g, '""')}"`,
    `"${(h.company || '').replace(/"/g, '""')}"`,
    `"${h.token}"`,
    `"${(h.details || '').replace(/"/g, '""')}"`,
    `"${(h.employeeName || h.employeeUid || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `checkin_history_${eventId || 'all'}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
}
