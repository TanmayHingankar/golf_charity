import { motion } from "framer-motion";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useGetAdminStats, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, Trophy, Heart, TrendingUp, Shield, ChevronRight } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });

  const cards = stats ? [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Active Subscriptions", value: stats.activeSubscriptions, icon: CreditCard, color: "text-accent" },
    { label: "Monthly Revenue", value: `£${stats.monthlyRevenue?.toFixed(0)}`, icon: TrendingUp, color: "text-primary" },
    { label: "Charity Contributions", value: `£${stats.totalCharityContributions?.toFixed(0)}`, icon: Heart, color: "text-accent" },
    { label: "Direct Donations", value: `£${(stats as any).totalDirectDonations?.toFixed(0) || "0"}`, icon: Heart, color: "text-primary" },
    { label: "Prize Pool", value: `£${stats.totalPrizePool?.toFixed(0)}`, icon: Trophy, color: "text-accent" },
    { label: "Pending Draws", value: stats.pendingDraws, icon: Trophy, color: "text-primary" },
    { label: "Active Charities", value: stats.activeCharities, icon: Heart, color: "text-primary" },
  ] : [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-accent" />
            <h1 className="font-display text-4xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Platform overview and management</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {isLoading
            ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
            : cards.map((card, i) => (
              <motion.div
                key={card.label}
                className="glass rounded-xl p-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                data-testid={`stat-${card.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div className="font-display text-3xl font-bold text-foreground">{card.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{card.label}</div>
              </motion.div>
            ))
          }
        </div>

        {/* Quick Links */}
        <h2 className="font-semibold text-foreground text-xl mb-4">Management</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { href: "/admin/users", label: "Manage Users", icon: Users, desc: "View and manage all subscribers" },
            { href: "/admin/draws", label: "Run Draws", icon: Trophy, desc: "Create and publish monthly draws" },
            { href: "/admin/charities", label: "Charities", icon: Heart, desc: "Manage charity partners" },
            { href: "/admin/winners", label: "Winners", icon: Trophy, desc: "Verify and pay prize winners" },
          ].map((item, i) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <Link href={item.href}>
                <div className="glass rounded-xl p-5 hover:border-primary/30 transition-all group cursor-pointer" data-testid={`admin-link-${item.href.slice(7)}`}>
                  <item.icon className="w-6 h-6 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{item.label}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
