import { motion } from "framer-motion";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Heart, Calendar, Award, ChevronRight, TrendingUp, Star } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading } = useGetDashboardSummary();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const sub = summary?.subscription;
  const isActive = sub?.status === "active";

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">Your performance dashboard</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Subscription Status */}
          <motion.div variants={itemVariants} className="glass rounded-2xl p-6" data-testid="widget-subscription">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Subscription</h2>
              <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-primary/20 text-primary border-primary/30" : ""}>
                {sub?.status || "No Plan"}
              </Badge>
            </div>
            {sub ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Plan</p>
                  <p className="font-semibold text-foreground capitalize">{sub.plan}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-semibold text-foreground">£{sub.amount?.toFixed(2)}</p>
                </div>
                {sub.renewalDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Renewal</p>
                    <p className="font-semibold text-foreground">{format(new Date(sub.renewalDate), "dd MMM yyyy")}</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground text-sm mb-4">No active subscription</p>
                <Link href="/register">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">Subscribe Now</Button>
                </Link>
              </div>
            )}
          </motion.div>

          {/* Scores Summary */}
          <motion.div variants={itemVariants} className="glass rounded-2xl p-6" data-testid="widget-scores">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Recent Scores</h2>
              <Link href="/scores">
                <Button variant="ghost" size="sm" className="text-primary h-7 text-xs">
                  Manage <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
            {summary?.scores && summary.scores.length > 0 ? (
              <div className="space-y-2">
                {summary.scores.slice(0, 3).map((score: any) => (
                  <div key={score.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground text-sm">{format(new Date(score.playedAt), "dd MMM")}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{score.value}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {summary.scores.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">+{summary.scores.length - 3} more scores</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground text-sm mb-4">No scores yet</p>
                <Link href="/scores">
                  <Button size="sm" variant="outline">Enter Scores</Button>
                </Link>
              </div>
            )}
          </motion.div>

          {/* Charity */}
          <motion.div variants={itemVariants} className="glass rounded-2xl p-6" data-testid="widget-charity">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">My Charity</h2>
              <Heart className="w-5 h-5 text-primary" />
            </div>
            {summary?.charity ? (
              <div>
                {summary.charity.imageUrl && (
                  <img src={summary.charity.imageUrl} alt={summary.charity.name} className="w-full h-24 object-cover rounded-lg mb-3" />
                )}
                <h3 className="font-semibold text-foreground mb-1">{summary.charity.name}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{summary.charity.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">My contribution</span>
                  <span className="text-primary font-semibold">{summary.charityPercentage}%</span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground text-sm mb-4">No charity selected</p>
                <Link href="/profile">
                  <Button size="sm" variant="outline">Choose Charity</Button>
                </Link>
              </div>
            )}
          </motion.div>

          {/* Draw Participation */}
          <motion.div variants={itemVariants} className="glass rounded-2xl p-6" data-testid="widget-draws">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Draw Participation</h2>
              <Link href="/draws">
                <Button variant="ghost" size="sm" className="text-primary h-7 text-xs">
                  View <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-primary/10 rounded-xl">
                <div className="font-display text-2xl font-bold text-primary">{summary?.drawsEntered || 0}</div>
                <div className="text-xs text-muted-foreground">Draws Entered</div>
              </div>
              {summary?.upcomingDraw ? (
                <div className="text-center p-3 bg-accent/10 rounded-xl">
                  <div className="font-display text-lg font-bold text-accent">
                    {new Date(0, summary.upcomingDraw.month - 1).toLocaleString("default", { month: "short" })}
                  </div>
                  <div className="text-xs text-muted-foreground">Next Draw</div>
                </div>
              ) : (
                <div className="text-center p-3 bg-muted/50 rounded-xl">
                  <div className="text-xs text-muted-foreground">No upcoming draw</div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Winnings */}
          <motion.div variants={itemVariants} className="glass rounded-2xl p-6" data-testid="widget-winnings">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Winnings</h2>
              <Trophy className="w-5 h-5 text-accent" />
            </div>
            <div className="mb-4">
              <p className="text-xs text-muted-foreground">Total Won</p>
              <p className="font-display text-3xl font-bold text-accent">£{summary?.totalWon?.toFixed(2) || "0.00"}</p>
            </div>
            {summary?.pendingWinners && summary.pendingWinners.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Pending Verification</p>
                {summary.pendingWinners.map((w: any) => (
                  <div key={w.id} className="flex items-center justify-between text-sm bg-accent/10 rounded-lg px-3 py-2 mb-1">
                    <span className="text-foreground capitalize">{w.matchType.replace("_", " ")}</span>
                    <span className="text-accent font-semibold">£{w.prizeAmount?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/scores" className="block">
                <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                  <Star className="w-4 h-4 text-primary" />
                  Add New Score
                </Button>
              </Link>
              <Link href="/draws" className="block">
                <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                  <Trophy className="w-4 h-4 text-accent" />
                  View Draws
                </Button>
              </Link>
              <Link href="/charities" className="block">
                <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                  <Heart className="w-4 h-4 text-primary" />
                  Browse Charities
                </Button>
              </Link>
              <Link href="/profile" className="block">
                <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Update Profile
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}
