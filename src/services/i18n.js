/**
 * Internationalization (i18n) Dictionary & Switcher
 * Supports English (LTR) and Arabic (RTL)
 */

export const translations = {
  en: {
    appTitle: "Event Invitation & QR Check-in System",
    subtitle: "Enterprise Attendance & Guest Management",
    loginTitle: "Sign In",
    loginSubtitle: "Access your event management or check-in terminal",
    email: "Email Address",
    password: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    signInBtn: "Sign In",
    signingIn: "Signing in...",
    logout: "Log Out",
    welcome: "Welcome",
    roleAdmin: "Administrator",
    roleEmployee: "Check-in Staff",
    
    // Nav
    navDashboard: "Dashboard",
    navEvents: "Events",
    navGuests: "Guests",
    navImport: "Import Excel",
    navQrCodes: "QR & Badges",
    navHistory: "Check-in History",
    navEmployees: "Staff Accounts",
    navScanner: "Scan QR",
    navSettings: "Firebase Setup",
    
    // Stats
    statTotalGuests: "Total Guests",
    statValidInvitations: "Valid Invitations",
    statCheckedIn: "Checked In",
    statYetToArrive: "Yet to Arrive",
    statCancelled: "Cancelled",
    statAttendanceRate: "Attendance Rate",
    recentActivity: "Live Check-in Activity",
    noRecentActivity: "No check-ins recorded yet.",
    
    // Events
    eventsTitle: "Event Management",
    newEventBtn: "+ Create Event",
    eventName: "Event Name",
    eventVenue: "Venue / Location",
    eventDates: "Date & Time",
    eventStatus: "Status",
    statusDraft: "Draft",
    statusActive: "Active",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",
    actions: "Actions",
    selectEvent: "Active Event",
    createEventTitle: "Create New Event",
    editEventTitle: "Edit Event",
    saveEvent: "Save Event",
    cancel: "Cancel",
    timeZone: "Time Zone",
    eventDesc: "Description",
    
    // Guests
    guestsTitle: "Guest Management",
    addGuestBtn: "+ Add Guest",
    searchPlaceholder: "Search by name, company, email or token...",
    filterAll: "All Statuses",
    statusValid: "VALID",
    statusCheckedIn: "CHECKED IN",
    statusCancelledInv: "CANCELLED",
    statusRevoked: "REVOKED",
    fullName: "Full Name",
    company: "Company / Organization",
    phone: "Phone Number",
    companions: "Companions Allowed",
    invitationStatus: "Status",
    token: "Invitation Token",
    reissue: "Reissue QR",
    cancelInvitation: "Cancel",
    viewBadge: "View QR Card",
    exportCsv: "Export CSV",
    confirmCancelGuest: "Are you sure you want to cancel this invitation? The guest will not be able to enter.",
    confirmReissue: "Reissuing will invalidate the current QR token and issue a new unique code. Continue?",
    
    // Excel Import
    importTitle: "Import Guests from Spreadsheet",
    importSubtitle: "Upload .xlsx or .csv files to import invitations in bulk",
    dropExcel: "Drag and drop your spreadsheet here or click to browse",
    supportedFormats: "Supported formats: .xlsx, .xls, .csv (Max 5MB)",
    columnMapping: "Verify Spreadsheet Columns",
    previewRows: "Data Preview",
    validRows: "Valid rows ready for import",
    duplicateRows: "Duplicates / Warnings",
    invalidRows: "Invalid rows",
    startImport: "Confirm & Import Guests",
    importing: "Importing records in batches...",
    importSuccess: "Import completed successfully!",
    downloadErrors: "Download Error Report",
    
    // QR Badges
    qrTitle: "Invitation Badges & QR Generator",
    qrSubtitle: "Generate, preview and download personalized invitations with cryptographically unique tokens",
    downloadPng: "Download Badge (PNG)",
    downloadPdf: "Download All Printable Badges (PDF)",
    generateQr: "Generate QR",
    invitationCard: "VIP Event Pass",
    scanInstructions: "Please present this digital or printed pass at the venue entrance.",
    
    // Employee Check-in
    checkinTitle: "Event Check-in Terminal",
    checkinSubtitle: "High-speed camera scanner with atomic duplicate prevention",
    startCamera: "Open Camera Scanner",
    stopCamera: "Stop Camera",
    switchCamera: "Switch Camera",
    manualEntry: "Manual Token Search",
    searchTokenPlaceholder: "Enter token or search guest name...",
    validateTokenBtn: "Verify & Check In",
    scannerIdle: "Camera ready. Align QR code within the viewfinder frame.",
    entryApproved: "ENTRY APPROVED",
    alreadyCheckedIn: "ALREADY CHECKED IN",
    invalidInvitation: "INVALID INVITATION",
    invitationRevoked: "INVITATION CANCELLED / REVOKED",
    eventNotActive: "EVENT NOT ACTIVE",
    checkinSuccessMsg: "Guest verified. Entry granted.",
    firstScanAt: "Checked in on:",
    scannedBy: "Scanned by:",
    nextGuestBtn: "Scan Next Guest",
    todayStats: "Your Scans Today",
    
    // History
    historyTitle: "Check-in History & Security Logs",
    historySubtitle: "Audited log of all entrance scans and administrative actions",
    filterResult: "All Results",
    resSuccess: "Success (Approved)",
    resAlreadyUsed: "Duplicate / Already Checked In",
    resInvalid: "Invalid / Unknown Token",
    resCancelled: "Cancelled / Revoked",
    timestamp: "Time",
    employee: "Staff Member",
    details: "Details / Reason",
    auditLogs: "Audit Trail",
    
    // Firebase Setup
    firebaseTitle: "Firebase & Firestore Connection",
    firebaseSubtitle: "Connect your official Firebase project or use the local offline emulator",
    firebaseConnected: "Connected to Firebase Firestore",
    firebaseDemo: "Running in Resilient Firestore Mode",
    saveConfig: "Apply & Reconnect",
    pasteConfigHelper: "Paste your Firebase config object or JSON credentials below:",
    bootstrapAdmin: "Bootstrap Admin Account",
    
    // Messages
    langToggle: "العربية",
    dir: "ltr"
  },
  
  ar: {
    appTitle: "نظام إدارة الدعوات وتسجيل الحضور بالـ QR",
    subtitle: "إدارة الفعاليات وتسجيل الحضور الذكي للمؤسسات",
    loginTitle: "تسجيل الدخول",
    loginSubtitle: "الدخول إلى لوحة إدارة الفعالية أو محطة التحقق",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    signInBtn: "تسجيل الدخول",
    signingIn: "جاري التحقق...",
    logout: "تسجيل الخروج",
    welcome: "مرحباً",
    roleAdmin: "مدير النظام (Admin)",
    roleEmployee: "موظف استقبال (Staff)",
    
    // Nav
    navDashboard: "لوحة التحكم",
    navEvents: "الفعاليات",
    navGuests: "قائمة الضيوف",
    navImport: "استيراد من إكسل",
    navQrCodes: "رموز QR والبطاقات",
    navHistory: "سجل الدخول والمراجعة",
    navEmployees: "حسابات الموظفين",
    navScanner: "مسح QR",
    navSettings: "إعدادات فايربيس",
    
    // Stats
    statTotalGuests: "إجمالي الضيوف",
    statValidInvitations: "الدعوات الصالحة",
    statCheckedIn: "تم حضورهم",
    statYetToArrive: "لم يصلوا بعد",
    statCancelled: "الدعوات الملغاة",
    statAttendanceRate: "نسبة الحضور",
    recentActivity: "النشاط المباشر للدخول",
    noRecentActivity: "لم يتم تسجيل أي حضور حتى الآن.",
    
    // Events
    eventsTitle: "إدارة الفعاليات",
    newEventBtn: "+ إنشاء فعالية جديدة",
    eventName: "اسم الفعالية",
    eventVenue: "المكان / القاعة",
    eventDates: "التاريخ والوقت",
    eventStatus: "الحالة",
    statusDraft: "مسودة",
    statusActive: "نشطة",
    statusCompleted: "مكتملة",
    statusCancelled: "ملغاة",
    actions: "الإجراءات",
    selectEvent: "الفعالية الحالية",
    createEventTitle: "إضافة فعالية جديدة",
    editEventTitle: "تعديل الفعالية",
    saveEvent: "حفظ الفعالية",
    cancel: "إلغاء",
    timeZone: "المنطقة الزمنية",
    eventDesc: "وصف الفعالية",
    
    // Guests
    guestsTitle: "إدارة الضيوف والدعوات",
    addGuestBtn: "+ إضافة ضيف",
    searchPlaceholder: "بحث بالاسم، الشركة، البريد أو الرمز...",
    filterAll: "جميع الحالات",
    statusValid: "صالحة للدخول",
    statusCheckedIn: "تم الحضور",
    statusCancelledInv: "ملغاة",
    statusRevoked: "مسحوبة",
    fullName: "الاسم الكامل",
    company: "الجهة / الشركة",
    phone: "رقم الهاتف",
    companions: "المرافقين المسموحين",
    invitationStatus: "حالة الدعوة",
    token: "رمز التحقق (Token)",
    reissue: "إعادة إصدار الرمز",
    cancelInvitation: "إلغاء الدعوة",
    viewBadge: "عرض البطاقة والـ QR",
    exportCsv: "تصدير CSV",
    confirmCancelGuest: "هل أنت متأكد من رغبتك بإلغاء هذه الدعوة؟ لن يتمكن الضيف من الدخول.",
    confirmReissue: "إعادة الإصدار ستلغي رمز الـ QR القديم وتصدر رمزاً مشفراً جديداً تماماً. هل تريد المتابعة؟",
    
    // Excel Import
    importTitle: "استيراد الضيوف من ملف إكسل",
    importSubtitle: "ارفع ملفات .xlsx أو .csv لإنشاء الدعوات والرموز دفعة واحدة",
    dropExcel: "اسحب ملف الإكسل هنا أو اضغط للاختيار من جهازك",
    supportedFormats: "الصيغ المدعومة: .xlsx, .xls, .csv (الحد الأقصى 5 ميجابايت)",
    columnMapping: "التحقق من أعمدة الملف",
    previewRows: "معاينة البيانات",
    validRows: "صفوف صالحة للاستيراد",
    duplicateRows: "بيانات مكررة / تحذيرات",
    invalidRows: "صفوف غير صالحة",
    startImport: "تأكيد واستيراد الضيوف",
    importing: "جاري استيراد السجلات في دفعات...",
    importSuccess: "تم اكتمال الاستيراد بنجاح!",
    downloadErrors: "تحميل تقرير الأخطاء",
    
    // QR Badges
    qrTitle: "بطاقات الدعوة ورموز الـ QR",
    qrSubtitle: "توليد ومعاينة وتحميل بطاقات دعوة مخصصة برموز مشفرة آمنة وفريدة",
    downloadPng: "تحميل البطاقة (PNG)",
    downloadPdf: "تحميل جميع البطاقات للطباعة (PDF)",
    generateQr: "إنشاء QR",
    invitationCard: "بطاقة دخول كبار الشخصيات VIP",
    scanInstructions: "يرجى إبراز هذا الرمز عند مدخل القاعة لتسجيل الدخول.",
    
    // Employee Check-in
    checkinTitle: "محطة التحقق وتسجيل الدخول",
    checkinSubtitle: "ماسح كاميرا عالي السرعة مع نظام منع التكرار الفوري",
    startCamera: "تشغيل كاميرا المسح",
    stopCamera: "إيقاف الكاميرا",
    switchCamera: "تبديل الكاميرا",
    manualEntry: "بحث يدوي برمز الدعوة",
    searchTokenPlaceholder: "أدخل الرمز أو ابحث باسم الضيف...",
    validateTokenBtn: "تحقق وتسجيل الحضور",
    scannerIdle: "الكاميرا جاهزة. وجّه الرمز داخل الإطار للمسح الفوري.",
    entryApproved: "تم قبول الدخول بنجاح",
    alreadyCheckedIn: "تم تسجيل الدخول مسبقاً!",
    invalidInvitation: "دعوة غير صالحة أو غير معروفة",
    invitationRevoked: "الدعوة ملغاة أو تم سحبها",
    eventNotActive: "الفعالية غير نشطة حالياً",
    checkinSuccessMsg: "تم التحقق من بيانات الضيف والمصادقة على الدخول.",
    firstScanAt: "تاريخ الدخول الأول:",
    scannedBy: "الموظف المسؤول:",
    nextGuestBtn: "مسح الضيف التالي",
    todayStats: "عمليات المسح الخاصة بك اليوم",
    
    // History
    historyTitle: "سجل عمليات التحقق والمراجعة",
    historySubtitle: "سجل كامل وتاريخي لجميع عمليات المسح عند المداخل مع أسباب الرفض",
    filterResult: "جميع النتائج",
    resSuccess: "مقبول (دخول ناجح)",
    resAlreadyUsed: "مكرر / تم الدخول مسبقاً",
    resInvalid: "رمز غير صالح أو مزور",
    resCancelled: "دعوة ملغاة",
    timestamp: "التوقيت",
    employee: "الموظف",
    details: "التفاصيل / السبب",
    auditLogs: "سجل إجراءات الإدارة",
    
    // Firebase Setup
    firebaseTitle: "إعدادات اتصال Firebase & Firestore",
    firebaseSubtitle: "ربط مشروع فايربيس الرسمي أو استخدام وضع المحاكي المحلي السحابي",
    firebaseConnected: "متصل بقاعدة بيانات Cloud Firestore",
    firebaseDemo: "يعمل في وضع التخزين السريع المتزامن",
    saveConfig: "تطبيق الاتصال وإعادة التشغيل",
    pasteConfigHelper: "الصق كود إعدادات Firebase config هنا:",
    bootstrapAdmin: "إنشاء حساب المشرف الأساسي",
    
    // Messages
    langToggle: "English",
    dir: "rtl"
  }
};

let currentLanguage = localStorage.getItem('app_lang') || 'en';

export function getLanguage() {
  return currentLanguage;
}

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('app_lang', lang);
    applyLanguageToDOM();
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }
}

export function t(key) {
  return translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
}

export function applyLanguageToDOM() {
  const lang = currentLanguage;
  const isRtl = lang === 'ar';
  document.documentElement.lang = lang;
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  
  // Update elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && translations[lang]?.[key]) {
      el.textContent = translations[lang][key];
    }
  });

  // Update elements with data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && translations[lang]?.[key]) {
      el.placeholder = translations[lang][key];
    }
  });

  // Update elements with data-i18n-title
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key && translations[lang]?.[key]) {
      el.title = translations[lang][key];
    }
  });

  // Update language toggle button text
  const langToggleBtn = document.getElementById('lang-toggle-btn');
  if (langToggleBtn) {
    langToggleBtn.textContent = translations[lang].langToggle;
  }
}
