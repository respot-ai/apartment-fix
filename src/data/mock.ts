export type Priority = "critical" | "high" | "medium" | "low";
export type Owner = "contractor" | "homeowner" | "third-party";
export type Status =
  | "new"
  | "in-progress"
  | "fixed";

export type TradeCategory =
  | "דלתות"
  | "דלת כניסה"
  | "אלומיניום/חלונות"
  | "מטבח"
  | "סניטרי"
  | "מיזוג"
  | "סולארי"
  | "מולטימדיה"
  | "חשמל"
  | "אינסטלציה"
  | "ריצוף"
  | "צבע"
  | "נגרות"
  | "מרפסת";

export type Supplier = {
  id: string;
  name: string;
  domain: TradeCategory;
  phone: string;
  email: string;
  website?: string;
  initials: string;
};

export type ActivityEntry = {
  id: string;
  who: string;
  initials: string;
  text: string;
  at: string;
};

export type Comment = {
  id: string;
  who: string;
  initials: string;
  text: string;
  at: string;
};

export type Defect = {
  id: string;
  title: string;
  room: string;
  location: string;
  trade: TradeCategory;
  priority: Priority;
  owner: Owner;
  status: Status;
  dueDate: string;
  reportedAt: string;
  description: string;
  protocolRef: string;
  supplierId?: string;
  photoBefore: string;
  photoAfter?: string;
  comments: Comment[];
  activity: ActivityEntry[];
};

export const rooms = [
  "כניסה",
  "סלון",
  "מטבח",
  "חדר שינה הורים",
  "חדר ילדים",
  "אמבטיה",
  "שירותים",
  "מרפסת",
  "מסדרון",
  "גג",
];

export const suppliers: Supplier[] = [
  { id: "sup-doors", name: "דלתות לוין", domain: "דלתות", phone: "03-5551010", email: "service@levindoors.co.il", initials: "לו" },
  { id: "sup-entrance", name: "פורטגייט דלתות כניסה", domain: "דלת כניסה", phone: "03-5552020", email: "hello@fortgate.co.il", initials: "פג" },
  { id: "sup-alu", name: "אלוויין מערכות", domain: "אלומיניום/חלונות", phone: "03-5553030", email: "support@aluwin.co.il", website: "aluwin.co.il", initials: "אל" },
  { id: "sup-kitchen", name: "מטבחי דרים", domain: "מטבח", phone: "03-5554040", email: "service@kitchendreams.co.il", initials: "מד" },
  { id: "sup-san", name: "קרמיקה פלוס", domain: "סניטרי", phone: "03-5555050", email: "service@ceramicaplus.co.il", initials: "קפ" },
  { id: "sup-ac", name: "קולטק מיזוג", domain: "מיזוג", phone: "03-5556060", email: "support@cooltech.co.il", initials: "קט" },
  { id: "sup-solar", name: "סאנהיט סולארי", domain: "סולארי", phone: "03-5557070", email: "service@sunheat.co.il", initials: "סה" },
  { id: "sup-mmad", name: "סמארטהום מולטימדיה", domain: "מולטימדיה", phone: "03-5558080", email: "hello@smartmmad.co.il", initials: "סמ" },
];

const photos = [
  "linear-gradient(135deg, #71717a 0%, #3f3f46 100%)",
  "linear-gradient(135deg, #a8a29e 0%, #57534e 100%)",
  "linear-gradient(135deg, #94a3b8 0%, #475569 100%)",
  "linear-gradient(135deg, #d6d3d1 0%, #78716c 100%)",
  "linear-gradient(135deg, #a1a1aa 0%, #52525b 100%)",
  "linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)",
];

