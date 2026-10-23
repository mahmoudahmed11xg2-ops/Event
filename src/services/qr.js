/**
 * QR Code Generator & Invitation Badge Designer
 * Generates high-res QR codes, stylish invitation badge canvases, and printable multi-pass PDFs
 */

import QRCodeModule from 'qrcode';
import { jsPDF as JsPDFModule } from 'jspdf';
import { getEventById } from './events.js';

function getQRCode() {
  return window.QRCode || QRCodeModule;
}

function getJsPDFClass() {
  if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
  return JsPDFModule;
}

/**
 * Generate a QR code Data URL (PNG)
 */
export async function generateQrDataUrl(text, options = {}) {
  try {
    const qrLib = getQRCode();
    return await qrLib.toDataURL(text, {
      width: options.width || 300,
      margin: options.margin || 2,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });
  } catch (err) {
    console.error('QR Generation failed:', err);
    throw err;
  }
}

/**
 * Draw a high-fidelity VIP Event Pass on a Canvas element
 */
export async function renderInvitationBadgeCanvas(canvas, guest, event) {
  if (!canvas || !guest) return;
  const ctx = canvas.getContext('2d');
  
  // Set dimensions (standard mobile badge ratio: 600 x 900)
  const width = 600;
  const height = 900;
  canvas.width = width;
  canvas.height = height;

  // Background - Dark Charcoal gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(0.5, '#111827');
  bgGrad.addColorStop(1, '#030712');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Border & Subtle Crimson Glow
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Top Crimson Header Banner
  const headerGrad = ctx.createLinearGradient(0, 20, 0, 140);
  headerGrad.addColorStop(0, '#991b1b');
  headerGrad.addColorStop(1, '#450a0a');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(20, 20, width - 40, 110);

  // Header Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OFFICIAL VIP INVITATION PASS', width / 2, 65);

  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = '#fca5a5';
  ctx.fillText('NON-TRANSFERABLE • SINGLE ENTRY PASS', width / 2, 95);

  // Event Name
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 24px system-ui, sans-serif';
  const eventName = event?.name || 'Annual Executive Summit 2026';
  ctx.fillText(eventName, width / 2, 185);

  // Venue & Time
  ctx.fillStyle = '#94a3b8';
  ctx.font = '15px system-ui, sans-serif';
  const venueText = event?.venue || 'Grand Metropolitan Center';
  ctx.fillText(venueText, width / 2, 215);

  const dateText = event?.startAt ? new Date(event.startAt).toLocaleString() : 'November 15, 2026 • 09:00 AM';
  ctx.fillText(dateText, width / 2, 240);

  // Divider line
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 265);
  ctx.lineTo(width - 60, 265);
  ctx.stroke();

  // Guest Details
  ctx.fillStyle = '#f87171';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('HONORED GUEST', width / 2, 300);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText(guest.fullName || 'Guest Name', width / 2, 345);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText(guest.company || 'Company / Organization', width / 2, 380);

  // QR Code Frame
  const qrSize = 250;
  const qrX = (width - qrSize) / 2;
  const qrY = 420;

  // White background card for QR code
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30, 16);
  ctx.fill();

  // Draw QR Code
  try {
    const qrDataUrl = await generateQrDataUrl(guest.token, { width: qrSize, margin: 1 });
    const qrImg = new Image();
    await new Promise((resolve, reject) => {
      qrImg.onload = resolve;
      qrImg.onerror = reject;
      qrImg.src = qrDataUrl;
    });
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  } catch (err) {
    console.error('Failed to draw QR image on canvas:', err);
  }

  // Token String below QR
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(guest.token || 'INV-0000-0000-0000', width / 2, 725);

  // Companions allowed badge
  if (guest.companionLimit > 0) {
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(`+ ${guest.companionLimit} Permitted Companion(s)`, width / 2, 755);
  }

  // Footer instruction
  ctx.fillStyle = '#64748b';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Please present this screen or printed pass at the gate.', width / 2, 820);
  ctx.fillText('Valid for one-time admission only. Verified securely by Cloud Firestore.', width / 2, 840);
}

/**
 * Trigger download of the canvas as a PNG
 */
export function downloadCanvasAsPng(canvas, filename = 'invitation_pass.png') {
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Generate a multi-page printable PDF of invitations
 */
export async function exportAllInvitationsPdf(guests, event) {
  if (!guests || guests.length === 0) {
    alert('No guests to export.');
    return;
  }

  const PDFConstructor = getJsPDFClass();
  const doc = new PDFConstructor({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // A4 is 210 x 297 mm.
  // We can place 2 invitation badges per page (each 90 x 135 mm) or 1 per page.
  for (let i = 0; i < guests.length; i++) {
    const guest = guests[i];
    if (i > 0) doc.addPage();

    // Border and Header box
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(10, 10, 190, 277, 'F');
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(1.5);
    doc.rect(15, 15, 180, 267);

    // Header banner
    doc.setFillColor(153, 27, 27);
    doc.rect(15, 15, 180, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('OFFICIAL VIP EVENT INVITATION', 105, 30, { align: 'center' });
    doc.setFontSize(10);
    doc.text('SECURE QR CHECK-IN PASS', 105, 38, { align: 'center' });

    // Event Info
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(event?.name || 'Corporate Event 2026', 105, 60, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setTextColor(180, 190, 205);
    doc.text(event?.venue || 'Grand Ballroom Venue', 105, 70, { align: 'center' });
    doc.text(event?.startAt ? new Date(event.startAt).toLocaleString() : '', 105, 78, { align: 'center' });

    // Guest Info
    doc.setTextColor(248, 113, 113);
    doc.setFontSize(11);
    doc.text('HONORED GUEST', 105, 95, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(guest.fullName, 105, 108, { align: 'center' });

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(14);
    doc.text(guest.company, 105, 118, { align: 'center' });

    // QR Code
    const qrDataUrl = await generateQrDataUrl(guest.token, { width: 400, margin: 1 });
    doc.addImage(qrDataUrl, 'PNG', 65, 130, 80, 80);

    // Token
    doc.setFont('courier', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(148, 163, 184);
    doc.text(guest.token, 105, 222, { align: 'center' });

    if (guest.companionLimit > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(16, 185, 129);
      doc.text(`+ ${guest.companionLimit} Permitted Companion(s)`, 105, 232, { align: 'center' });
    }

    // Security footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Present this QR code upon arrival at entrance gate.', 105, 255, { align: 'center' });
    doc.text('Single-use atomic verification. Forged or duplicate scans will be rejected.', 105, 262, { align: 'center' });
  }

  doc.save(`event_invitations_${event?.id || 'all'}.pdf`);
}
