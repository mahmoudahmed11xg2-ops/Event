# Event Invitation & QR Check-in Management System
### نظام إدارة الدعوات وتسجيل الحضور بالـ QR

Enterprise-grade, secure, responsive web application for managing event invitations, attendee lists, cryptographic QR passes, and atomic entrance check-ins with multi-staff concurrency protection.

Built with **HTML5, CSS3, and Vanilla JavaScript (ES6+)** with **Firebase Authentication**, **Cloud Firestore**, and **GitHub Pages** compatibility.

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC)**:
   - **Administrator**: Full dashboard overview, multi-event management, guest registrations, spreadsheet import (.xlsx / .csv), QR badge designer, check-in history, audit logging, and staff account management.
   - **Check-in Staff (Employee)**: Dedicated, mobile-first entrance terminal with high-speed camera scanner, instant visual & acoustic validation feedback, duplicate-use detection, and manual search fallback.

2. **Atomic Single-Use Check-in & Duplicate Prevention**:
   - Cryptographically random unique tokens (`crypto.getRandomValues`).
   - Firestore transactional verification preventing race conditions when multiple staff scan the same QR code concurrently.
   - Explicit audit trail recording all duplicate, invalid, and cancelled scan attempts.

3. **High-Fidelity Invitation Badges & Export**:
   - HTML5 Canvas VIP pass badge generation with custom dark charcoal branding and crimson accents.
   - Individual badge download in PNG format.
   - Multi-page printable invitation badge export in PDF format (`jspdf`).
   - CSV export for guest lists and scan history.

4. **Spreadsheet Guest Import**:
   - Parses `.xlsx`, `.xls`, and `.csv` files using SheetJS.
   - Flexible column detection supporting English and Arabic headers (`Full Name`, `Company`, `Email`, `Phone`, `Companions`, `الاسم`, `الجهة`, `البريد`, `الهاتف`, etc.).
   - Pre-import validation preview identifying duplicate records and formatting errors with downloadable error reports.
   - Controlled batch insertion into Firestore.

5. **Acoustic & Haptic Entrance Feedback**:
   - Web Audio API real-time synthesis:
     - Melodic high two-tone chime for approved entries (`ENTRY APPROVED`).
     - Distinct double-buzz warning for duplicates or invalid tokens (`ALREADY CHECKED IN` / `INVALID INVITATION`).
   - Vibration pattern support on compatible mobile devices (`navigator.vibrate`).

6. **Bilingual & Responsive Interface**:
   - Full English (LTR) and Arabic (RTL) interface with one-click live toggle.
   - Optimized for mobile phone screens, tablets, and desktop workstations.

---

## 📁 Project Directory Structure

```text
├── index.html                      # Semantic HTML5 application entry point
├── firestore.rules                 # Production Firestore security rules
├── metadata.json                   # Applet configuration & camera permissions
├── package.json                    # Project dependencies
├── README.md                       # Complete documentation & deployment guide
├── public/
│   └── assets/                     # Static diagrams and assets
└── src/
    ├── style.css                   # Dark charcoal & crimson CSS design system
    ├── main.js                     # Main vanilla JS application controller
    ├── firebase-config.js          # Firebase SDK & resilient Firestore engine
    └── services/
        ├── auth.js                 # Authentication & role-based session logic
        ├── events.js               # Multi-event management service
        ├── guests.js               # Guest CRUD, cancellation & token reissue
        ├── checkin.js              # Camera QR scanner & Web Audio feedback
        ├── excel.js                # SheetJS spreadsheet parser & batch importer
        ├── qr.js                   # QR code generator, canvas badge & PDF export
        ├── stats.js                # Real-time attendance statistics & history
        └── i18n.js                 # English / Arabic translation dictionaries
```

---

## 🔐 Pre-seeded Test Accounts

For immediate testing, the application comes configured with verified test accounts:

| Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@event.org` | `admin123` | Full dashboard, events, guests, Excel import, staff, reports |
| **Staff Member** | `staff@event.org` | `staff123` | Mobile entrance terminal, camera QR scanning, check-in |

*(Clicking the **Admin** or **Staff** shortcut buttons on the login screen pre-fills these credentials automatically).*

---

## 🔥 Firebase Setup Guide

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name your project (e.g., `event-management-system`).
3. Enable **Google Analytics** (optional) and create the project.

### 2. Enable Firebase Authentication
1. In the left navigation, click **Authentication** > **Get started**.
2. Under **Sign-in method**, enable **Email/Password**.

### 3. Enable Cloud Firestore
1. In the left navigation, click **Firestore Database** > **Create database**.
2. Select your preferred Cloud location (e.g., `europe-west2` or `us-central1`).
3. Start in **Production mode**.

### 4. Deploy Firestore Security Rules
Copy the contents of `firestore.rules` into your Firebase Console:
1. Navigate to **Firestore Database** > **Rules**.
2. Replace existing rules with the content from `firestore.rules`.
3. Click **Publish**.

### 5. Connect Frontend to Firebase
1. In Project Settings, under **Your apps**, click the **Web (`</>`)** icon.
2. Register the app and copy your `firebaseConfig` object.
3. In this web application, click the **Firestore Ready** button in the header, paste your configuration JSON, and click **Apply & Reconnect**.

---

## 🚀 GitHub Pages Deployment

The application uses standard relative paths and vanilla HTML/CSS/JS modules, making it 100% compatible with GitHub Pages:

1. Create a new GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Event Management System"
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git branch -M main
   git push -u origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **Deploy from a branch**.
   - Select the `main` branch and `/ (root)` folder (or `/dist` if using Vite build output).
   - Click **Save**.
3. Your site will be published at `https://<your-username>.github.io/<repo-name>/`.
4. Because camera access requires HTTPS, GitHub Pages automatically provides HTTPS out of the box!

---

## 📋 Free-Tier Limitations Analysis

Firebase's **Spark (Free) Plan** provides generous allowances suitable for single-day and multi-day corporate events:
- **Cloud Firestore**: 50,000 document reads, 20,000 document writes, and 20,000 document deletes per day (plenty for events up to 5,000+ attendees).
- **Firebase Authentication**: Unlimited email/password sign-ins.
- **GitHub Pages**: Free unlimited static hosting with custom domain and automated HTTPS certificates.
- **Client-side QR & PDF**: Processing is executed entirely on the client's browser (no server billing or third-party paid APIs required).

---

## 🛡️ Security Guarantees

1. **No Client Role Spoofing**: User roles are validated through authenticated user records and enforced by Firestore Security Rules.
2. **Atomic Invalidation**: When an invitation is scanned and accepted, its state changes to `CHECKED_IN` atomically. Any subsequent scan of the same QR code returns `ALREADY_CHECKED_IN` with the original timestamp and employee identity.
3. **Cryptographic Tokens**: QR codes do not embed personal names, passwords, or guessable IDs. They embed opaque, cryptographically random strings (`INV-XXXX-XXXX-XXXX`).
4. **Reissue Protection**: Reissuing a guest's invitation immediately revokes and invalidates their previous QR token.
