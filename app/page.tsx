import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Lock,
  Briefcase,
  ArrowRight,
  GraduationCap,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="text-xl font-bold text-primary">DevBridge</span>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Log in
            </Link>
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Hire verified student developers
            <br />
            <span className="text-primary">for real paid projects</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Connect with talent that has passed skill tests. Agree on milestones,
            fund securely, and get work delivered. Every project becomes a
            portfolio entry.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup" className="gap-2">
                Find developers
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/developers">Browse developers</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Verified developers */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center gap-12 md:flex-row md:items-start">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
                <ShieldCheck className="h-4 w-4" />
                Verified skills
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Developers pass skill tests and get verified levels
              </h2>
              <p className="mt-4 text-muted-foreground">
                No AI matching — you search and filter by skills, level, and
                availability. Each developer has transparent, test-verified
                skill levels so you know exactly who you&apos;re hiring.
              </p>
              <Button className="mt-6" asChild>
                <Link href="/developers" className="gap-2">
                  Browse developers
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="flex flex-1 justify-center">
              <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
                <GraduationCap className="h-12 w-12 text-primary" />
                <h3 className="mt-4 font-semibold">Skill-verified profiles</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tests per skill, clear levels (beginner → expert), and
                  portfolio from completed projects.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Escrow */}
      <section className="border-t border-border bg-muted/30 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center gap-12 md:flex-row-reverse md:items-start">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
                <Lock className="h-4 w-4" />
                Secure payments
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Funds held by the platform, released per milestone
              </h2>
              <p className="mt-4 text-muted-foreground">
                You fund the project through Lemon Squeezy. We hold the funds
                and release them when each milestone is completed and approved.
                Students receive payouts via Wise — safe for both sides.
              </p>
              <Button className="mt-6" variant="outline" asChild>
                <Link href="/signup" className="gap-2">
                  How it works
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="flex flex-1 justify-center">
              <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
                <Briefcase className="h-12 w-12 text-primary" />
                <h3 className="mt-4 font-semibold">Milestone-based escrow</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Define milestones, fund once, release as each is completed.
                  Disputes handled by the platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Ready to hire or get hired?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join as a company to post projects and hire verified developers, or
            as a student to pass tests and land paid work.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">Create account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} DevBridge. Hire verified student
          developers for real paid projects.
        </div>
      </footer>
    </div>
  );
}
