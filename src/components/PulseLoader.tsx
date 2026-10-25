// src/components/PulseLoader.tsx
// Replaces every "Loading…" text: a pulsing light grey circle on a white background.

interface PulseLoaderProps {
  /** Circle diameter in px */
  size?: number;
  /** true = fills a page/section (use instead of a blank page while loading) */
  fullPage?: boolean;
  className?: string;
}

export const PulseLoader = ({ size = 48, fullPage = false, className = "" }: PulseLoaderProps) => (
  <div
    role="status"
    aria-live="polite"
    className={`flex items-center justify-center bg-white ${
      fullPage ? "min-h-[60vh] w-full" : "py-8"
    } ${className}`}
  >
    <span
      className="animate-pulse rounded-full bg-gray-200"
      style={{ width: size, height: size }}
    />
    <span className="sr-only">Loading</span>
  </div>
);

export default PulseLoader;
