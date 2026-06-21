import type { InstagramPost } from "@/lib/instagram";
import { INSTAGRAM_PROFILE_URL } from "@/lib/instagram";
import { PageContainer } from "@/components/layout/PageShell";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function InstagramPostCard({ post }: { post: InstagramPost }) {
  const alt = post.caption?.slice(0, 120) ?? "Instagram post";

  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="motion-hover-lift group relative aspect-square overflow-hidden border border-white/10 bg-jackals-surface hover:border-jackals-red/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={post.imageUrl}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
      />
      <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 transition-opacity group-hover:opacity-100">
        {post.caption && (
          <p className="line-clamp-2 text-xs text-zinc-200">{post.caption}</p>
        )}
      </div>
      {post.mediaType === "VIDEO" && (
        <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
          Reel
        </span>
      )}
      {post.mediaType === "CAROUSEL_ALBUM" && (
        <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
          Album
        </span>
      )}
    </a>
  );
}

export function InstagramFeed({ posts }: { posts: InstagramPost[] }) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="relative border-t border-white/10 bg-jackals-surface-muted/60 py-16 sm:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(232,34,42,0.07),transparent_70%)]"
      />
      <PageContainer className="relative py-0">
        <AnimateIn>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-jackals-red-light">
                @jackalsvolleyball
              </p>
              <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Latest on Instagram
              </h2>
            </div>
            <a
              href={INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-jackals-red-light transition-colors hover:text-jackals-red"
            >
              Follow us
              <InstagramIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
            </a>
          </div>
        </AnimateIn>
        <StaggerIn
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
          stagger={60}
        >
          {posts.map((post) => (
            <InstagramPostCard key={post.id} post={post} />
          ))}
        </StaggerIn>
      </PageContainer>
    </section>
  );
}
