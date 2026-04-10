import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/Layout";
import { useListCharities, useGetPrizePool, useGetLatestDraw } from "@workspace/api-client-react";
import { Trophy, Heart, Zap, ChevronRight, Star, Users, TrendingUp, Award, Shield } from "lucide-react";

function CountUp({ end, prefix = "", suffix = "" }: { end: number; prefix?: string; suffix?: string }) {
  return <span>{prefix}{end.toLocaleString()}{suffix}</span>;
}

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const { data: charities } = useListCharities({ featured: true });
  const { data: prizePool } = useGetPrizePool();
  const { data: latestDraw } = useGetLatestDraw();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-radial-emerald" />
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(16, 185, 129, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(217, 119, 6, 0.06) 0%, transparent 50%)"
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <Badge className="mb-6 glass border border-primary/30 text-primary" variant="outline">
                  <Star className="w-3 h-3 mr-1" />
                  Monthly Prize Draws + Charity Impact
                </Badge>
              </motion.div>

              <motion.h1
                className="font-display text-5xl md:text-7xl font-bold text-foreground leading-tight mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
              >
                Score for
                <span className="gradient-text block">Good.</span>
              </motion.h1>

              <motion.p
                className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                Enter your Stableford scores, compete in monthly prize draws,
                and automatically support the charity you choose. Every round
                creates real change.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                <Link href="/register">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-base shadow-lg shadow-primary/20">
                    Start Your Subscription
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button size="lg" variant="outline" className="px-8 py-6 text-base border-border/60">
                    How It Works
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Current Prize Pool", value: `£${prizePool?.totalPool?.toFixed(0) || "2,840"}`, icon: Trophy, color: "text-accent" },
                { label: "Charities Supported", value: charities?.length?.toString() || "6", icon: Heart, color: "text-primary" },
                { label: "Active Members", value: prizePool?.activeSubscribers?.toString() || "127", icon: Users, color: "text-primary" },
                { label: "Donated to Charity", value: `£${(prizePool?.jackpotPool || 18_320).toLocaleString()}`, icon: TrendingUp, color: "text-accent" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="glass rounded-2xl p-6"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color} mb-3`} />
                  <div className="text-2xl font-display font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-16">
              <Badge variant="outline" className="border-primary/30 text-primary mb-4">Simple Process</Badge>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">How It Works</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Three steps to start playing for purpose
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Zap,
                title: "Subscribe",
                desc: "Choose monthly or yearly. £19.99/month or £199.99/year. A portion goes directly to your chosen charity.",
              },
              {
                step: "02",
                icon: Trophy,
                title: "Enter Scores",
                desc: "Log your last 5 Stableford scores (1-45). Your scores are your draw tickets — your play determines your chance.",
              },
              {
                step: "03",
                icon: Award,
                title: "Win & Give",
                desc: "Monthly draws determine winners across 3 tiers (5, 4, or 3 score matches). Jackpots roll over if unclaimed.",
              },
            ].map((step, i) => (
              <FadeInSection key={step.step} delay={i * 0.15}>
                <div className="glass rounded-2xl p-8 relative overflow-hidden group hover:border-primary/30 transition-colors">
                  <div className="absolute top-4 right-4 font-display text-6xl font-bold text-primary/5 select-none">
                    {step.step}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center mb-6">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Prize Pool Section */}
      <section className="py-24 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-16">
              <Badge variant="outline" className="border-accent/30 text-accent mb-4">Prize Distribution</Badge>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">Win Real Prizes</h2>
              <p className="text-muted-foreground text-lg">Every subscription contributes to the prize pool, split across three match tiers</p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { match: "5-Number Match", label: "Jackpot", share: "40%", rollover: true, color: "text-accent", borderColor: "border-accent/30", bgColor: "bg-accent/5" },
              { match: "4-Number Match", label: "Major Prize", share: "35%", rollover: false, color: "text-primary", borderColor: "border-primary/30", bgColor: "bg-primary/5" },
              { match: "3-Number Match", label: "Prize", share: "25%", rollover: false, color: "text-primary/70", borderColor: "border-primary/20", bgColor: "bg-primary/3" },
            ].map((tier, i) => (
              <FadeInSection key={tier.match} delay={i * 0.12}>
                <div className={`rounded-2xl p-8 border ${tier.borderColor} ${tier.bgColor}`}>
                  <div className={`text-4xl font-display font-bold ${tier.color} mb-2`}>{tier.share}</div>
                  <div className="text-lg font-semibold text-foreground mb-1">{tier.label}</div>
                  <div className="text-sm text-muted-foreground mb-4">{tier.match}</div>
                  {tier.rollover && (
                    <Badge variant="outline" className="border-accent/40 text-accent text-xs">
                      Jackpot rolls over
                    </Badge>
                  )}
                </div>
              </FadeInSection>
            ))}
          </div>

          {latestDraw && (
            <FadeInSection delay={0.3}>
              <div className="mt-10 glass rounded-2xl p-8 text-center">
                <p className="text-muted-foreground mb-2">Last Draw</p>
                <h3 className="font-display text-2xl font-bold text-foreground mb-4">
                  {new Date(0, latestDraw.month - 1).toLocaleString("default", { month: "long" })} {latestDraw.year}
                </h3>
                {latestDraw.drawnNumbers && (
                  <div className="flex justify-center gap-3 flex-wrap">
                    {(latestDraw.drawnNumbers as number[]).map((n, i) => (
                      <motion.div
                        key={i}
                        className="w-12 h-12 rounded-full glass-gold border border-accent/30 flex items-center justify-center font-display font-bold text-lg text-accent"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 + 0.3, type: "spring" }}
                      >
                        {n}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </FadeInSection>
          )}
        </div>
      </section>

      {/* Featured Charities */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="flex items-end justify-between mb-16">
              <div>
                <Badge variant="outline" className="border-primary/30 text-primary mb-4">Featured Charities</Badge>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">Make Your Mark</h2>
              </div>
              <Link href="/charities">
                <Button variant="outline" className="hidden md:flex">
                  View All Charities
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(charities || []).slice(0, 3).map((charity, i) => (
              <FadeInSection key={charity.id} delay={i * 0.1}>
                <Link href={`/charities/${charity.id}`}>
                  <div className="glass rounded-2xl overflow-hidden group cursor-pointer hover:border-primary/30 transition-all duration-300">
                    {charity.imageUrl && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={charity.imageUrl}
                          alt={charity.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="font-semibold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
                        {charity.name}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                        {charity.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-muted-foreground">Total Raised</div>
                          <div className="text-primary font-semibold">£{charity.totalContributions.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Supporters</div>
                          <div className="text-foreground font-semibold">{charity.subscriberCount}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="glass-emerald rounded-3xl p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
              <div className="relative">
                <Shield className="w-12 h-12 text-primary mx-auto mb-6" />
                <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                  Ready to Play for Purpose?
                </h2>
                <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                  Join hundreds of golfers making a difference with every round.
                  Monthly draws. Real prizes. Real charity impact.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/register">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-10 py-6 text-base shadow-lg shadow-primary/25">
                      Subscribe Now — £19.99/mo
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/how-it-works">
                    <Button size="lg" variant="outline" className="px-10 py-6 text-base">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>
    </Layout>
  );
}
