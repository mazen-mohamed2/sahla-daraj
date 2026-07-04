// Realistic Arabic car marketplace mock data.

const arabicNames = [
  "أحمد المطيري","سارة الغامدي","خالد العتيبي","فاطمة الزهراني","محمد الشمري",
  "نورة القحطاني","عبدالله الدوسري","ريم السبيعي","سلطان الحربي","هند البلوي",
  "يوسف الرشيدي","لينا العنزي","بدر الشهراني","منى الجهني","تركي المالكي",
];

const carMakes = [
  { make: "تويوتا", model: "كامري" },
  { make: "لكزس", model: "LX 570" },
  { make: "نيسان", model: "باترول" },
  { make: "هيونداي", model: "سوناتا" },
  { make: "مرسيدس", model: "G63" },
  { make: "شفروليه", model: "تاهو" },
  { make: "فورد", model: "F-150" },
  { make: "جي إم سي", model: "يوكن" },
  { make: "بي إم دبليو", model: "X5" },
  { make: "بورش", model: "كايين" },
];

const cities = ["الرياض","جدة","الدمام","مكة","المدينة","الخبر","تبوك","أبها"];

const statuses = ["active","pending","sold","banned"] as const;

function pick<T>(arr: readonly T[], i: number) { return arr[i % arr.length]; }
function rand(seed: number) { return ((seed * 9301 + 49297) % 233280) / 233280; }

export const mockUsers = Array.from({ length: 32 }).map((_, i) => ({
  id: `U-${1000 + i}`,
  name: pick(arabicNames, i),
  phone: `+9665${(10000000 + i * 137).toString().slice(0, 8)}`,
  role: (["user","user","user","agency","admin"] as const)[i % 5],
  status: (["active","active","active","banned","pending"] as const)[i % 5],
  verified: i % 3 === 0,
  joinedAt: new Date(2024, i % 12, (i % 27) + 1).toISOString(),
}));

export const mockListings = Array.from({ length: 40 }).map((_, i) => {
  const car = pick(carMakes, i);
  return {
    id: `L-${2000 + i}`,
    title: `${car.make} ${car.model} ${2018 + (i % 7)}`,
    make: car.make,
    model: car.model,
    year: 2018 + (i % 7),
    price: 45000 + Math.floor(rand(i + 3) * 400000),
    city: pick(cities, i),
    seller: pick(arabicNames, i),
    status: pick(statuses, i),
    views: Math.floor(rand(i) * 2500),
    createdAt: new Date(2025, (i % 6) + 3, (i % 27) + 1).toISOString(),
    image: `https://images.unsplash.com/photo-${
      ["1494976388531-d1058494cdd8","1550355291-bbee04a92027","1502877338535-766e1452684a","1552519507-da3b142c6e3d","1503376780353-7e6692767b70"][i % 5]
    }?w=400&auto=format&fit=crop`,
  };
});

export const mockPendingListings = mockListings.filter((l) => l.status === "pending");

export const mockTransactions = Array.from({ length: 24 }).map((_, i) => ({
  id: `T-${5000 + i}`,
  buyer: pick(arabicNames, i),
  seller: pick(arabicNames, i + 2),
  amount: 25000 + Math.floor(rand(i) * 250000),
  fee: 500 + Math.floor(rand(i) * 3000),
  status: (["completed","pending","refunded","completed"] as const)[i % 4],
  createdAt: new Date(2025, 6, (i % 27) + 1).toISOString(),
}));

export const mockDisputes = Array.from({ length: 12 }).map((_, i) => ({
  id: `D-${7000 + i}`,
  buyer: pick(arabicNames, i),
  seller: pick(arabicNames, i + 3),
  amount: 50000 + Math.floor(rand(i) * 300000),
  reason: ["عدم مطابقة الوصف","تأخر التسليم","حالة السيارة","نزاع على السعر"][i % 4],
  status: (["open","in_review","escalated","open"] as const)[i % 4],
  openedAt: new Date(2025, 6, (i % 20) + 1).toISOString(),
}));

