import React from 'react';

/* ==========================================================================
   DYNAMIC RESTOBAR — ÍCONOS COMPARTIDOS
   SVG inline, sin dependencias nuevas. Usados en Login, Mesas, Admin...
   ========================================================================== */

export const IconMail = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M3.5 6.5 12 13l8.5-6.5" />
  </svg>
);

export const IconLock = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);

export const IconKeypad = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <circle cx="8.2" cy="8.2" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="12" cy="8.2" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="15.8" cy="8.2" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="8.2" cy="12" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="15.8" cy="12" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="12" cy="15.8" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const IconAlert = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
    <path d="M12 9.5v4.2" />
    <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const IconBackspace = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M8.5 5.5h11a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5h-11L3 12l5.5-6.5Z" />
    <path d="m11 9.5 5 5M16 9.5l-5 5" />
  </svg>
);

export const IconGear = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3.5v2.4M12 18.1v2.4M4.6 7.2l2.1 1.2M17.3 15.6l2.1 1.2M4.6 16.8l2.1-1.2M17.3 8.4l2.1-1.2M3.5 12h2.4M18.1 12h2.4" />
  </svg>
);

export const IconCash = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2.5" y="6.5" width="19" height="11" rx="2.2" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M5.5 9v0M18.5 15v0" />
  </svg>
);

export const IconRefresh = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 11a8 8 0 0 0-14.6-4.4M4 13a8 8 0 0 0 14.6 4.4" />
    <path d="M4 4.5V8h3.5M20 19.5V16h-3.5" />
  </svg>
);

export const IconLogout = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9" />
    <path d="M14 8l4 4-4 4M18 12H9" />
  </svg>
);

export const IconUsers = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="9" cy="8.5" r="2.6" />
    <path d="M3.5 19v-1c0-2.2 2.5-3.5 5.5-3.5s5.5 1.3 5.5 3.5v1" />
    <path d="M16 8.2a2.4 2.4 0 1 1 0 4.8" />
    <path d="M15 14.3c1.8.4 3.5 1.4 3.5 3.1v1.1" />
  </svg>
);

export const IconUser = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5 19.5c0-3 3.1-5 7-5s7 2 7 5" />
  </svg>
);

export const IconMapPin = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 21s7-6.4 7-11.5A7 7 0 0 0 5 9.5C5 14.6 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.4" />
  </svg>
);

export const IconPlate = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.4" />
  </svg>
);

export const IconArrowSwap = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 8h13.5M14 4.2 17.8 8 14 11.8" />
    <path d="M20 16H6.5M10 12.2 6.2 16 10 19.8" />
  </svg>
);

export const IconClose = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconArrowLeft = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const IconClock = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const IconEdit = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16.5 4.5a2 2 0 0 1 2.8 2.8L8.5 18.1l-3.8.9.9-3.8Z" />
    <path d="M15 6l3 3" />
  </svg>
);

export const IconTrash = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4.5 7h15M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2" />
    <path d="M6.5 7l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9L17.5 7" />
    <path d="M10.2 11v6M13.8 11v6" />
  </svg>
);

export const IconCheck = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12.5 9.5 17 19 7" />
  </svg>
);

export const IconMinus = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12h14" />
  </svg>
);

export const IconPlus = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconInbox = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3.5 12.5h5l1.3 2.4h4.4l1.3-2.4h5" />
    <path d="M5.5 6h13l2 6.5V17a1.7 1.7 0 0 1-1.7 1.7H5.2A1.7 1.7 0 0 1 3.5 17v-4.5Z" />
  </svg>
);

export const IconNote = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 3.5h9l4 4V19a1.4 1.4 0 0 1-1.4 1.4H6A1.4 1.4 0 0 1 4.6 19V5A1.4 1.4 0 0 1 6 3.5Z" />
    <path d="M14.5 3.7V8h4.3M8 12h8M8 15.5h5" />
  </svg>
);

export const IconGrid = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" />
    <rect x="13" y="13" width="7.5" height="7.5" rx="1.5" />
  </svg>
);

