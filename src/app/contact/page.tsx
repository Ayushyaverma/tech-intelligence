import type { Metadata } from "next";
import { Clock, Mail, Megaphone, MessageSquareWarning } from "lucide-react";
import { ContactForm } from "@/components/editorial/contact-form";
import { PageHero } from "@/components/editorial/page-hero";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Contact",
  description: "Report an error, suggest a product, or talk to us about partnerships.",
  alternates: { canonical: "/contact" },
};

const NOTES = [
  { icon: MessageSquareWarning, title: "Spotted an error?", body: "Tell us the product and what looks wrong. Corrections are our top priority." },
  { icon: Megaphone, title: "Partnerships", body: "Advertising is always labelled and never affects scores or rankings." },
  { icon: Clock, title: "Response time", body: "We usually reply within two working days." },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { label: "Contact" }]}
        eyebrow="Contact"
        title="Talk to us."
        description="Questions, corrections, product requests or partnerships. We read everything."
      />
      <Container className="pb-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16">
          <Reveal className="card rounded-panel p-6 sm:p-10">
            <ContactForm />
          </Reveal>
          <Reveal delay={0.05} as="aside" className="space-y-4">
            <div className="card flex items-start gap-4 p-6">
              <Mail className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
              <div>
                <p className="font-semibold text-ink">Email</p>
                <p className="mt-1 text-sm text-muted">Prefer email? Write to</p>
                <p className="mt-1 font-medium text-ink select-all">hello@example.com</p>
              </div>
            </div>
            {NOTES.map((n) => (
              <div key={n.title} className="card flex items-start gap-4 p-6">
                <n.icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                <div>
                  <p className="font-semibold text-ink">{n.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{n.body}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </Container>
    </>
  );
}
