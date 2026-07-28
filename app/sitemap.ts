import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const PUBLIC_ROUTES = ["/about", "/login", "/register"];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return PUBLIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));
}
