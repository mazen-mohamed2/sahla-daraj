// Realistic Arabic Egyptian car marketplace mock data.

const egyptianNames = [
  "محمد سعيد","أحمد عبدالله","فاطمة حسن","علي محمود","نور الدين",
  "سارة إبراهيم","خالد عمر","منى حسين","يوسف حمدي","دينا فؤاد",
  "عمرو شريف","هالة مصطفى","طارق زكي","إيمان رضا","أشرف مجدي",
];

const carMakes = [
  { make: "تويوتا", model: "كورولا" },
  { make: "هيونداي", model: "إلنترا" },
  { make: "كيا", model: "سيراتو" },
  { make: "نيسان", model: "صني" },
  { make: "شفروليه", model: "أوبترا" },
  { make: "فولكس فاجن", model: "باسات" },
  { make: "مرسيدس", model: "C200" },
  { make: "بي إم دبليو", model: "320i" },
  { make: "MG", model: "5" },
  { make: "شيري", model: "تيجو" },
];

const cities = [
  "القاهرة","الجيزة","الإسكندرية","الأقصر","أسوان",
  "المنصورة","طنطا","الزقازيق","الإسماعيلية","بورسعيد",
];

const statuses = ["active","pending","sold","banned"] as const;

function pick<T>(arr: readonly T[], i: number) { return arr[i % arr.length]; }
function rand(seed: number) { return ((seed * 9301 + 49297) % 233280) / 233280; }

function egPhone(i: number, base = 100) {
  const prefix = [100, 101, 112, 120, 122][i % 5];
  const rest = (10000000 + i * 137 + base).toString().slice(0, 7);
  return `+20 ${prefix} ${rest.slice(0,3)} ${rest.slice(3)}`;
}

export const mockUsers = Array.from({ length: 32 }).map((_, i) => ({
  id: `U-${1000 + i}`,
  name: pick(egyptianNames, i),
  phone: egPhone(i),
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
    price: 50000 + Math.floor(rand(i + 3) * 1950000),
    city: pick(cities, i),
    seller: pick(egyptianNames, i),
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
  buyer: pick(egyptianNames, i),
  seller: pick(egyptianNames, i + 2),
  amount: 25000 + Math.floor(rand(i) * 1250000),
  fee: 500 + Math.floor(rand(i) * 15000),
  status: (["completed","pending","refunded","completed"] as const)[i % 4],
  createdAt: new Date(2025, 6, (i % 27) + 1).toISOString(),
}));

export const mockDisputes = Array.from({ length: 12 }).map((_, i) => ({
  id: `D-${7000 + i}`,
  buyer: pick(egyptianNames, i),
  seller: pick(egyptianNames, i + 3),
  amount: 100000 + Math.floor(rand(i) * 1500000),
  reason: ["عدم مطابقة الوصف","تأخر التسليم","حالة السيارة","نزاع على السعر"][i % 4],
  status: (["open","in_review","escalated","resolved"] as const)[i % 4] as "open" | "in_review" | "escalated" | "resolved",
  note: "" as string,
  openedAt: new Date(2025, 6, (i % 20) + 1).toISOString(),
}));

export const mockAgencyApplications = Array.from({ length: 8 }).map((_, i) => ({
  id: `A-${9000 + i}`,
  name: ["معرض النخبة","الأهرام موتورز","القاهرة للسيارات","السعد للسيارات","درة النيل","النجم الفضي","معرض الديار","العالمية موتورز"][i],
  contact: pick(egyptianNames, i + 5),
  phone: egPhone(i, 500),
  city: pick(cities, i),
  vehicles: 5 + i * 3,
  status: (["pending","approved","rejected"] as const)[i % 3] as "pending" | "approved" | "rejected",
  submittedAt: new Date(2025, 6, i + 1).toISOString(),
}));

export const mockWithdrawals = Array.from({ length: 10 }).map((_, i) => ({
  id: `W-${8000 + i}`,
  user: pick(egyptianNames, i),
  amount: 5000 + Math.floor(rand(i) * 400000),
  status: (["pending","approved","rejected","pending"] as const)[i % 4],
  requestedAt: new Date(2025, 6, (i % 27) + 1).toISOString(),
}));

