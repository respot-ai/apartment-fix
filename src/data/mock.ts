export type Priority = "critical" | "high" | "medium" | "low";
export type Owner = "contractor" | "homeowner" | "supplier" | "third-party";
export type Status =
  | "new"
  | "agreed"
  | "scheduled"
  | "in-progress"
  | "fixed"
  | "verified"
  | "disputed";
export type AgreementState =
  | "waiting-contractor"
  | "waiting-homeowner"
  | "locked"
  | "disputed";

export type TradeCategory =
  | "Doors"
  | "Entrance Door"
  | "Aluminum/Windows"
  | "Kitchen"
  | "Sanitary"
  | "AC"
  | "Solar"
  | "MMAD"
  | "Electrical"
  | "Plumbing"
  | "Flooring"
  | "Paint"
  | "Carpentry"
  | "Balcony";

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
  agreement: AgreementState;
  dueDate: string; // ISO
  reportedAt: string;
  description: string;
  protocolRef: string;
  supplierId?: string;
  photoBefore: string; // CSS gradient key
  photoAfter?: string;
  comments: Comment[];
  activity: ActivityEntry[];
};

export const suppliers: Supplier[] = [
  { id: "sup-doors", name: "Levin Interior Doors", domain: "Doors", phone: "+972-3-555-1010", email: "service@levindoors.co", initials: "LD" },
  { id: "sup-entrance", name: "FortGate Entry Systems", domain: "Entrance Door", phone: "+972-3-555-2020", email: "hello@fortgate.co", initials: "FG" },
  { id: "sup-alu", name: "AluWin Systems", domain: "Aluminum/Windows", phone: "+972-3-555-3030", email: "support@aluwin.co", website: "aluwin.co", initials: "AW" },
  { id: "sup-kitchen", name: "Kitchen Dreams", domain: "Kitchen", phone: "+972-3-555-4040", email: "service@kitchendreams.co", initials: "KD" },
  { id: "sup-san", name: "Ceramica Plus", domain: "Sanitary", phone: "+972-3-555-5050", email: "service@ceramicaplus.co", initials: "CP" },
  { id: "sup-ac", name: "CoolTech Climate", domain: "AC", phone: "+972-3-555-6060", email: "support@cooltech.co", initials: "CT" },
  { id: "sup-solar", name: "SunHeat Solar", domain: "Solar", phone: "+972-3-555-7070", email: "service@sunheat.co", initials: "SH" },
  { id: "sup-mmad", name: "SmartHome MMAD", domain: "MMAD", phone: "+972-3-555-8080", email: "hello@smartmmad.co", initials: "SM" },
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
    title: "Deep scratch on main door leaf exterior",
    room: "Entrance",
    location: "Outer face, lower third",
    trade: "Entrance Door",
    priority: "critical",
    owner: "supplier",
    status: "new",
    agreement: "waiting-contractor",
    dueDate: "2025-05-28",
    reportedAt: "2025-05-19",
    description: "A 14cm vertical scratch running through the lacquer finish, exposing primer. Likely from delivery handling. Needs full leaf re-finish or replacement.",
    protocolRef: "Page 2, Item 4",
    supplierId: "sup-entrance",
    photoBefore: photos[0],
    comments: [
      { id: "c1", who: "Yossi (Contractor)", initials: "YH", text: "Confirmed on site. Will route to FortGate for re-finish quote.", at: "Yesterday, 09:14" },
    ],
    activity: [
      { id: "a1", who: "Homeowner", initials: "HO", text: "Defect reported with photo", at: "May 19, 11:02" },
      { id: "a2", who: "Yossi (Contractor)", initials: "YH", text: "Marked supplier responsibility — FortGate", at: "May 20, 14:45" },
    ],
  },
  {
    id: "d-102",
    title: "Window seal gap — draft felt at corner",
    room: "Living Room",
    location: "Bottom-left of west window frame",
    trade: "Aluminum/Windows",
    priority: "critical",
    owner: "supplier",
    status: "agreed",
    agreement: "locked",
    dueDate: "2025-05-30",
    reportedAt: "2025-05-18",
    description: "Draft felt at bottom-left corner of the window frame. Seal appears truncated or missing. Light visible from inside in evening.",
    protocolRef: "Page 4, Item 3",
    supplierId: "sup-alu",
    photoBefore: photos[2],
    comments: [
      { id: "c1", who: "Yossi (Contractor)", initials: "YH", text: "AluWin scheduled for May 30, 10:00.", at: "2 days ago" },
    ],
    activity: [
      { id: "a1", who: "Homeowner", initials: "HO", text: "Reported with photo", at: "May 18" },
      { id: "a2", who: "Yossi (Contractor)", initials: "YH", text: "Accepted responsibility", at: "May 19" },
      { id: "a3", who: "AluWin", initials: "AW", text: "Appointment confirmed for May 30", at: "May 20" },
    ],
  },
  {
    id: "d-103",
    title: "Upper cabinet hinge loose and noisy",
    room: "Kitchen",
    location: "Cabinet above sink, right door",
    trade: "Kitchen",
    priority: "medium",
    owner: "supplier",
    status: "scheduled",
    agreement: "locked",
    dueDate: "2025-06-02",
    reportedAt: "2025-05-17",
    description: "Right door of the upper cabinet above the sink swings unevenly and squeaks. Top hinge appears under-torqued.",
    protocolRef: "Page 6, Item 11",
    supplierId: "sup-kitchen",
    photoBefore: photos[1],
    comments: [],
    activity: [
      { id: "a1", who: "Homeowner", initials: "HO", text: "Reported", at: "May 17" },
    ],
  },
  {
    id: "d-104",
    title: "Crack in floor tile near balcony door",
    room: "Master Bedroom",
    location: "Threshold to balcony",
    trade: "Flooring",
    priority: "critical",
    owner: "contractor",
    status: "in-progress",
    agreement: "locked",
    dueDate: "2025-05-25",
    reportedAt: "2025-05-15",
    description: "Visible diagonal crack across one full tile at the balcony threshold. Tripping hazard.",
    protocolRef: "Page 3, Item 9",
    photoBefore: photos[3],
    comments: [],
    activity: [
      { id: "a1", who: "Homeowner", initials: "HO", text: "Reported", at: "May 15" },
      { id: "a2", who: "Yossi (Contractor)", initials: "YH", text: "Tile ordered, fix scheduled", at: "May 18" },
    ],
  },
  {
    id: "d-105",
    title: "Outlet wobbly in living room",
    room: "Living Room",
    location: "Behind TV unit, left socket",
    trade: "Electrical",
    priority: "high",
    owner: "contractor",
    status: "new",
    agreement: "waiting-contractor",
    dueDate: "2025-05-26",
    reportedAt: "2025-05-19",
    description: "Socket is not flush — moves visibly when plugging in. Faceplate gap of ~3mm.",
    protocolRef: "Page 5, Item 7",
    photoBefore: photos[4],
    comments: [],
    activity: [{ id: "a1", who: "Homeowner", initials: "HO", text: "Reported", at: "May 19" }],
  },
  {
    id: "d-106",
    title: "AC drip — moisture under indoor unit",
    room: "Master Bedroom",
    location: "Above wardrobe, indoor unit",
    trade: "AC",
    priority: "high",
    owner: "supplier",
    status: "agreed",
    agreement: "locked",
    dueDate: "2025-05-27",
    reportedAt: "2025-05-18",
    description: "Light water staining under the indoor AC unit. Possible drain line slope issue.",
    protocolRef: "Page 7, Item 2",
    supplierId: "sup-ac",
    photoBefore: photos[5],
    comments: [],
    activity: [
      { id: "a1", who: "Homeowner", initials: "HO", text: "Reported", at: "May 18" },
      { id: "a2", who: "CoolTech", initials: "CT", text: "Visit scheduled", at: "May 20" },
    ],
  },
  {
    id: "d-107",
    title: "Paint touch-up needed at hallway corner",
    room: "Hallway",
    location: "NE corner near coat hook",
    trade: "Paint",
    priority: "low",
    owner: "contractor",
    status: "new",
    agreement: "waiting-contractor",
    dueDate: "2025-06-05",
    reportedAt: "2025-05-20",
    description: "Scuff and small chip in wall paint, ~5cm. Needs spot touch-up.",
    protocolRef: "Page 8, Item 1",
    photoBefore: photos[0],
    comments: [],
    activity: [{ id: "a1", who: "Homeowner", initials: "HO", text: "Reported", at: "May 20" }],
  },
  {
    id: "d-108",
    title: "Shower mixer leaks at base",
    room: "Bath 1",
    location: "Wall mixer, main shower",
    trade: "Plumbing",
    priority: "critical",
    owner: "contractor",
    status: "new",
    agreement: "waiting-contractor",
    dueDate: "2025-05-24",
    reportedAt: "2025-05-19",
    description: "Steady drip from base of mixer when shut off. Sealing ring suspected.",
    protocolRef: "Page 9, Item 5",
    photoBefore: photos[2],
    comments: [],
    activity: [{ id: "a1", who: "Homeowner", initials: "HO", text: "Reported", at: "May 19" }],
  },
  {
    id: "d-109",
    title: "Interior door rubs on frame",
    room: "Master Bedroom",
    location: "Bedroom door",
    trade: "Doors",
    priority: "medium",
    owner: "supplier",
    status: "new",
    agreement: "waiting-homeowner",
    dueDate: "2025-06-01",
    reportedAt: "2025-05-20",
    description: "Door drags on top of frame when closing. Likely needs planing or hinge adjustment.",
    protocolRef: "Page 6, Item 4",
    supplierId: "sup-doors",
    photoBefore: photos[1],
    comments: [
      { id: "c1", who: "Yossi (Contractor)", initials: "YH", text: "Proposed routing this to Levin Doors. Please confirm.", at: "Today, 10:02" },
    ],
    activity: [
      { id: "a1", who: "Homeowner", initials: "HO", text: "Reported", at: "May 20" },
      { id: "a2", who: "Yossi (Contractor)", initials: "YH", text: "Proposed supplier assignment", at: "Today" },
    ],
  },
  {
    id: "d-110",
    title: "Solar water heater pressure low",
    room: "Roof",
    location: "Boiler line",
    trade: "Solar",
    priority: "high",
    owner: "supplier",
    status: "new",
    agreement: "waiting-contractor",
    dueDate: "2025-05-29",
    reportedAt: "2025-05-19",
    description: "Hot water pressure noticeably lower than cold. Suspect air in solar loop or partial blockage.",
    protocolRef: "Page 10, Item 2",
    supplierId: "sup-solar",
    photoBefore: photos[3],
    comments: [],
    activity: [{ id: "a1", who: "Homeowner", initials: "HO", text: "Reported", at: "May 19" }],
  },
  {
    id: "d-111",
    title: "Smart thermostat not pairing",
    room: "Living Room",
    location: "Hallway wall",
    trade: "MMAD",
    priority: "medium",
    owner: "supplier",
    status: "new",
    agreement: "waiting-homeowner",
    dueDate: "2025-06-03",
    reportedAt: "2025-05-20",
    description: "MMAD thermostat shows offline. Needs setup by integrator.",
    protocolRef: "Page 11, Item 1",
    supplierId: "sup-mmad",
    photoBefore: photos[4],
    comments: [],
    activity: [{ id: "a1", who: "Homeowner", initials: "HO", text: "Reported", at: "May 20" }],
  },
  {
    id: "d-112",
    title: "Balcony railing wobble",
    room: "Balcony",
    location: "Mid-section",
    trade: "Balcony",
    priority: "high",
    owner: "contractor",
    status: "fixed",
    agreement: "locked",
    dueDate: "2025-05-21",
    reportedAt: "2025-05-12",
    description: "Two posts moved slightly under hand pressure. Anchors retightened.",
    protocolRef: "Page 4, Item 8",
    photoBefore: photos[5],
    photoAfter: photos[2],
    comments: [],
    activity: [
      { id: "a1", who: "Homeowner", initials: "HO", text: "Reported", at: "May 12" },
      { id: "a2", who: "Yossi (Contractor)", initials: "YH", text: "Fixed — awaiting verification", at: "May 21" },
    ],
  },
];

export const apartmentLabel = "Apartment 402 · Skyview Residences";
export const protocolSignedAt = "Sept 24, 2024";
