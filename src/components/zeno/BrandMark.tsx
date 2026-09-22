import logo from "@/assets/mundo-zeno-logo.png.asset.json";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <img
      src={logo.url}
      alt="Mundo Zeno — Mesa Interativa"
      width={1536}
      height={1024}
      className={`h-14 w-auto object-contain sm:h-16 ${className}`}
    />
  );
}