export const IconBuilding = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 20.5V5.5a1.5 1.5 0 0 1 1.5-1.5h7a1.5 1.5 0 0 1 1.5 1.5v15" />
    <path d="M15 10.5h2.5A1.5 1.5 0 0 1 19 12v8.5" />
    <path d="M3.5 20.5h17M8 7.5h1M8 11h1M8 14.5h1M11.5 7.5h1M11.5 11h1M11.5 14.5h1M15.5 14h1.2M15.5 17h1.2" />
  </svg>
);

export const IconTable = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3.5 8.5h17M3.5 13.5h17" />
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <path d="M9 8.5v11" />
  </svg>
);

export const IconBox = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3.5 8 12 3.5 20.5 8 12 12.5 3.5 8Z" />
    <path d="M3.5 8v9L12 21.5 20.5 17V8" />
    <path d="M12 12.5V21.5" />
  </svg>
);

export const IconChefHat = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7 20.5h10M8 20.5v-6M16 20.5v-6" />
    <path d="M6 11.2a3.6 3.6 0 0 1 3.4-4.7 3.2 3.2 0 0 1 5.2-2.4 3.2 3.2 0 0 1 5.2 2.5 3.6 3.6 0 0 1 2.7 5A3.7 3.7 0 0 1 19 14.5H8a3.7 3.7 0 0 1-2-3.3Z" />
  </svg>
);

export const IconBarChart = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 20.5V10M9.5 20.5V6M15 20.5v-8M20.5 20.5V3.5" />
    <path d="M3.5 20.5h17.5" />
  </svg>
);

export const IconTrendingUp = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3.5 17 10 10.5l4 4 6.5-6.5" />
    <path d="M15.5 8h5v5" />
  </svg>
);

export const IconPrinter = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6.5 8.5V4h11v4.5" />
    <rect x="3.5" y="8.5" width="17" height="8" rx="1.6" />
    <path d="M6.5 16v4h11v-4" />
    <path d="M7 12h1.5" />
  </svg>
);

export const IconMenu = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 6.5h16M4 12h16M4 17.5h16" />
  </svg>
);

export const IconWallet = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h11a2 2 0 0 1 2 2V8h1a1.4 1.4 0 0 1 1.4 1.4v6.2A1.4 1.4 0 0 1 19.5 17H5.5a2 2 0 0 1-2-2Z" />
    <circle cx="16.3" cy="12.6" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconAlertTriangle = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
    <path d="M12 9.5v4.2" />
    <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const IconTag = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M11.5 3.5h6a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-.44 1.06l-8 8a1.5 1.5 0 0 1-2.12 0l-6-6a1.5 1.5 0 0 1 0-2.12l8-8A1.5 1.5 0 0 1 11.5 3.5Z" />
    <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconArrowDownCircle = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v9M8.2 12.7 12 16.5l3.8-3.8" />
  </svg>
);

export const IconArrowUpCircle = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16.5v-9M8.2 11.3 12 7.5l3.8 3.8" />
  </svg>
);

export const IconWrench = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14.7 6.3a4 4 0 0 0-5.4 4.6L3.5 16.7a1.8 1.8 0 0 0 2.5 2.5l5.8-5.8a4 4 0 0 0 4.6-5.4l-2.6 2.6-2-2Z" />
  </svg>
);

export const IconPin = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3.5v6M8 6l4 3.5L16 6" />
    <path d="M6 12h12l-1.3 8H7.3L6 12Z" />
  </svg>
);

export const IconInfo = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5" />
    <circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const IconReceipt = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 3.5h12v17l-2.2-1.4L13.6 20.5l-2.2-1.4-2.2 1.4L7 19.1 4.8 20.5V6a2.5 2.5 0 0 1 1.2-2.1Z" />
    <path d="M8.5 8h7M8.5 11.5h7M8.5 15h4" />
  </svg>
);

export const IconQrCode = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3.5" y="3.5" width="6" height="6" rx="1" />
    <rect x="14.5" y="3.5" width="6" height="6" rx="1" />
    <rect x="3.5" y="14.5" width="6" height="6" rx="1" />
    <path d="M14.5 14.5h3v3h3v3h-6v-6Z" />
  </svg>
);