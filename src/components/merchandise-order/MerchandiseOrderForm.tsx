"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ZoomIn } from "lucide-react";
import {
  KitOrderCarousel,
  KitOrderCarouselDots,
} from "@/components/kit-order/KitOrderCarousel";
import { KitOrderImageLightbox } from "@/components/kit-order/KitOrderImageLightbox";
import { KitOrderQuoteBreakdown } from "@/components/kit-order/KitOrderQuoteBreakdown";
import { KitSizeGuide } from "@/components/kit-order/KitSizeGuide";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Input, Label, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { apiPost } from "@/lib/client-api";
import {
  MERCHANDISE_ORDER_GENDER_LABELS,
  MERCHANDISE_ORDER_JACKETS,
  MERCHANDISE_ORDER_LAYER_FEE_EUR,
  MERCHANDISE_ORDER_TRAINING_TSHIRT,
  MERCHANDISE_ORDER_TRAINING_TSHIRT_FEE_EUR,
  hasAnyMerchandiseItem,
  merchandiseOrderQuote,
  merchandiseOrderSizesForGender,
  type MerchandiseOrderGender,
} from "@/lib/merchandise-order-config";
import {
  buildMerchandiseOrderDraft,
  clearMerchandiseOrderDraft,
  readMerchandiseOrderDraft,
  writeMerchandiseOrderDraft,
} from "@/lib/merchandise-order-draft";
import {
  formatMembershipEuro,
  type MembershipMerchItem202627,
} from "@/lib/membership-2026-27";
import { cn } from "@/lib/utils";

type Selection = {
  selected: boolean;
  size: string;
  setSelected: React.Dispatch<React.SetStateAction<boolean>>;
  setSize: React.Dispatch<React.SetStateAction<string>>;
};

