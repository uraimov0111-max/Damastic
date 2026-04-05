export const ALLIANCE_TABS = [
  { id: "overview", label: "Dashboard" },
  { id: "drivers", label: "Haydovchilar" },
  { id: "vehicles", label: "Mashinalar" },
  { id: "routes", label: "Liniyalar" },
  { id: "queues", label: "Navbat" },
  { id: "payments", label: "Elektron to'lov" },
  { id: "cash", label: "Naqd tushum" },
];

export const DEFAULT_CENTER = [41.311081, 69.240562];

export function money(value) {
  return `${new Intl.NumberFormat("uz-UZ").format(Number(value ?? 0))} so'm`;
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
