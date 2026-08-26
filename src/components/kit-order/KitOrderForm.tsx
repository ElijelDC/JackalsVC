"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Shirt, ZoomIn } from "lucide-react";
import { KitOrderCarousel, KitOrderCarouselDots } from "@/components/kit-order/KitOrderCarousel";
import { KitOrderImageLightbox } from "@/components/kit-order/KitOrderImageLightbox";
import { KitSizeGuide } from "@/components/kit-order/KitSizeGuide";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Input, Label, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { apiPost } from "@/lib/client-api";
import {
  KIT_ORDER_FEE_EUR,
  KIT_ORDER_GENDER_LABELS,
  KIT_ORDER_JACKETS,
  KIT_ORDER_KIT_TYPE_HINTS,
  KIT_ORDER_KIT_TYPE_LABELS,
  KIT_ORDER_KIT_TYPES,
  KIT_ORDER_LAYER_FEE_EUR,
  KIT_ORDER_NUMBER_CLASH_COPY,
  KIT_ORDER_TRAINING_TSHIRT,
  KIT_ORDER_TRAINING_TSHIRT_FEE_EUR,
  hasAnyJersey,
  hasAnyShorts,
  isPlayerKitPhoto,
  jerseyBackName,
  kitOrderPhotosFor,
  kitOrderPiecesLabel,
  kitOrderQuote,
  kitOrderSizesForGender,
  piecesFromKitSelection,
  type KitOrderGender,
  type KitOrderKitType,
} from "@/lib/kit-order-config";
import {
  formatMembershipEuro,
  type MembershipMerchItem202627,
} from "@/lib/membership-2026-27";
import {
  buildKitOrderDraft,
  clearKitOrderDraft,
  readKitOrderDraft,
  writeKitOrderDraft,
} from "@/lib/kit-order-draft";
import { cn } from "@/lib/utils";

function SizeSelect({
  id,
  value,
  gender,
  disabled,
  required,
  onChange,
}: {
  id: string;
  value: string;
  gender: KitOrderGender;
  disabled?: boolean;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  const sizes = kitOrderSizesForGender(gender);

  return (
    <Select
      id={id}
      value={value}
      required={required}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Select size</option>
      {sizes.map((size) => (
        <option key={size} value={size}>
          {size}
        </option>
      ))}
    </Select>
  );
}

function MerchPhoto({
  item,
  frame,
  onOpen,
}: {
  item: MembershipMerchItem202627;
  frame: "kit" | "layer";
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group relative w-full bg-zinc-950/80 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-jackals-red",
        frame === "kit" ? "aspect-[7/6] p-5 sm:p-7" : "aspect-[3/2] p-4 sm:p-6",
      )}
      aria-label={`View full size: ${item.title}, ${item.subtitle}`}
    >
      <span className="relative block h-full w-full">
        <Image
          src={item.imageSrc}
          alt={item.imageAlt}
          fill
          className="object-contain object-center"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </span>
      <span className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 border border-white/20 bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm transition-colors group-hover:border-jackals-red/50 group-hover:text-jackals-red-light sm:text-[11px]">
        <ZoomIn className="h-3 w-3 shrink-0" />
        View full size
      </span>
    </button>
  );
}

function OptionalExtraColumn({
  title,
  description,
  sizeGuide,
  footer,
  children,
}: {
  title: string;
  description: ReactNode;
  sizeGuide: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-4 lg:h-full lg:grid-rows-[auto_minmax(4.5rem,auto)_2rem_minmax(0,1fr)_1.5rem]">
      <h2 className="font-display text-xl font-bold text-white">{title}</h2>
      <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
      <div className="flex items-center">{sizeGuide}</div>
      <div className="flex min-h-0 flex-col">{children}</div>
      <div className="flex h-6 items-center justify-center">{footer}</div>
    </div>
  );
}

