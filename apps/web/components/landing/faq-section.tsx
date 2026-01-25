"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does the real-time fraud detection work?",
    answer:
      "Mercury ingests user events (clicks, page views, purchases) via WebSocket. Our Risk Engine analyzes these signals against predefined velocity rules and behavioral patterns to assign a risk score instantly. High-risk actions are blocked before they complete.",
  },
  {
    question: "Can I customize the recommendation algorithm?",
    answer:
      "Yes. The recommendation engine supports pluggable strategies. You can weight factors like 'recently viewed', 'category affinity', or 'trending globally' to tune the feed for your specific marketplace needs.",
  },
  {
    question: "Is this suitable for high-scale production?",
    answer:
      "Absolutely. Mercury is built on a Redis + Postgres architecture designed to handle thousands of concurrent events. The event processing pipeline is non-blocking and horizontally scalable.",
  },
  {
    question: "Do you offer SDKs for mobile apps?",
    answer:
      "We provide a lightweight JavaScript SDK for web and React Native. For native iOS and Android, we have REST and WebSocket API documentation available for custom integration.",
  },
];

export function FAQSection() {
  return (
    <section className="container mx-auto px-4 py-24 max-w-3xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground">
          Common questions about the Mercury architecture and capabilities.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
