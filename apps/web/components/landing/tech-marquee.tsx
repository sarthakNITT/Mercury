"use client";

// import { cn } from "@/lib/utils";

const technologies = [
  { name: "Next.js" },
  { name: "TypeScript" },
  { name: "Tailwind" },
  { name: "Framer Motion" },
  { name: "Prisma" },
  { name: "PostgreSQL" },
  { name: "Redis" },
  { name: "Vercel" },
  { name: "Turborepo" },
];

export function TechMarquee() {
  return (
    <div className="w-full py-10 overflow-hidden bg-background">
      <div className="text-center mb-6">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Trusted by engineering teams building the future
        </p>
      </div>
      <div className="relative flex w-full overflow-hidden mask-linear-fade">
        <div className="flex animate-marquee min-w-full shrink-0 items-center justify-around gap-10 whitespace-nowrap">
          {technologies.map((tech) => (
            <span
              key={tech.name}
              className="text-xl font-semibold text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              {tech.name}
            </span>
          ))}
        </div>
        <div className="flex animate-marquee min-w-full shrink-0 items-center justify-around gap-10 whitespace-nowrap ml-10">
          {technologies.map((tech) => (
            <span
              key={`${tech.name}-duplicate`}
              className="text-xl font-semibold text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              {tech.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