function ExtraItemCard({
  item,
  selected,
  priceLabel,
  disabled,
  sizeId,
  sizeValue,
  gender,
  onToggle,
  onOpenImage,
  onSizeChange,
}: {
  item: MembershipMerchItem202627;
  selected: boolean;
  priceLabel: string;
  disabled?: boolean;
  sizeId: string;
  sizeValue: string;
  gender: KitOrderGender;
  onToggle: () => void;
  onOpenImage: () => void;
  onSizeChange: (value: string) => void;
}) {
  return (
    <article
      className={cn(
        "flex h-full flex-col border transition",
        selected
          ? "border-jackals-red/70 bg-jackals-red/10 shadow-[0_0_24px_rgba(232,34,42,0.18)]"
          : "border-white/10 bg-jackals-surface/80",
      )}
    >
      <MerchPhoto item={item} frame="layer" onOpen={onOpenImage} />
      <div className="flex flex-1 flex-col gap-3 border-t border-white/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-white">{item.title}</p>
            <p className="mt-1 text-sm text-zinc-500">{item.subtitle}</p>
            <p className="mt-1 font-display text-lg font-bold text-jackals-red-light">
              {priceLabel}
            </p>
          </div>
          {selected ? (
            <Check className="h-4 w-4 shrink-0 text-jackals-red-light" />
          ) : null}
        </div>
        <div className="mt-auto space-y-3">
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className={cn(
            "w-full border px-3 py-2.5 text-sm font-semibold transition",
            selected
              ? "border-jackals-red/70 bg-jackals-red/20 text-white"
              : "border-white/15 bg-black/30 text-zinc-200 hover:border-white/30 hover:text-white",
          )}
        >
          {selected ? "Remove from order" : "Add to order"}
        </button>
        {selected ? (
          <div>
            <Label htmlFor={sizeId}>{item.title} size</Label>
            <SizeSelect
              id={sizeId}
              value={sizeValue}
              gender={gender}
              disabled={disabled}
              required
              onChange={onSizeChange}
            />
          </div>
        ) : null}
        </div>
      </div>
    </article>
  );
}

function MatchKitSlide({
  item,
  isWomen,
  onOpen,
}: {
  item: MembershipMerchItem202627;
  isWomen: boolean;
  onOpen: () => void;
}) {
  const isPlayer = isPlayerKitPhoto(item);

  return (
    <article className="border border-jackals-red/70 bg-jackals-surface/90 shadow-[0_0_24px_rgba(232,34,42,0.12)]">
      <div
        aria-hidden
        className={cn(
          "h-1.5 w-full",
          isWomen
            ? "bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600"
            : "bg-gradient-to-r from-jackals-red via-jackals-red-light to-jackals-red",
        )}
      />
      <MerchPhoto item={item} frame="kit" onOpen={onOpen} />
      <div className="space-y-1 border-t border-white/10 p-4">
        <p className="font-medium text-white">
          {isPlayer ? "Player kit" : "Libero kit"}
        </p>
        <p className="text-sm text-zinc-500">{item.subtitle}</p>
      </div>
    </article>
  );
}

