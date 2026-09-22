import zenoImg from "@/assets/zeno.png";

export function ZenoSays({
  message,
  size = "md",
}: {
  message: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims = size === "lg" ? "h-40 w-40" : size === "sm" ? "h-16 w-16" : "h-24 w-24";
  return (
    <div className="flex items-center gap-3">
      <img
        src={zenoImg}
        alt="Zeno, o robô guia da turma"
        width={816}
        height={816}
        className={`${dims} shrink-0 animate-float object-contain drop-shadow-lg`}
      />
      <p className="animate-pop rounded-3xl rounded-bl-md bg-card px-5 py-3 font-display text-lg text-card-foreground shadow-card sm:text-xl">
        {message}
      </p>
    </div>
  );
}
