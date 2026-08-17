import {
  KIT_ORDER_GENDERS,
  KIT_ORDER_KIT_TYPES,
  isValidKitOrderSize,
  type KitOrderGender,
  type KitOrderKitType,
} from "@/lib/kit-order-config";

export const KIT_ORDER_DRAFT_STORAGE_KEY = "jackals-kit-order-draft-2026-27";
const KIT_ORDER_DRAFT_VERSION = 1;

export type KitOrderDraft = {
  version: number;
  gender: KitOrderGender;
  kitType: KitOrderKitType | null;
  jerseySize: string;
  shortsSize: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  preferredKitNumber1: string;
  preferredKitNumber2: string;
  trainingTshirt: boolean;
  trainingTshirtSize: string;
  trainingTop: boolean;
  trainingTopSize: string;
  jacketHoodie: boolean;
  jacketHoodieSize: string;
  jacketHighCollar: boolean;
  jacketHighCollarSize: string;
  jacketFullZip: boolean;
  jacketFullZipSize: string;
};

function isGender(value: unknown): value is KitOrderGender {
  return (
    typeof value === "string" &&
    (KIT_ORDER_GENDERS as readonly string[]).includes(value)
  );
}

function isKitType(value: unknown): value is KitOrderKitType {
  return (
    typeof value === "string" &&
    (KIT_ORDER_KIT_TYPES as readonly string[]).includes(value)
  );
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asBoolean(value: unknown) {
  return value === true;
}

function merchSize(gender: KitOrderGender, included: boolean, size: unknown) {
  if (!included || typeof size !== "string") return "";
  return isValidKitOrderSize(gender, size) ? size : "";
}

export function buildKitOrderDraft(
  fields: Omit<KitOrderDraft, "version">,
): KitOrderDraft {
  return { version: KIT_ORDER_DRAFT_VERSION, ...fields };
}

export function parseKitOrderDraft(raw: unknown): KitOrderDraft | null {
  if (!raw || typeof raw !== "object") return null;

  const value = raw as Partial<KitOrderDraft>;
  if (value.version !== KIT_ORDER_DRAFT_VERSION) return null;
  if (!isGender(value.gender)) return null;

  const gender = value.gender;
  const kitType = isKitType(value.kitType) ? value.kitType : null;
  const trainingTshirt = asBoolean(value.trainingTshirt);
  const trainingTop = asBoolean(value.trainingTop);
  const jacketHoodie = asBoolean(value.jacketHoodie);
  const jacketHighCollar = asBoolean(value.jacketHighCollar);
  const jacketFullZip = asBoolean(value.jacketFullZip);

  return {
    version: KIT_ORDER_DRAFT_VERSION,
    gender,
    kitType,
    jerseySize: merchSize(gender, true, value.jerseySize),
    shortsSize: merchSize(gender, true, value.shortsSize),
    firstName: asString(value.firstName),
    lastName: asString(value.lastName),
    email: asString(value.email),
    phoneNumber: asString(value.phoneNumber),
    preferredKitNumber1: asString(value.preferredKitNumber1),
    preferredKitNumber2: asString(value.preferredKitNumber2),
    trainingTshirt,
    trainingTshirtSize: merchSize(gender, trainingTshirt, value.trainingTshirtSize),
    trainingTop,
    trainingTopSize: merchSize(gender, trainingTop, value.trainingTopSize),
    jacketHoodie,
    jacketHoodieSize: merchSize(gender, jacketHoodie, value.jacketHoodieSize),
    jacketHighCollar,
    jacketHighCollarSize: merchSize(
      gender,
      jacketHighCollar,
      value.jacketHighCollarSize,
    ),
    jacketFullZip,
    jacketFullZipSize: merchSize(gender, jacketFullZip, value.jacketFullZipSize),
  };
}

export function kitOrderDraftHasContent(draft: KitOrderDraft) {
  return (
    draft.kitType != null ||
    draft.gender !== "men" ||
    Boolean(draft.jerseySize) ||
    Boolean(draft.shortsSize) ||
    Boolean(draft.firstName.trim()) ||
    Boolean(draft.lastName.trim()) ||
    Boolean(draft.email.trim()) ||
    Boolean(draft.phoneNumber.trim()) ||
    Boolean(draft.preferredKitNumber1) ||
    Boolean(draft.preferredKitNumber2) ||
    draft.trainingTshirt ||
    draft.trainingTop ||
    draft.jacketHoodie ||
    draft.jacketHighCollar ||
    draft.jacketFullZip
  );
}

export function readKitOrderDraft(): KitOrderDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(KIT_ORDER_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return parseKitOrderDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeKitOrderDraft(draft: KitOrderDraft) {
  if (typeof window === "undefined") return;

  try {
    if (!kitOrderDraftHasContent(draft)) {
      localStorage.removeItem(KIT_ORDER_DRAFT_STORAGE_KEY);
      return;
    }

    localStorage.setItem(KIT_ORDER_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Private mode / quota — ignore.
  }
}

export function clearKitOrderDraft() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(KIT_ORDER_DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
