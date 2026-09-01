"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { FormErrorAlert, useFormErrorFocus } from "@/components/ui/FormMessage";
import { Input, Label, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { apiPost } from "@/lib/client-api";
import { emailTypoError } from "@/lib/email-typo";
import {
  MERCHANDISE_ORDER_JACKETS,
  MERCHANDISE_ORDER_LAYER_FEE_EUR,
  MERCHANDISE_ORDER_SIZES,
  MERCHANDISE_ORDER_TRAINING_TSHIRT,
  MERCHANDISE_ORDER_TRAINING_TSHIRT_FEE_EUR,
  merchandiseOrderQuote,
  merchandiseOrderSizeIssues,
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
  setSelected: (next: boolean) => void;
  setSize: (size: string) => void;
};

function ProductColumn({
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
    <div className="grid gap-4 lg:h-full lg:grid-rows-[auto_minmax(3.5rem,auto)_2rem_minmax(0,1fr)_1.5rem]">
      <h2 className="font-display text-xl font-bold text-white">{title}</h2>
      <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
      <div className="flex items-center">{sizeGuide}</div>
      <div className="flex min-h-0 flex-col">{children}</div>
      <div className="flex h-6 items-center justify-center">{footer}</div>
    </div>
  );
}

function ItemCard({
  item,
  selection,
  price,
  sizeId,
  onOpen,
}: {
  item: MembershipMerchItem202627;
  selection: Selection;
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
        className="group relative aspect-[3/2] w-full shrink-0 bg-zinc-950/80 p-5"
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
      <div className="flex min-h-0 flex-1 flex-col gap-3 border-t border-white/10 p-4">
        <div className="flex justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white">{item.title}</h3>
            <p className="text-sm text-zinc-500">{item.subtitle}</p>
            <p className="mt-1 font-display text-lg font-bold text-jackals-red-light">
              {formatMembershipEuro(price)}
            </p>
          </div>
          {selection.selected ? (
            <Check className="h-5 w-5 shrink-0 text-jackals-red-light" />
          ) : null}
        </div>
        <div className="mt-auto space-y-3">
          <button
            type="button"
            onClick={() => selection.setSelected(!selection.selected)}
            className={cn(
              "w-full border px-3 py-2.5 text-sm font-semibold",
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
                {MERCHANDISE_ORDER_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function MerchandiseOrderForm() {
  const router = useRouter();
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
  const submitErrorRef = useRef<HTMLDivElement>(null);
  const modalErrorRef = useRef<HTMLDivElement>(null);
  useFormErrorFocus(reviewOpen ? null : error, submitErrorRef);
  useFormErrorFocus(reviewOpen ? error : null, modalErrorRef);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    const draft = readMerchandiseOrderDraft();
    if (draft) {
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
    if (draftReady) {
      writeMerchandiseOrderDraft(buildMerchandiseOrderDraft(fields));
    }
  }, [draftReady, fields]);

  const quote = merchandiseOrderQuote(fields);
  const jacketSelections: Selection[] = [
    {
      selected: trainingTop,
      size: trainingTopSize,
      setSelected: (next) => {
        setTrainingTop(next);
        if (!next) setTrainingTopSize("");
      },
      setSize: setTrainingTopSize,
    },
    {
      selected: jacketHoodie,
      size: jacketHoodieSize,
      setSelected: (next) => {
        setJacketHoodie(next);
        if (!next) setJacketHoodieSize("");
      },
      setSize: setJacketHoodieSize,
    },
    {
      selected: jacketHighCollar,
      size: jacketHighCollarSize,
      setSelected: (next) => {
        setJacketHighCollar(next);
        if (!next) setJacketHighCollarSize("");
      },
      setSize: setJacketHighCollarSize,
    },
    {
      selected: jacketFullZip,
      size: jacketFullZipSize,
      setSelected: (next) => {
        setJacketFullZip(next);
        if (!next) setJacketFullZipSize("");
      },
      setSize: setJacketFullZipSize,
    },
  ];
  const activeJacket = MERCHANDISE_ORDER_JACKETS[jacketIndex]!;
  const activeSelection = jacketSelections[jacketIndex]!;

  const validateForReview = (): string | null => {
    const sizeIssues = merchandiseOrderSizeIssues(fields);
    if (sizeIssues.length > 0) return sizeIssues[0]!.message;

    if (!firstName.trim() || !lastName.trim()) {
      return "Enter your first and last name.";
    }
    if (!email.trim()) return "Enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "Enter a valid email address.";
    }
    const typo = emailTypoError(email);
    if (typo) return typo;
    if (phoneNumber.trim().length < 7) {
      return "Enter a valid phone number.";
    }
    return null;
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const message = validateForReview();
    if (message) {
      setError(message);
      setReviewOpen(false);
      return;
    }
    setError(null);
    setReviewOpen(true);
  };

  const confirmOrder = async () => {
    const message = validateForReview();
    if (message) {
      setError(message);
      setReviewOpen(false);
      return;
    }

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
    <form onSubmit={submit} className="space-y-10" noValidate>
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

      <section className="grid gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-8">
        <ProductColumn
          title="Training t-shirt"
          description={
            <>
              Short sleeve club tee ·{" "}
              {formatMembershipEuro(MERCHANDISE_ORDER_TRAINING_TSHIRT_FEE_EUR)}
            </>
          }
          sizeGuide={<KitSizeGuide kind="tshirt" />}
        >
          <ItemCard
            item={MERCHANDISE_ORDER_TRAINING_TSHIRT}
            selection={{
              selected: trainingTshirt,
              size: trainingTshirtSize,
              setSelected: (next) => {
                setTrainingTshirt(next);
                if (!next) setTrainingTshirtSize("");
              },
              setSize: setTrainingTshirtSize,
            }}
            price={MERCHANDISE_ORDER_TRAINING_TSHIRT_FEE_EUR}
            sizeId="merchandise-order-tshirt-size"
            onOpen={() =>
              setLightbox({
                items: [MERCHANDISE_ORDER_TRAINING_TSHIRT],
                index: 0,
              })
            }
          />
        </ProductColumn>

        <ProductColumn
          title="Jackets"
          description={
            <>
              Four styles ·{" "}
              {formatMembershipEuro(MERCHANDISE_ORDER_LAYER_FEE_EUR)} each —
              add as many as you want.
            </>
          }
          sizeGuide={<KitSizeGuide kind="jacket" />}
          footer={
            <KitOrderCarouselDots
              count={MERCHANDISE_ORDER_JACKETS.length}
              index={jacketIndex}
              onIndexChange={setJacketIndex}
              ariaLabel="Jackets"
            />
          }
        >
          <KitOrderCarousel
            count={MERCHANDISE_ORDER_JACKETS.length}
            index={jacketIndex}
            onIndexChange={setJacketIndex}
            ariaLabel="Jackets"
            className="flex h-full max-w-none flex-col"
            hideDots
          >
            <ItemCard
              item={activeJacket}
              selection={activeSelection}
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
        </ProductColumn>
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

      <div className="space-y-4 border-t border-white/10 pt-6">
        <FormErrorAlert message={error} ref={submitErrorRef} />
        <div className="flex justify-center">
          <Button type="submit" size="lg" className="w-full sm:w-auto sm:min-w-80">
            Review order
          </Button>
        </div>
      </div>

      <Modal
        open={reviewOpen}
        onClose={() => !loading && setReviewOpen(false)}
        closeOnBackdrop={!loading}
        closeOnEscape={!loading}
        title="Review your merchandise order"
      >
        <div className="space-y-5">
          <FormErrorAlert message={error} ref={modalErrorRef} />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Name</dt>
              <dd className="text-white">
                {firstName} {lastName}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Email</dt>
              <dd className="break-all text-right text-white">{email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Phone</dt>
              <dd className="text-right text-white">{phoneNumber}</dd>
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