export const mockRevenue = [
  { month: "يناير", revenue: 725000, fees: 60000 },
  { month: "فبراير", revenue: 890000, fees: 72500 },
  { month: "مارس", revenue: 1015000, fees: 84000 },
  { month: "أبريل", revenue: 945000, fees: 77000 },
  { month: "مايو", revenue: 1170000, fees: 95500 },
  { month: "يونيو", revenue: 1335000, fees: 107500 },
  { month: "يوليو", revenue: 1490000, fees: 121000 },
];

export const mockKPI = {
  totalRevenue: 7570000,
  activeListings: mockListings.filter((l) => l.status === "active").length,
  pendingEscrows: 47,
  activeUsers: 1284,
  platformFees: 617500,
  escrowBalance: 4460000,
};

export const mockConversations = Array.from({ length: 8 }).map((_, i) => ({
  id: `C-${i}`,
  name: pick(egyptianNames, i),
  lastMessage: ["هل السعر قابل للتفاوض؟","تمام، أراك غدًا","صور إضافية لو سمحت","تم تحويل المبلغ","السيارة متوفرة؟"][i % 5],
  unread: i % 3 === 0 ? (i % 4) + 1 : 0,
  time: `${(9 + i) % 12}:${(15 + i * 7) % 60}`,
}));

export const mockMessages = [
  { id: 1, from: "them", text: "السلام عليكم، السيارة لا زالت متوفرة؟", time: "10:12" },
  { id: 2, from: "me", text: "وعليكم السلام، نعم متوفرة", time: "10:14" },
  { id: 3, from: "them", text: "ممكن نلتقي غدًا في القاهرة؟", time: "10:15" },
  { id: 4, from: "me", text: "بالتأكيد، نحدد الموعد", time: "10:18" },
];

export const mockImportRequests = Array.from({ length: 10 }).map((_, i) => ({
  id: `IR-${3000 + i}`,
  requester: pick(egyptianNames, i),
  car: pick(carMakes, i),
  fromCountry: ["اليابان","ألمانيا","الولايات المتحدة","كوريا"][i % 4],
  budget: 400000 + i * 75000,
  status: (["open","bidding","closed","open"] as const)[i % 4],
  createdAt: new Date(2025, 6, i + 1).toISOString(),
}));

export const mockEscrows = Array.from({ length: 6 }).map((_, i) => ({
  id: `E-${4000 + i}`,
  listing: `${pick(carMakes, i).make} ${pick(carMakes, i).model}`,
  counterparty: pick(egyptianNames, i + 1),
  amount: 300000 + i * 125000,
  status: (["holding","holding","released","disputed","holding","refunded"] as const)[i % 6] as "holding" | "released" | "disputed" | "refunded",
  reason: "" as string,
  createdAt: new Date(2025, 6, i + 2).toISOString(),
}));

export const mockWalletTx = Array.from({ length: 12 }).map((_, i) => ({
  id: `WT-${6000 + i}`,
  type: (["deposit","withdrawal","escrow_hold","escrow_release","fee"] as const)[i % 5],
  amount: 500 + Math.floor(rand(i) * 100000),
  createdAt: new Date(2025, 6, (i % 27) + 1).toISOString(),
}));

export const mockListingDetail = (id: string) => {
  const found = mockListings.find((l) => l.id === id);
  const base = found ?? mockListings[0];
  return {
    id: base.id,
    title: base.title,
    make: base.make,
    model: base.model,
    year: base.year,
    price: base.price,
    mileage: 25000 + (parseInt(base.id.slice(-2)) || 0) * 1500,
    color: ["أبيض لؤلؤي","أسود","فضي","رمادي","أزرق"][base.year % 5],
    fuel: "بنزين",
    transmission: "أوتوماتيك",
    body_type: "سيدان",
    doors: 4,
    drive: "دفع أمامي",
    condition: "ممتاز",
    chassis: `JT2BF22K1W0${(123456 + base.year).toString().slice(0,6)}`,
    description: "سيارة بحالة ممتازة، صيانة دورية، لا حوادث. متوفرة للمعاينة في أي وقت.",
    city: base.city,
    governorate: base.city,
    verification_status: "verified" as const,
    seller: {
      name: base.seller,
      phone: "+20 100 123 4567",
      rating: 4.8,
      sales: 12,
    },
    images: [
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200",
      "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=1200",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200",
    ],
    status: base.status,
    views: base.views,
    createdAt: base.createdAt,
  };
};

// Legacy compatibility — now formats EGP.
export function formatSAR(n: number) {
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(n) + " ج.م";
}
export function formatEGP(n: number) {
  return formatSAR(n);
}
export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(iso));
}
