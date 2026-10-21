interface FitAmountProps {
  text: string;
  variant?: "hero" | "card";
  className?: string;
  title?: string;
}

const FitAmount = ({ text, variant = "hero", className = "", title }: FitAmountProps) => {
  const len = text.replace(/\s/g, "").length;

  const size =
    variant === "hero"
      ? len > 14
        ? "1.35rem"
        : len > 11
        ? "1.75rem"
        : len > 9
        ? "2.25rem"
        : "clamp(2rem, 6vw, 3.5rem)"
      : len > 14
      ? "1.25rem"
      : len > 11
      ? "1.5rem"
      : len > 9
      ? "1.9rem"
      : "clamp(1.75rem, 5vw, 2.75rem)";

  return (
    <p
      className={`min-w-0 whitespace-nowrap font-sans font-bold tracking-tight ${className}`}
      style={{ fontSize: size }}
      title={title}
    >
      {text}
    </p>
  );
};

export default FitAmount;
