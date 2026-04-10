import { motion } from "framer-motion";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetPrizePool, getGetPrizePoolQueryKey } from "@workspace/api-client-react";
import { Trophy, Heart, Zap, ChevronRight, Award, Users } from "lucide-react";

function Step({ num, icon: Icon, title, desc, delay }: any) {
  return (
    <motion.div
      className="flex gap-6"
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
    >
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        {num < 5 && <div className="w-px h-12 bg-border/50 mx-auto mt-2" />}
      </div>
      <div className="pb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground font-mono">Step {num}</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

export default function HowItWorks() {
  const { data: pool } = useGetPrizePool({ query: { queryKey: getGetPrizePoolQueryKey() } });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <Badge variant="outline" className="border-primary/30 text-primary mb-4">Complete Guide</Badge>
          <h1 className="font-display text-5xl font-bold text-foreground mb-4">How It Works</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Par for Purpose combines competitive golf with meaningful charitable giving
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Steps */}
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-8">Your Journey</h2>
            <Step num={1} icon={Zap} title="Subscribe" desc="Choose monthly (£19.99) or yearly (£199.99 — save £40). Your subscription contributes to the prize pool and your chosen charity." delay={0.1} />
            <Step num={2} icon={Trophy} title="Enter Scores" desc="Log your Stableford scores (1-45 points) after each round. You can store up to 5 scores — adding a new one removes your oldest." delay={0.2} />
            <Step num={3} icon={Heart} title="Support a Charity" desc="Choose a charity and set your contribution percentage (minimum 10%). You can change this at any time." delay={0.3} />
            <Step num={4} icon={Award} title="Monthly Draw" desc="Each month, 5 numbers are drawn (1-45). Your scores become your draw tickets. Match 3, 4, or all 5 to win prizes." delay={0.4} />
            <Step num={5} icon={Users} title="Verify & Win" desc="Winners submit proof (screenshot of scores) for admin verification. Verified winners receive their prize payment." delay={0.5} />
          </div>

          {/* Prize Structure */}
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-8">Prize Pool</h2>
            <div className="space-y-4">
              {[
                { match: "5-Number Match", label: "Jackpot", share: "40%", note: "Rolls over if no winner", color: "accent", amount: pool?.jackpotPool },
                { match: "4-Number Match", label: "Major Prize", share: "35%", note: "Split among winners", color: "primary", amount: pool?.fourMatchPool },
                { match: "3-Number Match", label: "Prize", share: "25%", note: "Split among winners", color: "primary", amount: pool?.threeMatchPool },
              ].map((tier, i) => (
                <motion.div
                  key={tier.match}
                  className="glass rounded-xl p-5 flex items-center justify-between"
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * i + 0.3 }}
                >
                  <div>
                    <div className={`font-display text-2xl font-bold text-${tier.color}`}>{tier.share}</div>
                    <div className="text-sm font-medium text-foreground">{tier.match}</div>
                    <div className="text-xs text-muted-foreground">{tier.note}</div>
                  </div>
                  {tier.amount !== undefined && (
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Current Pool</div>
                      <div className="font-semibold text-foreground">£{tier.amount?.toFixed(0)}</div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {pool && (
              <motion.div
                className="glass-gold rounded-xl p-5 mt-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <div className="text-xs text-muted-foreground mb-1">Total Prize Pool</div>
                <div className="font-display text-3xl font-bold text-accent">£{pool.totalPool?.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground mt-1">From {pool.activeSubscribers} active subscribers</div>
              </motion.div>
            )}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          className="glass-emerald rounded-2xl p-10 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl font-bold text-foreground mb-3">Ready to play for purpose?</h2>
          <p className="text-muted-foreground mb-6">Join today and your very next round supports a cause you believe in.</p>
          <Link href="/register">
            <Button size="lg" className="bg-primary hover:bg-primary/90 px-8">
              Subscribe Now <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </Layout>
  );
}
