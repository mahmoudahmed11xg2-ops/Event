/**
 * Internationalization (i18n) Dictionary & Switcher
 * Supports 100% English (LTR) and 100% Arabic (RTL) across all components
 */

export const translations = {
  en: {
    appTitle: "Event Invitation & QR Check-in System",
    subtitle: "Enterprise Attendance & Guest Management",
    brandTitle: "Invitation Management",
    brandSubtitle: "QR Attendance & Check-in",
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
    greetingTitle: "Welcome back 👋",
    greetingSubtitle: "Here is a quick overview of today's invitations and attendance performance",
    newInvitationBtn: "+ New Invitation",
    roleAdmin: "System Admin",
    roleEmployee: "Reception Staff",
    
    // Nav
    navDashboard: "Dashboard",
    navInvitations: "Invitations",
    navEvents: "Events",
    navGuests: "Guest List",
    navImport: "Import Excel",
    navQrCodes: "QR & Badges",
    navScanner: "QR Check-in",
    navNotifications: "Notifications",
    navReports: "Reports",
    navHistory: "Check-in History",
    navEmployees: "Staff Accounts",
    navSettings: "Settings",
    
    // Stats (Strictly matching reference image)
    statTotalGuests: "Total Guests",
    statTotalGuestsSub: "Registered across lists",
    statValidInvitations: "Valid Invitations",
    statValidInvitationsSub: "Eligible for entry",
    statCheckedIn: "Checked In",
    statCheckedInSub: "Registered at events",
    statYetToArrive: "Yet to Arrive",
    statYetToArriveSub: "Awaiting arrival",
    statCancelled: "Cancelled Invitations",
    statCancelledSub: "Cancelled to date",
    statAttendanceRate: "Attendance Rate",
    statAttendanceRateSub: "Of total invited guests",
    
    // Live Activity & Scanner Card
    recentActivity: "Live Check-in Activity",
    realtimeSync: "Real-time Sync",
    viewAll: "View All",
    noRecentActivity: "No check-ins recorded yet.",
    qrCheckinCardTitle: "QR Check-in",
    qrCheckinCardSubtitle: "Scan quick response code to admit",
    openCamera: "Open Camera",
    orText: "or",
    uploadQrImage: "Upload QR Image",
    quickScanCardTitle: "Scan QR Code",
    quickScanCardSubtitle: "Fast-track guest check-in",
    dbConnected: "Database Connected",
    
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
    dropExcel: "Drag & drop your spreadsheet here or click to browse",
    supportedFormats: "Supported formats: .xlsx, .xls, .csv (Max 5MB)",
    validRows: "Valid Rows",
    duplicateRows: "Duplicate / Warnings",
    invalidRows: "Invalid Rows",
    downloadErrors: "Download Error Report",
    startImport: "Confirm & Import Guests",
    importing: "Importing records in batches...",
    
    // Badges & QR
    qrTitle: "Invitation Badges & QR Generator",
    qrSubtitle: "Generate, preview and download personalized invitations with cryptographically unique tokens",
    selectGuestPreview: "Select Guest to Preview Pass",
    downloadPng: "Download Badge (PNG)",
    downloadPdf: "Download All Printable Badges (PDF)",
    badgeVIP: "VIP INVITATION PASS",
    
    // History & Terminal
    historyTitle: "Check-in History & Security Logs",
    historySubtitle: "Audited log of all entrance scans and administrative actions",
    auditLogs: "Administrative Audit Trail",
    timestamp: "Time",
    employee: "Staff",
    details: "Details / Reason",
    validationResult: "Validation Result",
    filterResult: "All Results",
    resSuccess: "Success (Admitted)",
    resAlreadyUsed: "Already Checked In",
    resInvalid: "Invalid Token",
    resCancelled: "Cancelled Invitation",
    checkinTitle: "Event Check-in Terminal",
    scannerIdle: "Camera ready. Align QR code within the frame.",
    startCamera: "Open Camera Scanner",
    stopCamera: "Stop Camera",
    nextGuestBtn: "Scan Next Guest",
    manualEntry: "Manual Token Search",
    validateTokenBtn: "Verify",
    todayStats: "Your Scans Today:",
    
    // Staff Accounts
    staffAccountsTitle: "Staff & Employee Accounts",
    staffAccountsSubtitle: "Manage check-in staff members and entrance terminal permissions",
    addStaffBtn: "+ Add Staff Member",
    displayName: "Display Name",
    activeStatus: "Active Status",
    createdDate: "Created",
    createStaffTitle: "Create Check-in Staff Account",
    staffNameLabel: "Staff Member Name *",
    staffEmailLabel: "Staff Email Address *",
    staffPasswordLabel: "Account Password *",
    staffPasswordHelp: "At least 6 characters. The employee will use this password to sign into the check-in terminal.",
    staffNotice: "The staff account will have permissions restricted to scanning QR codes and checking in attendees. Administrative areas remain strictly protected.",
    activeBadge: "Active",
    inactiveBadge: "Disabled",
    toggleStatusBtn: "Toggle Status",
    
    // Settings & Firebase
    firebaseTitle: "Firebase & Cloud Sync Settings",
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
    brandTitle: "نظام إدارة الدعوات",
    brandSubtitle: "وتسجيل الحضور بالـ QR",
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
    greetingTitle: "مرحباً بك مجدداً 👋",
    greetingSubtitle: "إليك نظرة سريعة على أداء الدعوات والحضور اليوم",
    newInvitationBtn: "+ دعوة جديدة",
    roleAdmin: "مدير النظام",
    roleEmployee: "موظف",
    
    // Nav (Strictly matching sidebar in screenshot)
    navDashboard: "الرئيسية",
    navInvitations: "الدعوات",
    navEvents: "المناسبات",
    navGuests: "قائمة الضيوف",
    navImport: "استيراد من إكسل",
    navQrCodes: "رموز QR والبطاقات",
    navScanner: "تسجيل الحضور",
    navNotifications: "إشعارات",
    navReports: "التقارير",
    navHistory: "سجل الدخول والمراجعة",
    navEmployees: "حسابات الموظفين",
    navSettings: "الإعدادات",
    
    // Stats (Strictly matching reference image stat cards)
    statTotalGuests: "إجمالي المدعوين",
    statTotalGuestsSub: "المسجلين في القوائم",
    statValidInvitations: "الدعوات الصالحة",
    statValidInvitationsSub: "المتاح لهم بالدخول",
    statCheckedIn: "تم حضورهم",
    statCheckedInSub: "المسجلين في الفعاليات",
    statYetToArrive: "لم يصلوا بعد",
    statYetToArriveSub: "في انتظار الحضور",
    statCancelled: "الدعوات الملغاة",
    statCancelledSub: "إلغاء حتى الآن",
    statAttendanceRate: "نسبة الحضور",
    statAttendanceRateSub: "من إجمالي المدعوين",
    
    // Live Activity & Scanner Card
    recentActivity: "النشاط المباشر للدخول",
    realtimeSync: "مزامنة لحظية",
    viewAll: "عرض الكل",
    noRecentActivity: "لم يتم تسجيل أي حضور حتى الآن.",
    qrCheckinCardTitle: "تسجيل الحضور بالـ QR",
    qrCheckinCardSubtitle: "امسح رمز الاستجابة السريعة للدخول",
    openCamera: "فتح الكاميرا",
    orText: "أو",
    uploadQrImage: "تحميل صورة QR",
    quickScanCardTitle: "امسح رمز QR",
    quickScanCardSubtitle: "لتسجيل الحضور بسرعة",
    dbConnected: "قاعدة البيانات متصلة",
    
    // Events
    eventsTitle: "إدارة الفعاليات والمناسبات",
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
    companions: "المرافقين المسموحين",
    companionsAllowed: "عدد المرافقين",
    notesVipCategory: "الملاحظات / فئة VIP",
    invitationStatus: "حالة الدعوة",
    token: "رمز التحقق (Token)",
    reissue: "إعادة توليد QR",
    cancelInvitation: "إلغاء الدعوة",
    viewBadge: "معاينة بطاقة VIP",
    exportCsv: "تصدير CSV",
    noGuestsMatch: "لا يوجد ضيوف يطابقون خيارات البحث الحالية.",
    confirmCancelGuest: "هل أنت متأكد من إلغاء هذه الدعوة؟ لن يتمكن الضيف من الدخول.",
    confirmReissue: "إعادة إصدار الرمز ستلغي الرمز السابق وتصدر رمزاً فريداً جديداً. هل تريد المتابعة؟",
    
    // Excel Import
    importTitle: "استيراد الضيوف من ملف إكسل",
    importSubtitle: "رفع ملفات .xlsx أو .csv لإضافة الدعوات دفعة واحدة وبسرعة فائقة",
    dropExcel: "اسحب وأفلت ملف الإكسل هنا أو اضغط للاختيار من جهازك",
    supportedFormats: "الصيغ المدعومة: .xlsx, .xls, .csv (الحد الأقصى 5 ميجابايت)",
    validRows: "صفوف صالحة",
    duplicateRows: "مكررة / تنبيهات",
    invalidRows: "صفوف غير صالحة",
    downloadErrors: "تحميل تقرير الأخطاء",
    startImport: "تأكيد واستيراد الضيوف",
    importing: "جاري الاستيراد على دفعات...",
    
    // Badges & QR
    qrTitle: "بطاقات الدعوة وتوليد رموز QR",
    qrSubtitle: "توليد ومعاينة وتحميل بطاقات الدعوة الشخصية برموز فريدة مشفرة",
    selectGuestPreview: "اختر الضيف لمعاينة بطاقة الدعوة",
    downloadPng: "تحميل البطاقة (PNG)",
    downloadPdf: "تحميل كافة البطاقات للطباعة (PDF)",
    badgeVIP: "بطاقة دعوة خاصة VIP",
    
    // History & Terminal
    historyTitle: "سجل عمليات الدخول والمراجعة الأمنية",
    historySubtitle: "سجل كامل ودقيق لكافة عمليات المسح عند البوابات والإجراءات الإدارية",
    auditLogs: "سجل النشاط الإداري والرقابي",
    timestamp: "الوقت",
    employee: "الموظف",
    details: "التفاصيل / السبب",
    validationResult: "نتيجة الفحص",
    filterResult: "جميع النتائج",
    resSuccess: "دخول مصرح (ناجح)",
    resAlreadyUsed: "رمز مستخدم مسبقاً",
    resInvalid: "رمز غير صالح",
    resCancelled: "دعوة ملغاة",
    checkinTitle: "محطة تسجيل الحضور والبوابات",
    scannerIdle: "الكاميرا جاهزة. قم بتوجيه رمز QR داخل إطار الفحص.",
    startCamera: "فتح كاميرا الفحص",
    stopCamera: "إيقاف الكاميرا",
    nextGuestBtn: "فحص الضيف التالي",
    manualEntry: "البحث اليدوي برمز الدعوة",
    validateTokenBtn: "تحقق من الرمز",
    todayStats: "عمليات المسح لك اليوم:",
    
    // Staff Accounts
    staffAccountsTitle: "حسابات موظفي الاستقبال والبوابات",
    staffAccountsSubtitle: "إدارة موظفي البوابات وصلاحيات تسجيل الحضور الميدانية",
    addStaffBtn: "+ إضافة موظف جديد",
    displayName: "الاسم المعروض",
    activeStatus: "الحالة",
    createdDate: "تاريخ الإنشاء",
    createStaffTitle: "إنشاء حساب موظف بوابة",
    staffNameLabel: "اسم الموظف أو البوابة *",
    staffEmailLabel: "البريد الإلكتروني للموظف *",
    staffPasswordLabel: "كلمة المرور *",
    staffPasswordHelp: "6 أحرف أو أرقام على الأقل. سيستخدمها الموظف للدخول إلى محطة تسجيل الحضور.",
    staffNotice: "حساب الموظف يمتلك صلاحيات مقتصرة حصرياً على فحص رموز QR وتسجيل الحضور دون إمكانية الوصول للإدارة أو تعديل القوائم.",
    activeBadge: "نشط",
    inactiveBadge: "معطل",
    toggleStatusBtn: "تغيير الحالة",
    
    // Settings & Firebase
    firebaseTitle: "إعدادات فايربيس والمزامنة السحابية",
    firebaseSubtitle: "ربط مشروع Firebase السحابي الخاص بك أو ضبط المزامنة اللحظية",
    firebaseConnected: "متصل سحابياً بقاعدة البيانات",
    firebaseDemo: "محرك التخزين اللحظي النشط",
    saveConfig: "حفظ والاتصال السحابي",
    pasteConfigHelper: "الصق كود إعدادات Firebase من لوحة تحكم فايربيس (JSON):",
    resetDemoData: "إعادة تعيين البيانات التجريبية",
    resetConfirm: "هل أنت متأكد من رغبتك في إعادة ضبط كافة البيانات إلى الحالة الافتراضية؟",
    firestoreRulesNotice: "قواعد الأمان الرسمية (firestore.rules) مشمولة بالكامل لمنع التلاعب وتطبيق المعاملات الذرية لحماية الدعوات من التكرار.",
    
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
