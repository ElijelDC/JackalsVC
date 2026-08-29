import {
  MERCHANDISE_ORDER_GENDERS,
  isValidKitOrderSize,
  type MerchandiseOrderGender,
  type MerchandiseSelection,
} from "@/lib/merchandise-order-config";

export const MERCHANDISE_ORDER_DRAFT_STORAGE_KEY =
  "jackals-merchandise-order-draft-2026-27";
const VERSION = 1;

export type MerchandiseOrderDraft = MerchandiseSelection & {
  version: number;
  gender: MerchandiseOrderGender;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

const asString = (value: unknown) => (typeof value === "string" ? value : "");
const asBoolean = (value: unknown) => value === true;

function itemSize(
  gender: MerchandiseOrderGender,
  included: boolean,
  value: unknown,
) {
  return included && typeof value === "string" && isValidKitOrderSize(gender, value)
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
  const value = raw as Partial<MerchandiseOrderDraft>;
  if (value.version !== VERSION) return null;
  if (
    typeof value.gender !== "string" ||
    !(MERCHANDISE_ORDER_GENDERS as readonly string[]).includes(value.gender)
  ) {
    return null;
  }

  const gender = value.gender as MerchandiseOrderGender;
  const trainingTshirt = asBoolean(value.trainingTshirt);
  const trainingTop = asBoolean(value.trainingTop);
  const jacketHoodie = asBoolean(value.jacketHoodie);
  const jacketHighCollar = asBoolean(value.jacketHighCollar);
  const jacketFullZip = asBoolean(value.jacketFullZip);

  return {
    version: VERSION,
    gender,
    firstName: asString(value.firstName),
    lastName: asString(value.lastName),
    email: asString(value.email),
    phoneNumber: asString(value.phoneNumber),
    trainingTshirt,
    trainingTshirtSize: itemSize(gender, trainingTshirt, value.trainingTshirtSize),
    trainingTop,
    trainingTopSize: itemSize(gender, trainingTop, value.trainingTopSize),
    jacketHoodie,
    jacketHoodieSize: itemSize(gender, jacketHoodie, value.jacketHoodieSize),
    jacketHighCollar,
    jacketHighCollarSize: itemSize(
      gender,
      jacketHighCollar,
      value.jacketHighCollarSize,
    ),
    jacketFullZip,
    jacketFullZipSize: itemSize(gender, jacketFullZip, value.jacketFullZipSize),
  };
}

export function merchandiseOrderDraftHasContent(draft: MerchandiseOrderDraft) {
  return (
    draft.gender !== "men" ||
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
