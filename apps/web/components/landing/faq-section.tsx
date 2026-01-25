import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus } from "lucide-react";

const faqs = [
  {
    id: "01",
    question: "What is Mercury?",
    answer:
      "Mercury is a real-time commerce intelligence layer. It connects to your marketplace events, processes them instantly, and provides fraud detection, analytics, and personalization APIs.",
  },
  {
    id: "02",
    question: "How does the fraud detection work?",
    answer:
      "We use a hybrid approach of velocity rules and behavioral analysis. Every event is scored in sub-milliseconds against a user's history and global patterns to block bad actors.",
  },
  {
    id: "03",
    question: "Can I use Mercury with any stack?",
    answer:
      "Yes. Mercury exposes a REST and WebSocket API that is platform-agnostic. We have first-class SDKs for Typescript/Node.js, but any language can ingest events.",
  },
  {
    id: "04",
    question: "Is it scalable?",
    answer:
      "Mercury is built on top of high-performance primitives like Redis and Postgres. It is designed to handle thousands of conflicting events per second without race conditions.",
  },
  {
    id: "05",
    question: "How do I get started?",
    answer:
      "Sign up for an API key, install our SDK, and start tracking events. You can see live data in your dashboard within minutes.",
  },
];

export function FAQSection() {
  return (
    <section className="container mx-auto px-4 py-24 max-w-4xl">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Frequently Asked Questions
        </h2>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`item-${i}`}
            className="border-b border-white/10 px-0"
          >
            <AccordionTrigger className="hover:no-underline py-6 [&[data-state=open]>div>div>svg]:rotate-45">
              <div className="flex items-center w-full gap-8 text-left">
                <span className="font-mono text-sm text-muted-foreground/50 hidden sm:block">
                  / {faq.id} /
                </span>
                <span className="text-lg sm:text-xl font-medium">
                  {faq.question}
                </span>
                <div className="ml-auto bg-white/5 p-2 rounded-md transition-colors hover:bg-white/10">
                  <Plus className="h-4 w-4 transition-transform duration-200" />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-lg leading-relaxed pb-8 pl-0 sm:pl-20">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
