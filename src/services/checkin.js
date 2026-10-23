/**
 * Employee Check-in Terminal Service
 * High-speed QR scanning, camera lifecycle, Web Audio sound feedback, atomic verification
 */

import { Html5Qrcode as Html5QrcodeModule } from 'html5-qrcode';
import { localDB } from '../firebase-config.js';
import { getSessionUser } from './auth.js';
import { getActiveEvent } from './events.js';

function getHtml5QrcodeClass() {
  return window.Html5Qrcode || Html5QrcodeModule;
}

let html5QrCode = null;
let isScanning = false;
let lastScannedToken = null;
let lastScanTimestamp = 0;
let audioCtx = null;

// Sound synthesizer using Web Audio API (zero external assets required)
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSuccessSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    // Pleasant two-tone chime (A5 to E6)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.15); // E6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);

    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  } catch (e) {
    console.warn('Audio play error', e);
  }
}

export function playErrorSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Double warning buzz
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.setValueAtTime(140, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);

    if (navigator.vibrate) {
      navigator.vibrate([150, 80, 150]);
    }
  } catch (e) {
    console.warn('Audio play error', e);
  }
}

/**
 * Initialize and start the camera scanner on a DOM element
 */
export async function startCameraScanner(elementId, onScanResult, onError) {
  if (isScanning) {
    return;
  }

  try {
    if (!html5QrCode) {
      const Html5Class = getHtml5QrcodeClass();
      html5QrCode = new Html5Class(elementId);
    }

    const config = {
      fps: 15,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };

    // Use environment-facing (back) camera on phones, fallback to default
    await html5QrCode.start(
      { facingMode: 'environment' },
      config,
      (decodedText) => {
        const now = Date.now();
        // Prevent duplicate frames scanning within 2.5 seconds
        if (decodedText === lastScannedToken && (now - lastScanTimestamp) < 2500) {
          return;
        }

        lastScannedToken = decodedText;
        lastScanTimestamp = now;

        handleTokenVerification(decodedText, onScanResult);
      },
      (errorMessage) => {
        // Scanning in-progress frames error - usually ignorable
      }
    );

    isScanning = true;
    return true;
  } catch (err) {
    console.error('Camera start error:', err);
    if (onError) onError(err);
    throw err;
  }
}

/**
 * Stop camera stream
 */
export async function stopCameraScanner() {
  if (html5QrCode && isScanning) {
    try {
      await html5QrCode.stop();
      isScanning = false;
    } catch (e) {
      console.warn('Camera stop error:', e);
    }
  }
}

export function isCameraActive() {
  return isScanning;
}

/**
 * Core validation & atomic single-use check-in
 */
export function handleTokenVerification(tokenText, onResult) {
  const activeEvent = getActiveEvent();
  const employee = getSessionUser();

  if (!activeEvent) {
    const res = {
      success: false,
      code: 'NO_ACTIVE_EVENT',
      reason: 'No active event is currently selected.'
    };
    playErrorSound();
    if (onResult) onResult(res);
    return res;
  }

  // Atomic database transaction
  const result = localDB.atomicCheckin(tokenText, activeEvent.id, employee);

  if (result.success) {
    playSuccessSound();
  } else {
    playErrorSound();
  }

  if (onResult) {
    onResult(result);
  }

  return result;
}

/**
 * Reset debounce timer for "Next Guest" action
 */
export function resetScannerDebounce() {
  lastScannedToken = null;
  lastScanTimestamp = 0;
}