export const mockAgencyApplications = Array.from({ length: 8 }).map((_, i) => ({
  id: `A-${9000 + i}`,
  name: ["معرض النخبة","الخليج للسيارات","الرياض موتورز","السعد للسيارات","درة الشرق","النجم الفضي","معرض الديار","العالمية موتورز"][i],
  contact: pick(arabicNames, i + 5),
  phone: `+9665${(20000000 + i * 213).toString().slice(0, 8)}`,
  city: pick(cities, i),
  vehicles: 5 + i * 3,
  submittedAt: new Date(2025, 6, i + 1).toISOString(),
}));

export const mockWithdrawals = Array.from({ length: 10 }).map((_, i) => ({
  id: `W-${8000 + i}`,
  user: pick(arabicNames, i),
  amount: 5000 + Math.floor(rand(i) * 80000),
  status: (["pending","approved","rejected","pending"] as const)[i % 4],
  requestedAt: new Date(2025, 6, (i % 27) + 1).toISOString(),
}));

export const mockRevenue = [
  { month: "يناير", revenue: 145000, fees: 12000 },
  { month: "فبراير", revenue: 178000, fees: 14500 },
  { month: "مارس", revenue: 203000, fees: 16800 },
  { month: "أبريل", revenue: 189000, fees: 15400 },
  { month: "مايو", revenue: 234000, fees: 19100 },
  { month: "يونيو", revenue: 267000, fees: 21500 },
  { month: "يوليو", revenue: 298000, fees: 24200 },
];

export const mockKPI = {
  totalRevenue: 1514000,
  activeListings: mockListings.filter((l) => l.status === "active").length,
  pendingEscrows: 47,
  activeUsers: 1284,
  platformFees: 123500,
  escrowBalance: 892000,
};

export const mockConversations = Array.from({ length: 8 }).map((_, i) => ({
  id: `C-${i}`,
  name: pick(arabicNames, i),
  lastMessage: ["هل السعر قابل للتفاوض؟","تمام، أراك غدًا","صور إضافية لو سمحت","تم تحويل المبلغ","السيارة متوفرة؟"][i % 5],
  unread: i % 3 === 0 ? (i % 4) + 1 : 0,
  time: `${(9 + i) % 12}:${(15 + i * 7) % 60}`,
}));

export const mockMessages = [
  { id: 1, from: "them", text: "السلام عليكم، السيارة لا زالت متوفرة؟", time: "10:12" },
  { id: 2, from: "me", text: "وعليكم السلام، نعم متوفرة", time: "10:14" },
  { id: 3, from: "them", text: "ممكن نلتقي غدًا في الرياض؟", time: "10:15" },
  { id: 4, from: "me", text: "بالتأكيد، نحدد الموعد", time: "10:18" },
];

export const mockImportRequests = Array.from({ length: 10 }).map((_, i) => ({
  id: `IR-${3000 + i}`,
  requester: pick(arabicNames, i),
  car: pick(carMakes, i),
  fromCountry: ["اليابان","ألمانيا","الولايات المتحدة","كوريا"][i % 4],
  budget: 80000 + i * 15000,
  status: (["open","bidding","closed","open"] as const)[i % 4],
  createdAt: new Date(2025, 6, i + 1).toISOString(),
}));

export const mockEscrows = Array.from({ length: 6 }).map((_, i) => ({
  id: `E-${4000 + i}`,
  listing: `${pick(carMakes, i).make} ${pick(carMakes, i).model}`,
  counterparty: pick(arabicNames, i + 1),
  amount: 60000 + i * 25000,
  status: (["holding","released","disputed","holding"] as const)[i % 4],
  createdAt: new Date(2025, 6, i + 2).toISOString(),
}));

export const mockWalletTx = Array.from({ length: 12 }).map((_, i) => ({
  id: `WT-${6000 + i}`,
  type: (["deposit","withdrawal","escrow_hold","escrow_release","fee"] as const)[i % 5],
  amount: 500 + Math.floor(rand(i) * 20000),
  createdAt: new Date(2025, 6, (i % 27) + 1).toISOString(),
}));

export function formatSAR(n: number) {
  return new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(n);
}
export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(iso));
}
