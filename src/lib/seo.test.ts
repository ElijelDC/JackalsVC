import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  SEO_SITE_NAME,
  absoluteUrl,
  fullPageTitle,
  organizationJsonLd,
  pageMetadata,
} from "@/lib/seo";

describe("seo", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://jackalsvolleyball.com";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it("builds absolute URLs", () => {
    expect(absoluteUrl("/teams")).toBe("https://jackalsvolleyball.com/teams");
    expect(absoluteUrl("events")).toBe("https://jackalsvolleyball.com/events");
  });

  it("builds full page titles", () => {
    expect(fullPageTitle("Events")).toBe(`Events | ${SEO_SITE_NAME}`);
  });

  it("creates canonical public metadata", () => {
    const metadata = pageMetadata({
      title: "Our Teams",
      path: "/teams",
      description: "Teams in Dublin",
    });

    expect(metadata.alternates?.canonical).toBe("https://jackalsvolleyball.com/teams");
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.openGraph?.title).toBe(`Our Teams | ${SEO_SITE_NAME}`);
  });

  it("supports absolute homepage titles", () => {
    const metadata = pageMetadata({
      title: SEO_SITE_NAME,
      absoluteTitle: "Jackals Volleyball Club | Volleyball in Dublin",
      path: "/",
    });

    expect(metadata.title).toEqual({
      absolute: "Jackals Volleyball Club | Volleyball in Dublin",
    });
  });

  it("marks private pages as noindex", () => {
    const metadata = pageMetadata({
      title: "Dashboard",
      noIndex: true,
      path: "/dashboard",
    });

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("builds organization JSON-LD", () => {
    const jsonLd = organizationJsonLd();
    expect(jsonLd["@type"]).toBe("SportsOrganization");
    expect(jsonLd.name).toBe(SEO_SITE_NAME);
    expect(jsonLd.url).toBe("https://jackalsvolleyball.com/");
    expect(jsonLd.address.addressLocality).toBe("Dublin");
  });
});
