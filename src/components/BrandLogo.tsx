import logoAsset from "@/assets/flexiqverve-logo.png.asset.json";

export const BrandLogo = ({ className = "" }: { className?: string }) => (
  <img src={logoAsset.url} alt="Flexiq Verve" className={className} />
);

export default BrandLogo;