export const defects: Defect[] = [
  {
    id: "d-101",
    title: "שריטה עמוקה בכנף דלת הכניסה",
    room: "כניסה",
    location: "צד חיצוני, שליש תחתון",
    trade: "דלת כניסה",
    priority: "critical",
    owner: "third-party",
    status: "new",
    dueDate: "2025-05-28",
    reportedAt: "2025-05-19",
    description: "שריטה אנכית בגובה 14 ס״מ החותכת את הלכה ומגלה את הפריימר. נדרש ליטוש מחדש או החלפה.",
    protocolRef: "עמוד 2, פריט 4",
    supplierId: "sup-entrance",
    photoBefore: photos[0],
    comments: [
      { id: "c1", who: "יוסי (קבלן)", initials: "יו", text: "אישרתי באתר. מעביר לפורטגייט להצעת מחיר.", at: "אתמול, 09:14" },
    ],
    activity: [
      { id: "a1", who: "דייר", initials: "די", text: "פגם דווח עם תמונה", at: "19 במאי, 11:02" },
      { id: "a2", who: "יוסי (קבלן)", initials: "יו", text: "סומן באחריות ספק — פורטגייט", at: "20 במאי, 14:45" },
    ],
  },
  {
    id: "d-102",
    title: "פער איטום בחלון — מורגש זרם אוויר בפינה",
    room: "סלון",
    location: "פינה שמאלית תחתונה של חלון מערבי",
    trade: "אלומיניום/חלונות",
    priority: "critical",
    owner: "third-party",
    status: "in-progress",
    dueDate: "2025-05-30",
    reportedAt: "2025-05-18",
    description: "זרם אוויר מורגש בפינה שמאלית תחתונה של מסגרת החלון. נראה שהאיטום קצר או חסר.",
    protocolRef: "עמוד 4, פריט 3",
    supplierId: "sup-alu",
    photoBefore: photos[2],
    comments: [],
    activity: [
      { id: "a1", who: "דייר", initials: "די", text: "דווח עם תמונה", at: "18 במאי" },
      { id: "a2", who: "אלוויין", initials: "אל", text: "תיאום הגעה ל-30 במאי", at: "20 במאי" },
    ],
  },
  {
    id: "d-103",
    title: "ציר ארון עליון רופף ורועש",
    room: "מטבח",
    location: "ארון מעל הכיור, דלת ימנית",
    trade: "מטבח",
    priority: "medium",
    owner: "third-party",
    status: "new",
    dueDate: "2025-06-02",
    reportedAt: "2025-05-17",
    description: "הדלת הימנית של הארון מעל הכיור נסגרת לא ישר וחורקת. הציר העליון רופף.",
    protocolRef: "עמוד 6, פריט 11",
    supplierId: "sup-kitchen",
    photoBefore: photos[1],
    comments: [],
    activity: [{ id: "a1", who: "דייר", initials: "די", text: "דווח", at: "17 במאי" }],
  },
  {
    id: "d-104",
    title: "סדק באריח רצפה ליד דלת המרפסת",
    room: "חדר שינה הורים",
    location: "סף הכניסה למרפסת",
    trade: "ריצוף",
    priority: "critical",
    owner: "contractor",
    status: "in-progress",
    dueDate: "2025-05-25",
    reportedAt: "2025-05-15",
    description: "סדק אלכסוני נראה לעין באריח שלם בסף המרפסת. סיכון מעידה.",
    protocolRef: "עמוד 3, פריט 9",
    photoBefore: photos[3],
    comments: [],
    activity: [
      { id: "a1", who: "דייר", initials: "די", text: "דווח", at: "15 במאי" },
      { id: "a2", who: "יוסי (קבלן)", initials: "יו", text: "הוזמן אריח, תיקון נקבע", at: "18 במאי" },
    ],
  },
  {
    id: "d-105",
    title: "שקע חשמל רופף בסלון",
    room: "סלון",
    location: "מאחורי יחידת הטלוויזיה, שקע שמאל",
    trade: "חשמל",
    priority: "high",
    owner: "contractor",
    status: "new",
    dueDate: "2025-05-26",
    reportedAt: "2025-05-19",
    description: "השקע לא צמוד לקיר ונע בעת חיבור תקע. פער של כ-3 מ״מ.",
    protocolRef: "עמוד 5, פריט 7",
    photoBefore: photos[4],
    comments: [],
    activity: [{ id: "a1", who: "דייר", initials: "די", text: "דווח", at: "19 במאי" }],
  },
  {
    id: "d-106",
    title: "טפטוף מזגן — רטיבות מתחת ליחידה הפנימית",
    room: "חדר שינה הורים",
    location: "מעל הארון, יחידה פנימית",
    trade: "מיזוג",
    priority: "high",
    owner: "third-party",
    status: "in-progress",
    dueDate: "2025-05-27",
    reportedAt: "2025-05-18",
    description: "כתמי רטיבות מתחת ליחידת המזגן. ייתכן שיפוע צינור ניקוז שגוי.",
    protocolRef: "עמוד 7, פריט 2",
    supplierId: "sup-ac",
    photoBefore: photos[5],
    comments: [],
    activity: [
      { id: "a1", who: "דייר", initials: "די", text: "דווח", at: "18 במאי" },
      { id: "a2", who: "קולטק", initials: "קט", text: "תואם ביקור", at: "20 במאי" },
    ],
  },
  {
    id: "d-107",
    title: "נדרש תיקון צבע בפינת המסדרון",
    room: "מסדרון",
    location: "פינה צפון-מזרחית ליד מתלה",
    trade: "צבע",
    priority: "low",
    owner: "contractor",
    status: "new",
    dueDate: "2025-06-05",
    reportedAt: "2025-05-20",
    description: "שריטה וצ׳יפ קטן בצבע הקיר, כ-5 ס״מ. נדרש תיקון נקודתי.",
    protocolRef: "עמוד 8, פריט 1",
    photoBefore: photos[0],
    comments: [],
    activity: [{ id: "a1", who: "דייר", initials: "די", text: "דווח", at: "20 במאי" }],
  },
  {
    id: "d-108",
    title: "ברז מקלחת דולף מהבסיס",
    room: "אמבטיה",
    location: "ברז קיר במקלחת ראשית",
    trade: "אינסטלציה",
    priority: "critical",
    owner: "contractor",
    status: "new",
    dueDate: "2025-05-24",
    reportedAt: "2025-05-19",
    description: "טפטוף קבוע מבסיס הברז גם כשסגור. כנראה טבעת אטימה.",
    protocolRef: "עמוד 9, פריט 5",
    photoBefore: photos[2],
    comments: [],
    activity: [{ id: "a1", who: "דייר", initials: "די", text: "דווח", at: "19 במאי" }],
  },
  {
    id: "d-109",
    title: "דלת פנימית מתחככת במשקוף",
    room: "חדר שינה הורים",
    location: "דלת חדר השינה",
    trade: "דלתות",
    priority: "medium",
    owner: "third-party",
    status: "new",
    dueDate: "2025-06-01",
    reportedAt: "2025-05-20",
    description: "הדלת מתחככת בחלק העליון של המשקוף בעת סגירה. נדרש שיוף או כיוון ציר.",
    protocolRef: "עמוד 6, פריט 4",
    supplierId: "sup-doors",
    photoBefore: photos[1],
    comments: [],
    activity: [{ id: "a1", who: "דייר", initials: "די", text: "דווח", at: "20 במאי" }],
  },
  {
    id: "d-110",
    title: "לחץ מים חם נמוך — דוד שמש",
    room: "גג",
    location: "קו דוד שמש",
    trade: "סולארי",
    priority: "high",
    owner: "third-party",
    status: "new",
    dueDate: "2025-05-29",
    reportedAt: "2025-05-19",
    description: "לחץ המים החמים נמוך משמעותית מהקרים. ייתכן אוויר בקו או סתימה חלקית.",
    protocolRef: "עמוד 10, פריט 2",
    supplierId: "sup-solar",
    photoBefore: photos[3],
    comments: [],
    activity: [{ id: "a1", who: "דייר", initials: "די", text: "דווח", at: "19 במאי" }],
  },
  {
    id: "d-111",
    title: "תרמוסטט חכם לא מתחבר",
    room: "סלון",
    location: "קיר מסדרון",
    trade: "מולטימדיה",
    priority: "medium",
    owner: "third-party",
    status: "new",
    dueDate: "2025-06-03",
    reportedAt: "2025-05-20",
    description: "התרמוסטט מציג לא מקוון. נדרש אינטגרטור.",
    protocolRef: "עמוד 11, פריט 1",
    supplierId: "sup-mmad",
    photoBefore: photos[4],
    comments: [],
    activity: [{ id: "a1", who: "דייר", initials: "די", text: "דווח", at: "20 במאי" }],
  },
  {
    id: "d-112",
    title: "מעקה מרפסת מתנדנד",
    room: "מרפסת",
    location: "אמצע המעקה",
    trade: "מרפסת",
    priority: "high",
    owner: "contractor",
    status: "fixed",
    dueDate: "2025-05-21",
    reportedAt: "2025-05-12",
    description: "שני עמודים זזו מעט בלחיצת יד. עוגנים הודקו מחדש.",
    protocolRef: "עמוד 4, פריט 8",
    photoBefore: photos[5],
    photoAfter: photos[2],
    comments: [],
    activity: [
      { id: "a1", who: "דייר", initials: "די", text: "דווח", at: "12 במאי" },
      { id: "a2", who: "יוסי (קבלן)", initials: "יו", text: "תוקן — ממתין לאישור", at: "21 במאי" },
    ],
  },
];

export const apartmentLabel = "דירה 402 · סקייוויו רזידנסס";
export const protocolSignedAt = "24 בספטמבר 2024";
