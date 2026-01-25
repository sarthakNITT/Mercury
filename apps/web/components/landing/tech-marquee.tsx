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
  { name: "Elasticsearch" },
  { name: "Cloudflare" },
  { name: "Docker" },
  { name: "Kubernetes" },
  { name: "Turborepo" },
];

export function TechMarquee() {
  return (
    <div className="w-full py-10 overflow-hidden bg-background">
      <div className="text-center mb-8">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Powered by modern infrastructure
        </p>
      </div>
      {/* 
        To make a seamless marquee:
        1. Two identical lists.
        2. Flex container with no gap between the two lists (handle gap inside the list or carefully).
        3. Animation moves -100% of one list's width.
      */}
      <div className="relative flex w-full overflow-hidden mask-linear-fade">
        <div className="flex animate-marquee shrink-0 items-center gap-16 pr-16">
          {technologies.map((tech) => (
            <span
              key={tech.name}
              className="text-xl font-semibold text-muted-foreground/50 hover:text-orange-500 transition-colors cursor-default"
            >
              {tech.name}
            </span>
          ))}
        </div>
        <div
          className="flex animate-marquee shrink-0 items-center gap-16 pr-16"
          aria-hidden="true"
        >
          {technologies.map((tech) => (
            <span
              key={`${tech.name}-duplicate`}
              className="text-xl font-semibold text-muted-foreground/50 hover:text-orange-500 transition-colors cursor-default"
            >
              {tech.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