function ItemCard({
  item,
  selection,
  gender,
  price,
  sizeId,
  onOpen,
}: {
  item: MembershipMerchItem202627;
  selection: Selection;
  gender: MerchandiseOrderGender;
  price: number;
  sizeId: string;
  onOpen: () => void;
}) {
  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden border",
        selection.selected
          ? "border-jackals-red/70 bg-jackals-red/10"
          : "border-white/10 bg-jackals-surface/80",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="group relative aspect-[3/2] w-full bg-zinc-950/80 p-5"
      >
        <Image
          src={item.imageSrc}
          alt={item.imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-5"
        />
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 bg-black/70 px-2 py-1 text-xs text-white">
          <ZoomIn className="h-3 w-3" /> View
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-3 border-t border-white/10 p-4">
        <div className="flex justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white">{item.title}</h3>
            <p className="text-sm text-zinc-500">{item.subtitle}</p>
            <p className="mt-1 font-display text-lg font-bold text-jackals-red-light">
              {formatMembershipEuro(price)}
            </p>
          </div>
          {selection.selected ? (
            <Check className="h-5 w-5 text-jackals-red-light" />
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => selection.setSelected((value) => !value)}
          className={cn(
            "mt-auto border px-3 py-2.5 text-sm font-semibold",
            selection.selected
              ? "border-jackals-red bg-jackals-red/20 text-white"
              : "border-white/15 bg-black/30 text-zinc-200",
          )}
        >
          {selection.selected ? "Remove from order" : "Add to order"}
        </button>
        {selection.selected ? (
          <div>
            <Label htmlFor={sizeId}>{item.title} size</Label>
            <Select
              id={sizeId}
              value={selection.size}
              required
              onChange={(event) => selection.setSize(event.target.value)}
            >
              <option value="">Select size</option>
              {merchandiseOrderSizesForGender(gender).map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function MerchandiseOrderForm() {
  const router = useRouter();
  const [gender, setGender] = useState<MerchandiseOrderGender>("men");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
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
  const [jacketIndex, setJacketIndex] = useState(0);
  const [lightbox, setLightbox] = useState<{
    items: MembershipMerchItem202627[];
    index: number;
  } | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    const draft = readMerchandiseOrderDraft();
    if (draft) {
      setGender(draft.gender);
      setFirstName(draft.firstName);
      setLastName(draft.lastName);
      setEmail(draft.email);
      setPhoneNumber(draft.phoneNumber);
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

  const fields = useMemo(
    () => ({
      gender,
      firstName,
      lastName,
      email,
      phoneNumber,
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
    [
      gender,
      firstName,
      lastName,
      email,
      phoneNumber,
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
    ],
  );

  useEffect(() => {
    if (draftReady) writeMerchandiseOrderDraft(buildMerchandiseOrderDraft(fields));
  }, [draftReady, fields]);

  const quote = merchandiseOrderQuote(fields);
  const jacketSelections: Selection[] = [
    {
      selected: trainingTop,
      size: trainingTopSize,
      setSelected: setTrainingTop,
      setSize: setTrainingTopSize,
    },
    {
      selected: jacketHoodie,
      size: jacketHoodieSize,
      setSelected: setJacketHoodie,
      setSize: setJacketHoodieSize,
    },
    {
      selected: jacketHighCollar,
      size: jacketHighCollarSize,
      setSelected: setJacketHighCollar,
      setSize: setJacketHighCollarSize,
    },
    {
      selected: jacketFullZip,
      size: jacketFullZipSize,
      setSelected: setJacketFullZip,
      setSize: setJacketFullZipSize,
    },
  ];
  const activeJacket = MERCHANDISE_ORDER_JACKETS[jacketIndex]!;
  const activeSelection = jacketSelections[jacketIndex]!;

  const changeGender = (next: MerchandiseOrderGender) => {
    setGender(next);
    const sizes = merchandiseOrderSizesForGender(next) as readonly string[];
    const keep = (size: string) => (sizes.includes(size) ? size : "");
    setTrainingTshirtSize(keep(trainingTshirtSize));
    setTrainingTopSize(keep(trainingTopSize));
    setJacketHoodieSize(keep(jacketHoodieSize));
    setJacketHighCollarSize(keep(jacketHighCollarSize));
    setJacketFullZipSize(keep(jacketFullZipSize));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!hasAnyMerchandiseItem(fields)) {
      setError("Choose at least one merchandise item.");
      return;
    }
    setReviewOpen(true);
  };

  const confirmOrder = async () => {
    setLoading(true);
    setError(null);
    const result = await apiPost<{
      success: boolean;
      paymentUrl: string;
    }>(
      "/api/merchandise-order",
      fields,
      "We couldn't submit your merchandise order. Please try again.",
    );
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    clearMerchandiseOrderDraft();
    router.push(result.data.paymentUrl);
  };

  return (
    <form onSubmit={submit} className="space-y-10">
      {lightbox ? (
        <KitOrderImageLightbox
          items={lightbox.items}
          activeIndex={lightbox.index}
          onClose={() => setLightbox(null)}
          onChangeIndex={(index) =>
            setLightbox((current) => (current ? { ...current, index } : null))
          }
        />
      ) : null}
      <FormError message={error} />

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white">Fit</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Choose men&apos;s or women&apos;s sizing for all selected items.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-black/25 p-1">
          {(["men", "women"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => changeGender(option)}
              className={cn(
                "rounded-md px-4 py-2.5 text-sm font-semibold",
                gender === option
                  ? option === "women"
                    ? "bg-jackals-purple text-white"
                    : "bg-jackals-red text-white"
                  : "text-zinc-400",
              )}
            >
              {MERCHANDISE_ORDER_GENDER_LABELS[option]}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Training t-shirt
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                {formatMembershipEuro(
                  MERCHANDISE_ORDER_TRAINING_TSHIRT_FEE_EUR,
                )}
              </p>
            </div>
            <KitSizeGuide kind="tshirt" />
          </div>
          <ItemCard
            item={MERCHANDISE_ORDER_TRAINING_TSHIRT}
            selection={{
              selected: trainingTshirt,
              size: trainingTshirtSize,
              setSelected: setTrainingTshirt,
              setSize: setTrainingTshirtSize,
            }}
            gender={gender}
            price={MERCHANDISE_ORDER_TRAINING_TSHIRT_FEE_EUR}
            sizeId="merchandise-order-tshirt-size"
            onOpen={() =>
              setLightbox({
                items: [MERCHANDISE_ORDER_TRAINING_TSHIRT],
                index: 0,
              })
            }
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Jackets
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Four styles ·{" "}
                {formatMembershipEuro(MERCHANDISE_ORDER_LAYER_FEE_EUR)} each
              </p>
            </div>
            <KitSizeGuide kind="jacket" />
          </div>
          <KitOrderCarousel
            count={MERCHANDISE_ORDER_JACKETS.length}
            index={jacketIndex}
            onIndexChange={setJacketIndex}
            ariaLabel="Jackets"
            hideDots
          >
            <ItemCard
              item={activeJacket}
              selection={activeSelection}
              gender={gender}
              price={MERCHANDISE_ORDER_LAYER_FEE_EUR}
              sizeId={`merchandise-order-jacket-${jacketIndex}-size`}
              onOpen={() =>
                setLightbox({
                  items: MERCHANDISE_ORDER_JACKETS,
                  index: jacketIndex,
                })
              }
            />
          </KitOrderCarousel>
          <KitOrderCarouselDots
            count={MERCHANDISE_ORDER_JACKETS.length}
            index={jacketIndex}
            onIndexChange={setJacketIndex}
            ariaLabel="Jackets"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white">
            Contact details
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            We&apos;ll use these details for payment and collection updates.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="merchandise-first-name">First name</Label>
            <Input
              id="merchandise-first-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
              required
            />
          </div>
          <div>
            <Label htmlFor="merchandise-last-name">Last name</Label>
            <Input
              id="merchandise-last-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
              required
            />
          </div>
          <div>
            <Label htmlFor="merchandise-email">Email</Label>
            <Input
              id="merchandise-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <Label htmlFor="merchandise-phone">Phone number</Label>
            <Input
              id="merchandise-phone"
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              autoComplete="tel"
              minLength={7}
              maxLength={30}
              required
            />
          </div>
        </div>
      </section>

      <div className="flex justify-center border-t border-white/10 pt-6">
        <Button type="submit" size="lg" className="w-full sm:w-auto sm:min-w-80">
          Review order
        </Button>
      </div>

      <Modal
        open={reviewOpen}
        onClose={() => !loading && setReviewOpen(false)}
        closeOnBackdrop={!loading}
        closeOnEscape={!loading}
        title="Review your merchandise order"
      >
        <div className="space-y-5">
          <FormError message={error} />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Name</dt>
              <dd className="text-white">{firstName} {lastName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Fit</dt>
              <dd className="text-white">
                {MERCHANDISE_ORDER_GENDER_LABELS[gender]}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Email</dt>
              <dd className="break-all text-right text-white">{email}</dd>
            </div>
          </dl>
          <KitOrderQuoteBreakdown items={quote.items} totalEur={quote.totalEur} />
          <div className="flex justify-end gap-2">
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
              disabled={loading}
              onClick={() => void confirmOrder()}
            >
              {loading ? "Sending order…" : "Confirm order"}
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  );
}
