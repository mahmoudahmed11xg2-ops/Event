/**
 * Excel / CSV Import Parser & Batch Processor
 * Uses SheetJS to validate, preview, and batch-import guests
 */

import * as XLSXModule from 'xlsx';
import { addGuest, getGuestsForEvent } from './guests.js';

function getXLSX() {
  return window.XLSX || XLSXModule;
}

export function parseSpreadsheetFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file selected.'));
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return reject(new Error('File size exceeds 5MB limit.'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const xlsxLib = getXLSX();
        const workbook = xlsxLib.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON array of objects
        const rawRows = xlsxLib.utils.sheet_to_json(worksheet, { defval: '' });
        if (!rawRows || rawRows.length === 0) {
          return reject(new Error('The spreadsheet is empty or has no data rows.'));
        }

        resolve(rawRows);
      } catch (err) {
        reject(new Error('Failed to read spreadsheet file: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Flexible column matching supporting English and Arabic headers
 */
export function normalizeGuestRow(row) {
  const keys = Object.keys(row);
  const findValue = (possibleHeaders) => {
    const matchedKey = keys.find(k => {
      const clean = k.trim().toLowerCase();
      return possibleHeaders.some(h => clean === h.toLowerCase() || clean.includes(h.toLowerCase()));
    });
    return matchedKey ? String(row[matchedKey]).trim() : '';
  };

  const fullName = findValue(['full name', 'fullname', 'name', 'guest name', 'الاسم', 'اسم الضيف', 'الاسم الكامل']);
  const company = findValue(['company', 'organization', 'org', 'entity', 'الجهة', 'الشركة', 'المؤسسة']);
  const email = findValue(['email', 'e-mail', 'mail', 'البريد', 'البريد الإلكتروني']);
  const phone = findValue(['phone', 'mobile', 'tel', 'cell', 'الهاتف', 'الجوال', 'رقم الهاتف']);
  const companionsStr = findValue(['companion', 'companions', 'plus one', 'limit', 'المرافقين', 'عدد المرافقين']);
  const notes = findValue(['notes', 'note', 'comment', 'ملاحظات', 'ملاحظة']);

  const companionLimit = parseInt(companionsStr, 10) || 0;

  return {
    raw: row,
    fullName,
    company,
    email: email.toLowerCase(),
    phone,
    companionLimit,
    notes
  };
}

/**
 * Validate records against current event database
 */
export function validateImportBatch(rawRows, eventId) {
  const existingGuests = getGuestsForEvent(eventId);
  const existingEmails = new Set(existingGuests.filter(g => g.email).map(g => g.email.toLowerCase()));
  const existingNames = new Set(existingGuests.map(g => g.fullName.toLowerCase()));

  const validRows = [];
  const duplicateRows = [];
  const invalidRows = [];

  const seenInSheetEmails = new Set();
  const seenInSheetNames = new Set();

  rawRows.forEach((row, index) => {
    const item = normalizeGuestRow(row);
    item.rowNumber = index + 2; // account for header line

    if (!item.fullName || !item.company) {
      invalidRows.push({
        ...item,
        reason: !item.fullName ? 'Missing Full Name' : 'Missing Company'
      });
      return;
    }

    // Check duplicate in sheet or database
    let isDup = false;
    let dupReason = '';

    if (item.email) {
      if (existingEmails.has(item.email)) {
        isDup = true;
        dupReason = `Email (${item.email}) already registered in this event`;
      } else if (seenInSheetEmails.has(item.email)) {
        isDup = true;
        dupReason = `Duplicate email (${item.email}) repeated in spreadsheet`;
      }
      seenInSheetEmails.add(item.email);
    }

    if (!isDup && existingNames.has(item.fullName.toLowerCase())) {
      isDup = true;
      dupReason = `Guest with name "${item.fullName}" already exists in this event`;
    }

    seenInSheetNames.add(item.fullName.toLowerCase());

    if (isDup) {
      duplicateRows.push({ ...item, reason: dupReason });
    } else {
      validRows.push(item);
    }
  });

  return { validRows, duplicateRows, invalidRows };
}

/**
 * Execute batch import with progress callback
 */
export async function executeBatchImport(validRows, eventId, onProgress) {
  const total = validRows.length;
  let importedCount = 0;
  const errors = [];

  for (let i = 0; i < total; i++) {
    const item = validRows[i];
    try {
      addGuest({
        eventId,
        fullName: item.fullName,
        company: item.company,
        email: item.email,
        phone: item.phone,
        companionLimit: item.companionLimit,
        notes: item.notes
      });
      importedCount++;
    } catch (e) {
      errors.push({ row: item.rowNumber, name: item.fullName, error: e.message });
    }

    if (onProgress) {
      onProgress(importedCount, total);
    }

    // slight yield to UI thread
    if (i % 20 === 0) {
      await new Promise(r => setTimeout(r, 10));
    }
  }

  return { importedCount, total, errors };
}

/**
 * Download CSV error report
 */
export function downloadErrorReport(invalidAndDuplicateRows) {
  const headers = ['Row Number', 'Full Name', 'Company', 'Email', 'Issue / Reason'];
  const rows = invalidAndDuplicateRows.map(r => [
    r.rowNumber || '',
    `"${(r.fullName || '').replace(/"/g, '""')}"`,
    `"${(r.company || '').replace(/"/g, '""')}"`,
    `"${(r.email || '').replace(/"/g, '""')}"`,
    `"${(r.reason || '').replace(/"/g, '""')}"`
  ]);

  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `import_errors_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
}
