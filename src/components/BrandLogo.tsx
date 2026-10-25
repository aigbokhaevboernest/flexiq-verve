import logo from "@/assets/logo.png";

// Start downloading the logo as soon as this file is bundled/imported,
// long before any page mounts, so it is already cached when it's needed.
if (typeof window !== "undefined") {
  const preload = new Image();
  preload.decoding = "async";
  preload.src = logo;
}

export const BrandLogo = ({ className = "" }: { className?: string }) => (
  <img
    src={logo}
    alt="Flexiq Verve"
    className={className}
    loading="eager"
    decoding="async"
    // lower-case on purpose: React 18 doesn't know `fetchPriority` yet
    {...({ fetchpriority: "high" } as Record<string, string>)}
  />
);

export default BrandLogo;
