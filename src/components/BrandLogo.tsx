import logo from "@/assets/logo.png";

export const BrandLogo = ({ className = "" }: { className?: string }) => (
  <img
    src={logo}
    alt="Flexiq Verve"
    className={className}
  />
);

export default BrandLogo;

