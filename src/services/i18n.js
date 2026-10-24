/**
 * Internationalization (i18n) Dictionary & Switcher
 * Supports 100% English (LTR) and 100% Arabic (RTL) across all components
 */

export const translations = {
  en: {
    appTitle: "Event Invitation & QR Check-in System",
    subtitle: "Enterprise Attendance & Guest Management",
    loginTitle: "Sign In",
    loginSubtitle: "Access your event management or check-in terminal",
    email: "Email Address",
    password: "Password",
    showPassword: "Show",
    hidePassword: "Hide",
    rememberMe: "Remember session on this device",
    signInBtn: "Sign In",
    signingIn: "Signing in...",
    logout: "Log Out",
    welcome: "Welcome",
    roleAdmin: "ADMIN",
    roleEmployee: "STAFF",
    
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
    statTotalGuestsSub: "Registered across lists",
    statValidInvitations: "Valid Invitations",
    statValidInvitationsSub: "Eligible for admission",
    statCheckedIn: "Checked In",
    statCheckedInSub: "Admitted at gates",
    statYetToArrive: "Yet to Arrive",
    statYetToArriveSub: "Pending guests",
    statCancelled: "Cancelled",
    statCancelledSub: "Excluded from entry",
    statAttendanceRate: "Attendance Rate",
    recentActivity: "Live Check-in Activity",
    realtimeSync: "Real-time Sync",
    noRecentActivity: "No check-ins recorded yet.",
    
    // Events
    eventsTitle: "Event Management",
    eventsSubtitle: "Manage corporate gatherings, venues, timezones and active status",
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
    close: "Close",
    timeZone: "Time Zone",
    eventDesc: "Description",
    currentBadge: "✓ Current Active",
    setActiveBtn: "Set Active",
    noActiveEventSelected: "No event selected",
    
    // Guests
    guestsTitle: "Guest Management",
    guestsSubtitle: "Register attendees, issue cryptographically unique QR passes, and monitor attendance",
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
    companions: "Companions",
    companionsAllowed: "Companions Allowed",
    notesVipCategory: "Notes / VIP Category",
    invitationStatus: "Status",
    token: "QR Token",
    reissue: "Reissue QR",
    cancelInvitation: "Cancel",
    viewBadge: "View QR Pass",
    exportCsv: "Export CSV",
    noGuestsMatch: "No guests matching current filters.",
    confirmCancelGuest: "Are you sure you want to cancel this invitation? The guest will not be able to enter.",
    confirmReissue: "Reissuing will invalidate the current QR token and issue a new unique code. Continue?",
    
    // Excel Import
    importTitle: "Import Guests from Spreadsheet",
    importSubtitle: "Upload .xlsx or .csv files to import invitations in bulk",
    dropExcel: "Drag and drop your spreadsheet here or click to browse",
    supportedFormats: "Supported formats: .xlsx, .xls, .csv (Max 5MB)",
    columnMapping: "Verify Spreadsheet Columns",
    previewRows: "Data Preview",
    validRows: "Valid Rows",
    duplicateRows: "Duplicates / Warnings",
    invalidRows: "Invalid Rows",
    readyToImport: "Ready",
    startImport: "Confirm & Import Guests",
    importing: "Importing records in batches...",
    importSuccess: "Import completed successfully!",
    downloadErrors: "Download Error Report",
    validationResult: "Validation Result",
    missingField: "Missing required information",
    
    // QR Badges
    qrTitle: "Invitation Badges & QR Generator",
    qrSubtitle: "Generate, preview and download personalized invitations with cryptographically unique tokens",
    selectGuestPreview: "Select Guest to Preview Pass",
    downloadPng: "Download Badge (PNG)",
    downloadPdf: "Download All Printable Badges (PDF)",
    generateQr: "Generate QR",
    invitationCard: "VIP Event Pass",
    officialVipPass: "OFFICIAL VIP INVITATION PASS",
    nonTransferable: "NON-TRANSFERABLE • SINGLE ENTRY PASS",
    honoredGuest: "HONORED GUEST",
    attendeeLabel: "Attendee",
    uniqueTokenLabel: "Unique Token",
    scanInstructions: "Please present this digital or printed pass at the venue entrance.",
    scanSecurityNotice: "Valid for one-time admission only. Verified securely by Cloud Firestore.",
    generatingPdfMsg: "Generating PDF badges...",
    noGuestsToExport: "No valid guests found to export.",
    
    // Employee Check-in
    checkinTitle: "Event Check-in Terminal",
    checkinSubtitle: "High-speed camera scanner with atomic duplicate prevention",
    startCamera: "Open Camera Scanner",
    stopCamera: "Stop Camera",
    switchCamera: "Switch Camera",
    manualEntry: "Manual Token Search",
    searchTokenPlaceholder: "Enter token (e.g. INV-A7F2-99B4-4D1E)...",
    validateTokenBtn: "Verify",
    scannerIdle: "Camera ready. Align QR code within the frame.",
    entryApproved: "ENTRY APPROVED",
    alreadyCheckedIn: "ALREADY CHECKED IN",
    invalidInvitation: "INVALID INVITATION",
    invitationRevoked: "INVITATION CANCELLED / REVOKED",
    eventNotActive: "EVENT NOT ACTIVE",
    checkinSuccessMsg: "Guest verified. Entry granted.",
    firstScanAt: "Original check-in time:",
    scannedBy: "Staff member:",
    nextGuestBtn: "Scan Next Guest",
    todayStats: "Your Scans Today:",
    noActiveEventTerminal: "Please select an active event first.",
    
    // History
    historyTitle: "Check-in History & Security Logs",
    historySubtitle: "Audited log of all entrance scans and administrative actions",
    filterResult: "All Results",
    resSuccess: "Success (Approved)",
    resAlreadyUsed: "Duplicate / Used",
    resInvalid: "Invalid Token",
    resCancelled: "Cancelled Invitation",
    timestamp: "Timestamp",
    employee: "Staff",
    details: "Details / Reason",
    auditLogs: "Administrative Audit Trail",
    noHistoryRecords: "No history records match current filters.",
    noAuditLogs: "No audit logs recorded yet.",
    searchHistoryPlaceholder: "Search by guest, token, or reason...",
    
    // Staff Accounts
    staffAccountsTitle: "Staff & Employee Accounts",
    staffAccountsSubtitle: "Manage check-in staff members and entrance terminal permissions",
    addStaffBtn: "+ Add Staff Member",
    displayName: "Display Name",
    activeStatus: "Active Status",
    createdDate: "Created",
    enableBtn: "Enable",
    disableBtn: "Disable",
    activeLabel: "Active",
    disabledLabel: "Disabled",
    noStaffAccounts: "No staff accounts configured.",
    createStaffTitle: "Create Check-in Staff Account",
    staffNameLabel: "Staff Member Name *",
    staffEmailLabel: "Staff Email Address *",
    staffNotice: "The staff account will have permissions restricted to scanning QR codes and checking in attendees. Administrative areas remain strictly protected.",
    
    // Firebase Setup
    firebaseTitle: "Firebase & Firestore Connection",
    firebaseSubtitle: "Connect your official Firebase project or configure live cloud sync",
    firebaseConnected: "Cloud Firestore Online",
    firebaseDemo: "Resilient Firestore Engine",
    saveConfig: "Apply & Reconnect",
    pasteConfigHelper: "Paste your Firebase configuration object (JSON) from Firebase Console:",
    resetDemoData: "Reset Demo Data to Initial State",
    resetConfirm: "Are you sure you want to reset all guests, events, and scans to initial demonstration data?",
    firestoreRulesNotice: "Firestore Security Rules (firestore.rules) are included in the repository to guarantee atomic check-ins, prevent client tampering, and restrict staff permissions.",
    
    // Common / Notifications
    quickActions: "Quick Actions",
    confirmTitle: "Confirmation",
    alertMissingNameCompany: "Guest full name and company are required.",
    alertEventSaved: "Event saved successfully.",
    alertImportSuccess: "Guests imported successfully!",
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
    showPassword: "إظهار",
    hidePassword: "إخفاء",
    rememberMe: "تذكر الجلسة على هذا الجهاز",
    signInBtn: "تسجيل الدخول",
    signingIn: "جاري تسجيل الدخول...",
    logout: "تسجيل الخروج",
    welcome: "مرحباً",
    roleAdmin: "مدير النظام",
    roleEmployee: "موظف الاستقبال",
    
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
    statTotalGuestsSub: "المسجلين في القوائم",
    statValidInvitations: "الدعوات الصالحة",
    statValidInvitationsSub: "المصرح لهم بالدخول",
    statCheckedIn: "تم حضورهم",
    statCheckedInSub: "المسجلين عند البوابات",
    statYetToArrive: "لم يصلوا بعد",
    statYetToArriveSub: "الضيوف المنتظرين",
    statCancelled: "الدعوات الملغاة",
    statCancelledSub: "المستبعدين من الدخول",
    statAttendanceRate: "نسبة الحضور",
    recentActivity: "النشاط المباشر للدخول",
    realtimeSync: "مزامنة لحظية",
    noRecentActivity: "لم يتم تسجيل أي حضور حتى الآن.",
    
    // Events
    eventsTitle: "إدارة الفعاليات",
    eventsSubtitle: "إدارة فعاليات ومؤتمرات المؤسسة والمواقع والمناطق الزمنية والحالة",
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
    close: "إغلاق",
    timeZone: "المنطقة الزمنية",
    eventDesc: "وصف الفعالية",
    currentBadge: "✓ الفعالية النشطة",
    setActiveBtn: "تعيين كنشطة",
    noActiveEventSelected: "لم يتم اختيار فعالية",
    
    // Guests
    guestsTitle: "إدارة الضيوف والدعوات",
    guestsSubtitle: "تسجيل الحضور وإصدار رموز QR المشفرة والآمنة ومتابعة الدخول",
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
    companions: "المرافقين",
    companionsAllowed: "المرافقين المسموحين (Plus One)",
    notesVipCategory: "ملاحظات / فئة VIP",
    invitationStatus: "حالة الدعوة",
    token: "رمز التحقق (Token)",
    reissue: "إعادة إصدار الرمز",
    cancelInvitation: "إلغاء الدعوة",
    viewBadge: "عرض البطاقة والـ QR",
    exportCsv: "تصدير CSV",
    noGuestsMatch: "لا يوجد ضيوف يطابقون خيارات البحث الحالية.",
    confirmCancelGuest: "هل أنت متأكد من رغبتك بإلغاء هذه الدعوة؟ لن يتمكن الضيف من الدخول نهائياً.",
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
    readyToImport: "جاهز",
    startImport: "تأكيد واستيراد الضيوف",
    importing: "جاري استيراد السجلات في دفعات...",
    importSuccess: "تم اكتمال الاستيراد بنجاح!",
    downloadErrors: "تحميل تقرير الأخطاء",
    validationResult: "نتيجة التحقق",
    missingField: "بيانات أساسية مفقودة",
    
    // QR Badges
    qrTitle: "بطاقات الدعوة ورموز الـ QR",
    qrSubtitle: "توليد ومعاينة وتحميل بطاقات دعوة مخصصة برموز مشفرة آمنة وفريدة",
    selectGuestPreview: "اختر الضيف لمعاينة بطاقة الدخول",
    downloadPng: "تحميل البطاقة (PNG)",
    downloadPdf: "تحميل جميع البطاقات للطباعة (PDF)",
    generateQr: "إنشاء QR",
    invitationCard: "بطاقة دخول كبار الشخصيات VIP",
    officialVipPass: "بطاقة دعوة رسمية VIP",
    nonTransferable: "غير قابلة للتحويل • صالحة للدخول مرة واحدة",
    honoredGuest: "الضيف الكريم",
    attendeeLabel: "الضيف",
    uniqueTokenLabel: "الرمز الفريد",
    scanInstructions: "يرجى إبراز هذا الرمز عند مدخل القاعة لتسجيل الدخول.",
    scanSecurityNotice: "صالحة للاستخدام لمرة واحدة فقط. يتم التحقق منها عبر خادم سحابي آمن.",
    generatingPdfMsg: "جاري تجهيز بطاقات الـ PDF للطباعة...",
    noGuestsToExport: "لا توجد دعوات صالحة لتصديرها.",
    
    // Employee Check-in
    checkinTitle: "محطة التحقق وتسجيل الدخول",
    checkinSubtitle: "ماسح كاميرا عالي السرعة مع نظام منع التكرار الفوري",
    startCamera: "تشغيل كاميرا المسح",
    stopCamera: "إيقاف الكاميرا",
    switchCamera: "تبديل الكاميرا",
    manualEntry: "بحث يدوي برمز الدعوة",
    searchTokenPlaceholder: "أدخل رمز الدعوة (مثل: INV-A7F2-99B4-4D1E)...",
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
    todayStats: "عمليات المسح الخاصة بك اليوم:",
    noActiveEventTerminal: "يرجى تحديد فعالية نشطة أولاً.",
    
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
    noHistoryRecords: "لا توجد سجلات تطابق خيارات التصفية.",
    noAuditLogs: "لا توجد سجلات مراجعة مسجلة حتى الآن.",
    searchHistoryPlaceholder: "بحث بالاسم أو الرمز أو سبب الرفض...",
    
    // Staff Accounts
    staffAccountsTitle: "حسابات موظفي الاستقبال والمنظمين",
    staffAccountsSubtitle: "إدارة صلاحيات موظفي البوابات وتفعيل أو تعطيل الأجهزة والمداخل",
    addStaffBtn: "+ إضافة موظف استقبال",
    displayName: "الاسم",
    activeStatus: "الحالة",
    createdDate: "تاريخ الإنشاء",
    enableBtn: "تفعيل",
    disableBtn: "تعطيل",
    activeLabel: "نشط",
    disabledLabel: "معطل",
    noStaffAccounts: "لا توجد حسابات موظفين مسجلة حالياً.",
    createStaffTitle: "إنشاء حساب موظف استقبال جديد",
    staffNameLabel: "اسم الموظف أو البوابة *",
    staffEmailLabel: "البريد الإلكتروني للموظف *",
    staffNotice: "يملك حساب الموظف صلاحية مسح رموز QR وتسجيل الحضور فقط عند المداخل دون الوصول إلى الإعدادات الإدارية.",
    
    // Firebase Setup
    firebaseTitle: "إعدادات اتصال Firebase & Firestore",
    firebaseSubtitle: "ربط مشروع فايربيس الرسمي أو إعداد المزامنة السحابية المباشرة",
    firebaseConnected: "متصل بقاعدة Cloud Firestore",
    firebaseDemo: "محاكي Firestore السريع",
    saveConfig: "تطبيق الاتصال وإعادة التشغيل",
    pasteConfigHelper: "الصق كود إعدادات Firebase configuration (JSON) من منصة فايربيس:",
    resetDemoData: "استعادة البيانات التجريبية الأولية",
    resetConfirm: "هل أنت متأكد من رغبتك بإعادة تعيين كافة الضيوف والفعاليات للبيانات الأولية؟",
    firestoreRulesNotice: "ملف قواعد الأمان (firestore.rules) موجود في المشروع لحماية قاعدة البيانات ومنع التكرار وقفل الصلاحيات تلقائياً.",
    
    // Common / Notifications
    quickActions: "إجراءات سريعة",
    confirmTitle: "تأكيد الإجراء",
    alertMissingNameCompany: "يرجى إدخال اسم الضيف والجهة / الشركة.",
    alertEventSaved: "تم حفظ الفعالية بنجاح.",
    alertImportSuccess: "تم استيراد الضيوف بنجاح!",
    langToggle: "English",
    dir: "rtl"
  }
};

let currentLanguage = localStorage.getItem('app_lang') || 'ar'; // Default to Arabic as requested by user

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
