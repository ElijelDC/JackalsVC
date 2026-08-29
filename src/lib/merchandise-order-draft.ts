import {
  isValidMerchandiseOrderSize,
  type MerchandiseSelection,
} from "@/lib/merchandise-order-config";

export const MERCHANDISE_ORDER_DRAFT_STORAGE_KEY =
  "jackals-merchandise-order-draft-2026-27";
const VERSION = 2;

export type MerchandiseOrderDraft = MerchandiseSelection & {
  version: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

const asString = (value: unknown) => (typeof value === "string" ? value : "");
const asBoolean = (value: unknown) => value === true;

function itemSize(included: boolean, value: unknown) {
  return included &&
    typeof value === "string" &&
    isValidMerchandiseOrderSize(value)
    ? value
    : "";
}

export function buildMerchandiseOrderDraft(
  fields: Omit<MerchandiseOrderDraft, "version">,
): MerchandiseOrderDraft {
  return { version: VERSION, ...fields };
}

export function parseMerchandiseOrderDraft(
  raw: unknown,
): MerchandiseOrderDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<MerchandiseOrderDraft> & { gender?: string };
  // Accept v1 (had gender) and v2 (unisex only).
  if (value.version !== 1 && value.version !== VERSION) return null;

  const trainingTshirt = asBoolean(value.trainingTshirt);
  const trainingTop = asBoolean(value.trainingTop);
  const jacketHoodie = asBoolean(value.jacketHoodie);
  const jacketHighCollar = asBoolean(value.jacketHighCollar);
  const jacketFullZip = asBoolean(value.jacketFullZip);

  return {
    version: VERSION,
    firstName: asString(value.firstName),
    lastName: asString(value.lastName),
    email: asString(value.email),
    phoneNumber: asString(value.phoneNumber),
    trainingTshirt,
    trainingTshirtSize: itemSize(trainingTshirt, value.trainingTshirtSize),
    trainingTop,
    trainingTopSize: itemSize(trainingTop, value.trainingTopSize),
    jacketHoodie,
    jacketHoodieSize: itemSize(jacketHoodie, value.jacketHoodieSize),
    jacketHighCollar,
    jacketHighCollarSize: itemSize(
      jacketHighCollar,
      value.jacketHighCollarSize,
    ),
    jacketFullZip,
    jacketFullZipSize: itemSize(jacketFullZip, value.jacketFullZipSize),
  };
}

export function merchandiseOrderDraftHasContent(draft: MerchandiseOrderDraft) {
  return (
    Boolean(draft.firstName.trim()) ||
    Boolean(draft.lastName.trim()) ||
    Boolean(draft.email.trim()) ||
    Boolean(draft.phoneNumber.trim()) ||
    draft.trainingTshirt ||
    draft.trainingTop ||
    draft.jacketHoodie ||
    draft.jacketHighCollar ||
    draft.jacketFullZip
  );
}

export function readMerchandiseOrderDraft() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MERCHANDISE_ORDER_DRAFT_STORAGE_KEY);
    return raw ? parseMerchandiseOrderDraft(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeMerchandiseOrderDraft(draft: MerchandiseOrderDraft) {
  if (typeof window === "undefined") return;
  try {
    if (!merchandiseOrderDraftHasContent(draft)) {
      localStorage.removeItem(MERCHANDISE_ORDER_DRAFT_STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      MERCHANDISE_ORDER_DRAFT_STORAGE_KEY,
      JSON.stringify(draft),
    );
  } catch {
    // Private mode / quota — ignore.
  }
}

export function clearMerchandiseOrderDraft() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(MERCHANDISE_ORDER_DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
