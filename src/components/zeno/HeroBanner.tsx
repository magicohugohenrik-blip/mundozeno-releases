import heroImg from "@/assets/hero-banner.jpg";

export function HeroBanner({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 overflow-hidden rounded-[2rem] bg-secondary/60 shadow-card sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <img
        src={heroImg}
        alt="Zeno, o robô da turma, sobre a mesa interativa cercado por peças coloridas"
        width={1920}
        height={768}
        className="h-40 w-full object-cover sm:h-full"
      />
      <div className="flex flex-col justify-center gap-3 px-6 py-6 sm:px-10 sm:py-10">
        <h1 className="font-display text-3xl leading-tight sm:text-5xl">{title}</h1>
        <p className="max-w-md text-base text-muted-foreground sm:text-lg">{subtitle}</p>
        {action}
      </div>
    </section>
  );
}