function KitTypePicker({
  value,
  disabled,
  onChange,
}: {
  value: KitOrderKitType | null;
  disabled?: boolean;
  onChange: (value: KitOrderKitType) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Match kit type"
      aria-required="true"
      className={cn(
        "space-y-3 rounded-xl border p-3 sm:p-4",
        value
          ? "border-white/10 bg-black/20"
          : "border-jackals-red/80 bg-jackals-red/10 shadow-[0_0_32px_rgba(232,34,42,0.22)]",
      )}
    >
      <div>
        <p className="text-base font-semibold text-white">
          {value ? "Match kit selected" : "Choose your match kit"}
        </p>
        <p className="mt-1 text-sm text-zinc-300">
          {value
            ? "You can change this any time before submitting."
            : "Required — tap Player, Libero, or Both to continue."}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {KIT_ORDER_KIT_TYPES.map((id) => {
          const selected = value === id;
          const price = formatMembershipEuro(
            KIT_ORDER_FEE_EUR * (id === "both" ? 2 : 1),
          );

          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(id)}
              className={cn(
                "flex items-start justify-between gap-2 border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jackals-red",
                selected
                  ? "border-jackals-red bg-jackals-red/15 shadow-[0_0_24px_rgba(232,34,42,0.2)]"
                  : "border-white/20 bg-black/40 hover:border-white/50 hover:bg-white/5",
              )}
            >
              <span>
                <span className="block font-semibold text-white">
                  {KIT_ORDER_KIT_TYPE_LABELS[id]}
                </span>
                <span className="mt-0.5 block text-xs text-zinc-400">
                  {KIT_ORDER_KIT_TYPE_HINTS[id]}
                </span>
                <span className="mt-1 block font-display text-lg font-bold text-jackals-red-light">
                  {price}
                </span>
              </span>
              {selected ? (
                <Check className="h-5 w-5 shrink-0 text-jackals-red-light" />
              ) : (
                <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Select
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function KitOrderForm() {
  const [gender, setGender] = useState<KitOrderGender>("men");
  const [kitType, setKitType] = useState<KitOrderKitType | null>(null);
  const [kitSlideIndex, setKitSlideIndex] = useState(0);
  const [jacketSlideIndex, setJacketSlideIndex] = useState(0);
  const [jerseySize, setJerseySize] = useState("");
  const [shortsSize, setShortsSize] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [preferredKitNumber1, setPreferredKitNumber1] = useState("");
  const [preferredKitNumber2, setPreferredKitNumber2] = useState("");
  const [trainingTshirt, setTrainingTshirt] = useState(false);
  const [trainingTshirtSize, setTrainingTshirtSize] = useState("");
  const [trainingTop, setTrainingTop] = useState(false);
  const [trainingTopSize, setTrainingTopSize] = useState("");
  const [jacketHoodie, setJacketHoodie] = useState(false);
  const [jacketHoodieSize, setJacketHoodieSize] = useState("");
  const [jacketHighCollar, setJacketHighCollar] = useState(false);
  const [jacketHighCollarSize, setJacketHighCollarSize] = useState("");
  const [jacketFullZip, setJacketFullZip] = useState(false);
  const [jacketFullZipSize, setJacketFullZipSize] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [lightbox, setLightbox] = useState<{
    items: MembershipMerchItem202627[];
    index: number;
  } | null>(null);

  useEffect(() => {
    const draft = readKitOrderDraft();
    if (draft) {
      setGender(draft.gender);
      setKitType(draft.kitType);
      setJerseySize(draft.jerseySize);
      setShortsSize(draft.shortsSize);
      setFirstName(draft.firstName);
      setLastName(draft.lastName);
      setEmail(draft.email);
      setPhoneNumber(draft.phoneNumber);
      setPreferredKitNumber1(draft.preferredKitNumber1);
      setPreferredKitNumber2(draft.preferredKitNumber2);
      setTrainingTshirt(draft.trainingTshirt);
      setTrainingTshirtSize(draft.trainingTshirtSize);
      setTrainingTop(draft.trainingTop);
      setTrainingTopSize(draft.trainingTopSize);
      setJacketHoodie(draft.jacketHoodie);
      setJacketHoodieSize(draft.jacketHoodieSize);
      setJacketHighCollar(draft.jacketHighCollar);
      setJacketHighCollarSize(draft.jacketHighCollarSize);
      setJacketFullZip(draft.jacketFullZip);
      setJacketFullZipSize(draft.jacketFullZipSize);
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady || success) return;

    writeKitOrderDraft(
      buildKitOrderDraft({
        gender,
        kitType,
        jerseySize,
        shortsSize,
        firstName,
        lastName,
        email,
        phoneNumber,
        preferredKitNumber1,
        preferredKitNumber2,
        trainingTshirt,
        trainingTshirtSize,
        trainingTop,
        trainingTopSize,
        jacketHoodie,
        jacketHoodieSize,
        jacketHighCollar,
        jacketHighCollarSize,
        jacketFullZip,
        jacketFullZipSize,
      }),
    );
  }, [
    draftReady,
    success,
    gender,
    kitType,
    jerseySize,
    shortsSize,
    firstName,
    lastName,
    email,
    phoneNumber,
    preferredKitNumber1,
    preferredKitNumber2,
    trainingTshirt,
    trainingTshirtSize,
    trainingTop,
    trainingTopSize,
    jacketHoodie,
    jacketHoodieSize,
    jacketHighCollar,
    jacketHighCollarSize,
    jacketFullZip,
    jacketFullZipSize,
  ]);

  const kitPhotos = useMemo(
    () => (kitType ? kitOrderPhotosFor(gender, kitType) : []),
    [gender, kitType],
  );
  const jackets = KIT_ORDER_JACKETS;
  const activeJacket = jackets[jacketSlideIndex] ?? jackets[0]!;
  const printedName = jerseyBackName(lastName);
  const isWomen = gender === "women";
  const pieces = kitType
    ? piecesFromKitSelection(kitType, "full")
    : {
        playerJersey: false,
        playerShorts: false,
        liberoJersey: false,
        liberoShorts: false,
      };
  const { playerJersey, playerShorts, liberoJersey, liberoShorts } = pieces;
  const wantsJersey = hasAnyJersey(pieces);
  const wantsShorts = hasAnyShorts(pieces);
  const piecesLabel = kitOrderPiecesLabel(pieces);
  const quote = kitType
    ? kitOrderQuote({
        kitType,
        jerseySize,
        shortsSize,
        trainingTshirt,
        trainingTshirtSize,
        trainingTop,
        trainingTopSize,
        jacketHoodie,
        jacketHoodieSize,
        jacketHighCollar,
        jacketHighCollarSize,
        jacketFullZip,
        jacketFullZipSize,
      })
    : null;

  const activeKitIndex = Math.min(
    kitSlideIndex,
    Math.max(kitPhotos.length - 1, 0),
  );
  const activeKit = kitPhotos[activeKitIndex];

  const jacketSelections = [
    {
      selected: trainingTop,
      size: trainingTopSize,
      sizeId: "kit-order-quarter-zip-size",
      onToggle: () => setTrainingTop((current) => !current),
      onSizeChange: setTrainingTopSize,
    },
    {
      selected: jacketHoodie,
      size: jacketHoodieSize,
      sizeId: "kit-order-hoodie-size",
      onToggle: () => setJacketHoodie((current) => !current),
      onSizeChange: setJacketHoodieSize,
    },
    {
      selected: jacketHighCollar,
      size: jacketHighCollarSize,
      sizeId: "kit-order-collar-size",
      onToggle: () => setJacketHighCollar((current) => !current),
      onSizeChange: setJacketHighCollarSize,
    },
    {
      selected: jacketFullZip,
      size: jacketFullZipSize,
      sizeId: "kit-order-full-zip-size",
      onToggle: () => setJacketFullZip((current) => !current),
      onSizeChange: setJacketFullZipSize,
    },
  ] as const;
  const activeJacketSelection = jacketSelections[jacketSlideIndex] ?? jacketSelections[0]!;

  const applyGender = (next: KitOrderGender) => {
    setGender(next);
    const nextSizes = kitOrderSizesForGender(next);
    const keep = (size: string) =>
      (nextSizes as readonly string[]).includes(size) ? size : "";
    setJerseySize((current) => keep(current));
    setShortsSize((current) => keep(current));
    setTrainingTshirtSize((current) => keep(current));
    setTrainingTopSize((current) => keep(current));
    setJacketHoodieSize((current) => keep(current));
    setJacketHighCollarSize((current) => keep(current));
    setJacketFullZipSize((current) => keep(current));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!kitType) {
      setError("Choose a match kit — player, libero, or both.");
      document
        .getElementById("kit-order-match-kit")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setReviewOpen(true);
  };

  const confirmOrder = async () => {
    if (!kitType) return;
    setError(null);
    setLoading(true);

    const result = await apiPost<{
      success: boolean;
      message: string;
      paymentUrl?: string;
    }>(
      "/api/kit-order",
      {
        firstName,
        lastName,
        email,
        phoneNumber,
        gender,
        playerJersey,
        playerShorts,
        liberoJersey,
        liberoShorts,
        jerseySize: wantsJersey ? jerseySize : "",
        shortsSize: wantsShorts ? shortsSize : "",
        preferredKitNumber1,
        preferredKitNumber2,
        trainingTshirt,
        trainingTshirtSize: trainingTshirt ? trainingTshirtSize : "",
        trainingTop,
        trainingTopSize: trainingTop ? trainingTopSize : "",
        jacketHoodie,
        jacketHoodieSize: jacketHoodie ? jacketHoodieSize : "",
        jacketHighCollar,
        jacketHighCollarSize: jacketHighCollar ? jacketHighCollarSize : "",
        jacketFullZip,
        jacketFullZipSize: jacketFullZip ? jacketFullZipSize : "",
      },
      "We couldn't submit your kit order. Please try again.",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    clearKitOrderDraft();
    setReviewOpen(false);
    setPaymentUrl(result.data.paymentUrl ?? null);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="border border-jackals-red/35 bg-jackals-red/10 px-5 py-8 text-center">
        <p className="font-display text-2xl font-bold uppercase tracking-[0.08em] text-white">
          Order received
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          Thanks {firstName}. We&apos;ve logged your{" "}
          {piecesLabel.toLowerCase() || "order"}
          {wantsJersey && jerseySize ? `, jersey ${jerseySize}` : ""}
          {wantsShorts && shortsSize ? `, shorts ${shortsSize}` : ""}
          {printedName && wantsJersey
            ? `, with ${printedName} on the back of the jersey`
            : ""}
          .
        </p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {KIT_ORDER_NUMBER_CLASH_COPY}
        </p>
        {paymentUrl ? (
          <div className="mt-6">
            <Link
              href={paymentUrl}
              className="inline-flex items-center justify-center rounded-lg bg-jackals-red px-6 py-3 text-sm font-semibold text-white transition hover:bg-jackals-red-light"
            >
              Pay & upload receipt
            </Link>
            <p className="mt-3 text-xs text-zinc-500">
              You&apos;ll see your full order breakdown, the club IBAN, and where
              to upload your bank transfer screenshot.
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {lightbox ? (
        <KitOrderImageLightbox
          items={lightbox.items}
          activeIndex={lightbox.index}
          onClose={() => setLightbox(null)}
          onChangeIndex={(index) =>
            setLightbox((current) => (current ? { ...current, index } : current))
          }
        />
      ) : null}

      <FormError message={error} />

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white">Fit</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Choose the cut that matches the kit you want to wear.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-black/25 p-1">
          {(
            [
              { id: "men" as const, label: "Men's" },
              { id: "women" as const, label: "Women's" },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => applyGender(option.id)}
              className={cn(
                "rounded-md px-4 py-2.5 text-sm font-semibold transition",
                gender === option.id
                  ? option.id === "women"
                    ? "bg-jackals-purple text-white shadow-sm"
                    : "bg-jackals-red text-white shadow-sm"
                  : "text-zinc-400 hover:text-white",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section id="kit-order-match-kit" className="space-y-4 scroll-mt-24">
        <div>
          <h2 className="font-display text-xl font-bold text-white">
            Match kit
            <span className="ml-2 text-sm font-semibold uppercase tracking-wider text-jackals-red-light">
              Required
            </span>
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {formatMembershipEuro(KIT_ORDER_FEE_EUR)} per full kit (jersey +
            shorts), due late August. Jersey and shorts sizes can be different.
          </p>
        </div>

        <KitTypePicker
          value={kitType}
          disabled={loading}
          onChange={(next) => {
            setKitType(next);
            setKitSlideIndex(0);
            setError(null);
          }}
        />

        {kitType && activeKit ? (
          <KitOrderCarousel
            count={kitPhotos.length}
            index={activeKitIndex}
            onIndexChange={setKitSlideIndex}
            ariaLabel="Match kit"
          >
            <MatchKitSlide
              key={activeKit.id}
              item={activeKit}
              isWomen={isWomen}
              onOpen={() =>
                setLightbox({ items: kitPhotos, index: activeKitIndex })
              }
            />
          </KitOrderCarousel>
        ) : null}

        {kitType ? (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <div>
            <Label htmlFor="kit-order-jersey-size">Jersey size</Label>
            <SizeSelect
              id="kit-order-jersey-size"
              value={jerseySize}
              gender={gender}
              disabled={loading}
              required
              onChange={setJerseySize}
            />
          </div>
          <div>
            <Label htmlFor="kit-order-shorts-size">Shorts size</Label>
            <SizeSelect
              id="kit-order-shorts-size"
              value={shortsSize}
              gender={gender}
              disabled={loading}
              required
              onChange={setShortsSize}
            />
          </div>
          <div className="pb-2 sm:pb-3">
            <KitSizeGuide gender={gender} />
          </div>
        </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white">
            Player details
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Last name is printed on the back of the jersey. Choose two kit
            numbers in case your first choice is taken.{" "}
            {KIT_ORDER_NUMBER_CLASH_COPY}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="kit-order-last-name">Last name</Label>
            <Input
              id="kit-order-last-name"
              name="lastName"
              autoComplete="family-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
              maxLength={18}
              disabled={loading}
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              Featured on the back of the jersey.
            </p>
          </div>
          <div>
            <Label htmlFor="kit-order-first-name">First name</Label>
            <Input
              id="kit-order-first-name"
              name="firstName"
              autoComplete="given-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="kit-order-email">Email</Label>
            <Input
              id="kit-order-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="kit-order-phone">Phone number</Label>
            <Input
              id="kit-order-phone"
              name="phoneNumber"
              type="tel"
              autoComplete="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              required
              minLength={7}
              maxLength={30}
              disabled={loading}
            />
          </div>
        </div>

        <div className="grid gap-4 border border-white/10 bg-black/20 p-4 sm:grid-cols-[minmax(0,1fr)_11rem] sm:items-center">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="kit-order-number-1">Kit number — 1st preference</Label>
              <Input
                id="kit-order-number-1"
                name="preferredKitNumber1"
                inputMode="numeric"
                min={1}
                max={99}
                value={preferredKitNumber1}
                onChange={(event) => setPreferredKitNumber1(event.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="kit-order-number-2">Kit number — 2nd preference</Label>
              <Input
                id="kit-order-number-2"
                name="preferredKitNumber2"
                inputMode="numeric"
                min={1}
                max={99}
                value={preferredKitNumber2}
                onChange={(event) => setPreferredKitNumber2(event.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center border border-dashed border-white/10 bg-zinc-950/70 px-3 py-4 text-center">
            <Shirt
              className={cn(
                "mb-2 h-5 w-5",
                isWomen ? "text-purple-300" : "text-jackals-red-light",
              )}
              aria-hidden
            />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Jersey back
            </p>
            <p className="mt-1 font-display text-lg font-bold tracking-[0.18em] text-white">
              {printedName || "NAME"}
            </p>
            <p className="font-display text-3xl font-bold text-white">
              {preferredKitNumber1 || "00"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-8">
        <OptionalExtraColumn
          title="Training top"
          description={
            <>
              Optional. Training t-shirt{" "}
              {formatMembershipEuro(KIT_ORDER_TRAINING_TSHIRT_FEE_EUR)}.
            </>
          }
          sizeGuide={<KitSizeGuide kind="tshirt" />}
        >
          <ExtraItemCard
            item={KIT_ORDER_TRAINING_TSHIRT}
            selected={trainingTshirt}
            priceLabel={formatMembershipEuro(KIT_ORDER_TRAINING_TSHIRT_FEE_EUR)}
            disabled={loading}
            sizeId="kit-order-tshirt-size"
            sizeValue={trainingTshirtSize}
            gender={gender}
            onToggle={() => setTrainingTshirt((current) => !current)}
            onOpenImage={() =>
              setLightbox({
                items: [KIT_ORDER_TRAINING_TSHIRT],
                index: 0,
              })
            }
            onSizeChange={setTrainingTshirtSize}
          />
        </OptionalExtraColumn>

        <OptionalExtraColumn
          title="Jackets"
          description={
            <>
              Optional. Browse the four jackets and add as many as you want —{" "}
              {formatMembershipEuro(KIT_ORDER_LAYER_FEE_EUR)} each at member price.
            </>
          }
          sizeGuide={<KitSizeGuide kind="jacket" />}
          footer={
            <KitOrderCarouselDots
              count={jackets.length}
              index={jacketSlideIndex}
              onIndexChange={setJacketSlideIndex}
              ariaLabel="Jackets"
            />
          }
        >
          <KitOrderCarousel
            count={jackets.length}
            index={jacketSlideIndex}
            onIndexChange={setJacketSlideIndex}
            ariaLabel="Jackets"
            className="flex h-full max-w-none flex-col"
            hideDots
          >
            <ExtraItemCard
              key={activeJacket.id}
              item={activeJacket}
              selected={activeJacketSelection.selected}
              priceLabel={formatMembershipEuro(KIT_ORDER_LAYER_FEE_EUR)}
              disabled={loading}
              sizeId={activeJacketSelection.sizeId}
              sizeValue={activeJacketSelection.size}
              gender={gender}
              onToggle={activeJacketSelection.onToggle}
              onOpenImage={() =>
                setLightbox({ items: jackets, index: jacketSlideIndex })
              }
              onSizeChange={activeJacketSelection.onSizeChange}
            />
          </KitOrderCarousel>
        </OptionalExtraColumn>
      </section>

      <div className="flex justify-center border-t border-white/10 pt-6">
        <Button
          type="submit"
          size="lg"
          className="w-full px-8 py-3.5 text-base sm:w-auto sm:min-w-[20rem] sm:px-12 sm:py-4 sm:text-lg"
          disabled={loading}
        >
          Review order
        </Button>
      </div>

      {kitType && quote ? (
        <Modal
          open={reviewOpen}
          onClose={() => {
            if (!loading) setReviewOpen(false);
          }}
          closeOnBackdrop={!loading}
          closeOnEscape={!loading}
          title="Review your order"
          description={
            <p className="text-sm leading-relaxed text-zinc-400">
              Check the items and total before we log the order.
            </p>
          }
          className="max-w-[min(100%,32rem)]"
        >
          <div className="space-y-5">
            {error ? <FormError message={error} /> : null}

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Fit</dt>
                <dd className="text-right text-white">
                  {KIT_ORDER_GENDER_LABELS[gender]}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Kit</dt>
                <dd className="text-right text-white">
                  {KIT_ORDER_KIT_TYPE_LABELS[kitType]}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Jersey size</dt>
                <dd className="text-right text-white">{jerseySize || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Shorts size</dt>
                <dd className="text-right text-white">{shortsSize || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Name / numbers</dt>
                <dd className="text-right text-white">
                  {printedName || "NAME"} · {preferredKitNumber1 || "—"}
                  {preferredKitNumber2 ? ` / ${preferredKitNumber2}` : ""}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Email</dt>
                <dd className="text-right break-all text-white">{email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Phone</dt>
                <dd className="text-right text-white">{phoneNumber}</dd>
              </div>
            </dl>

            <ul className="divide-y divide-white/10 border-y border-white/10">
              {quote.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">{item.label}</p>
                    {item.details.length > 0 ? (
                      <div className="mt-0.5 space-y-0.5 text-sm text-zinc-500">
                        {item.details.map((detail) => (
                          <p key={detail}>{detail}</p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <p className="shrink-0 font-semibold text-white">
                    {formatMembershipEuro(item.amountEur)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="flex items-baseline justify-between gap-4">
              <p className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Total
              </p>
              <p className="font-display text-3xl font-bold text-white">
                {formatMembershipEuro(quote.totalEur)}
              </p>
            </div>
            <p className="text-xs text-zinc-500">
              Kit payment is due late August. Optional extras are at member
              price.
            </p>
            <p className="text-sm text-zinc-400">{KIT_ORDER_NUMBER_CLASH_COPY}</p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => setReviewOpen(false)}
              >
                Go back
              </Button>
              <Button
                type="button"
                size="lg"
                disabled={loading}
                onClick={() => void confirmOrder()}
              >
                {loading ? "Sending order…" : "Confirm order"}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </form>
  );
}
