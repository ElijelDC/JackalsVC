import Image from "next/image";
import Link from "next/link";
import { ShowcaseHero } from "@/components/layout/ShowcaseHero";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { TournamentGalleryLink } from "@/components/tournaments/TournamentGalleryLink";
import type { TournamentGalleryAlbumTeaser } from "@/components/tournaments/TournamentGalleryLink";
import { TournamentPlayoffs } from "@/components/tournaments/TournamentPlayoffs";
import { TournamentPodium } from "@/components/tournaments/TournamentPodium";
import { TournamentPoolMatches } from "@/components/tournaments/TournamentPoolMatches";
import { TournamentRulesCta } from "@/components/tournaments/TournamentRulesCta";
import { TournamentScheduleTable } from "@/components/tournaments/TournamentScheduleTable";
import { TournamentStandingsTables } from "@/components/tournaments/TournamentStandingsTables";
import { TournamentWinnerGallery } from "@/components/tournaments/TournamentWinnerGallery";
import { Button } from "@/components/ui/Button";
import { PUBLIC_PATHS } from "@/lib/public-paths";
import type { TournamentArchiveEntry } from "@/lib/tournament-archive";
import type { TournamentHubConfig } from "@/lib/tournament-hub-config";

export function TournamentHubPage({
  hub,
  archive,
  galleryAlbum,
  eventId,
  rulesPdfUrl,
  standingsUrl,
}: {
  hub: TournamentHubConfig;
  archive: TournamentArchiveEntry | null;
  galleryAlbum: TournamentGalleryAlbumTeaser | null;
  eventId: string | null;
  rulesPdfUrl: string | null;
  standingsUrl: string | null;
}) {
  const rulesPreviewPath = `/tournaments/${hub.slug}/rules`;
  const completed = archive?.status === "completed";
  const backHref = completed
    ? "/tournaments"
    : eventId
      ? `/calendar/${eventId}?from=events-tournaments`
      : "/events";
  const backLabel = completed
    ? "← Back to Our Tournaments"
    : "← Back to tournament entry";

  const champion = archive?.podium.find((p) => p.place === 1);
  const shieldChampion = archive?.brackets
    ?.find((b) => b.key === "rose-shield")
    ?.podium.find((p) => p.place === 1);
  const heroTitle =
    archive?.heroTitle ??
    (completed ? "Tournament" : "Mixed 2v2");
  const heroHighlight =
    archive?.heroHighlight ?? (completed ? "Champions" : "Beach");

  return (
    <>
      <ShowcaseHero
        title={heroTitle}
        highlight={heroHighlight}
        description={
          <>
            <span className="mb-4 block text-sm font-semibold uppercase tracking-[0.2em] text-jackals-red-light">
              {hub.title}
            </span>
            {completed && archive ? (
              <>
                {archive.dateLabel} · {archive.location}.
                {champion ? (
                  <>
                    {" "}
                    {archive.brackets?.length ? "Rose Cup: " : "Champions: "}
                    <span className="font-semibold text-white">
                      {champion.team}
                    </span>
                    .
                  </>
                ) : null}
                {shieldChampion ? (
                  <>
                    {" "}
                    Rose Shield:{" "}
                    <span className="font-semibold text-white">
                      {shieldChampion.team}
                    </span>
                    .
                  </>
                ) : null}{" "}
                Full podium, play-off scores, and pool standings below.
              </>
            ) : (
              <>
                {hub.subtitle}. Full pool schedule, court assignments, and the
                official rules — all in one place.
              </>
            )}
          </>
        }
        action={
          <AnimateIn
            immediate
            variant="scale-in"
            className="mb-8 flex justify-center"
          >
            {completed ? (
              <div className="flex flex-col items-center gap-3">
                <span className="inline-flex bg-jackals-red px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white">
                  Competition ended
                </span>
                <div className="relative h-20 w-20 sm:h-24 sm:w-24">
                  <Image
                    src={PUBLIC_PATHS.brand.logoTransparent}
                    alt="Jackals Volleyball Club"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            ) : (
              <div className="relative h-24 w-24 sm:h-28 sm:w-28">
                <Image
                  src={PUBLIC_PATHS.brand.logoTransparent}
                  alt="Jackals Volleyball Club"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            )}
          </AnimateIn>
        }
        cta={
          completed && archive ? (
            <div className="flex flex-col items-center gap-2 text-sm text-zinc-400">
              <p>{archive.location}</p>
              <Link
                href={backHref}
                className="text-zinc-500 transition-colors hover:text-jackals-red-light"
              >
                {backLabel}
              </Link>
            </div>
          ) : undefined
        }
      />

      {completed && archive ? (
        <>
          <TournamentPodium
            podium={archive.podium}
            brackets={archive.brackets}
          />
          <TournamentPlayoffs
            playoffs={archive.playoffs}
            brackets={archive.brackets}
          />
          <TournamentStandingsTables
            pools={archive.pools}
            advanceNote={archive.poolAdvanceNote}
            highlight={archive.poolHighlight}
            description={
              archive.poolHighlight === "cup-and-shield"
                ? "Round-robin results — top two from each pool into the Rose Cup, bottom two into the Rose Shield."
                : undefined
            }
          />
          {archive.winnerPhotos.length > 0 ? (
            <TournamentWinnerGallery photos={archive.winnerPhotos} />
          ) : null}
          {galleryAlbum ? (
            <TournamentGalleryLink album={galleryAlbum} />
          ) : null}
          {archive.poolMatches?.length ? (
            <TournamentPoolMatches matches={archive.poolMatches} />
          ) : null}
        </>
      ) : (
        <section className="relative overflow-hidden border-b border-white/10 bg-jackals-red/5 py-12 sm:py-14">
          <div
            aria-hidden
            className="motion-ambient-orb pointer-events-none absolute right-1/4 top-0 h-40 w-40 rounded-full bg-jackals-red/10 blur-3xl"
          />
          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
            <AnimateIn variant="pop-in">
              <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
                Tournament rules
              </p>
              <h2 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
                Rules &amp; format
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                Preview the official rules online, or download a PDF for your
                team.
              </p>
              <p className="mt-3 text-sm text-zinc-500">{hub.location}</p>
            </AnimateIn>

            {rulesPdfUrl ? (
              <StaggerIn
                className="mx-auto mt-8"
                stagger={80}
                variant="pop"
              >
                <TournamentRulesCta
                  rulesPdfUrl={rulesPdfUrl}
                  rulesPreviewPath={rulesPreviewPath}
                />
              </StaggerIn>
            ) : (
              <p className="mt-8 text-sm text-zinc-500">
                Rules document coming soon.
              </p>
            )}

            <Link
              href={backHref}
              className="mt-6 inline-block text-sm text-zinc-500 transition-colors hover:text-jackals-red-light"
            >
              {backLabel}
            </Link>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <AnimateIn variant="blur-in" className="mb-10 text-center sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
            {completed ? "How the day ran" : "Match day"}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
            Pool play schedule
          </h2>
          {hub.scheduleNote ? (
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              {hub.scheduleNote}
            </p>
          ) : null}
        </AnimateIn>

        <AnimateIn variant="spring-up">
          <TournamentScheduleTable schedule={hub.schedule} />
        </AnimateIn>

        {completed && rulesPdfUrl ? (
          <AnimateIn variant="spring-up" className="mt-12 sm:mt-14">
            <div className="border border-white/10 bg-white/[0.02] px-5 py-6 text-center sm:px-8 sm:py-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
                Tournament rules
              </p>
              <h3 className="mt-3 font-display text-xl font-bold text-white sm:text-2xl">
                Rules &amp; format
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
                Preview the official rules online, or download a PDF.
              </p>
              <TournamentRulesCta
                rulesPdfUrl={rulesPdfUrl}
                rulesPreviewPath={rulesPreviewPath}
                layout="stacked"
              />
            </div>
          </AnimateIn>
        ) : null}

        {!completed && standingsUrl ? (
          <AnimateIn variant="spring-up" className="mt-12 sm:mt-14">
            <div className="border border-white/10 bg-white/[0.02] px-5 py-6 text-center sm:px-8 sm:py-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
                Live standings
              </p>
              <h3 className="mt-3 font-display text-xl font-bold text-white sm:text-2xl">
                Pool standings on Reclub
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
                Results and live standings are updated on Reclub as matches are
                finalized. Open the competition there to follow the table.
              </p>
              <a
                href={standingsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex"
              >
                <Button size="lg" variant="outline">
                  View standings on Reclub
                </Button>
              </a>
            </div>
          </AnimateIn>
        ) : null}

        {completed ? (
          <div className="mt-10 text-center">
            <Link
              href="/tournaments"
              className="text-sm text-zinc-500 transition-colors hover:text-jackals-red-light"
            >
              ← Back to Our Tournaments
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
}
