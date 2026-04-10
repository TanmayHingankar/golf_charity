import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useGetMySubscription, useCancelSubscription, useSelectCharity, useListCharities, getGetMySubscriptionQueryKey, getListCharitiesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { User, CreditCard, Heart, Loader2 } from "lucide-react";
import { format } from "date-fns";

const profileSchema = z.object({
  charityPercentage: z.number().min(10).max(100),
});

export default function Profile() {
  const { user, updateUser } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedCharity, setSelectedCharity] = useState<number | null>(user?.charityId || null);
  const [charityPct, setCharityPct] = useState(user?.charityPercentage || 10);

  const { data: subscription } = useGetMySubscription({ query: { queryKey: getGetMySubscriptionQueryKey() } });
  const { data: charities = [] } = useListCharities({}, { query: { queryKey: getListCharitiesQueryKey({}) } });
  const cancelMutation = useCancelSubscription();
  const selectCharityMutation = useSelectCharity();

  const handleCancelSubscription = async () => {
    if (!subscription || !confirm("Cancel your subscription? You'll lose access at the renewal date.")) return;
    try {
      await cancelMutation.mutateAsync({ subscriptionId: subscription.id });
      qc.invalidateQueries({ queryKey: getGetMySubscriptionQueryKey() });
      toast({ title: "Subscription cancelled" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed to cancel", variant: "destructive" });
    }
  };

  const handleUpdateCharity = async () => {
    if (!selectedCharity) {
      toast({ title: "Please select a charity", variant: "destructive" });
      return;
    }
    try {
      await selectCharityMutation.mutateAsync({ data: { charityId: selectedCharity, charityPercentage: charityPct } });
      updateUser({ charityId: selectedCharity, charityPercentage: charityPct });
      toast({ title: "Charity updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed to update", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </motion.div>

        <div className="space-y-6">
          {/* Account Info */}
          <motion.div className="glass rounded-2xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Account Details</h2>
                <p className="text-xs text-muted-foreground">Your profile information</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-foreground font-medium">{user?.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-foreground font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <Badge variant="outline" className="border-primary/30 text-primary capitalize mt-1">{user?.role}</Badge>
              </div>
            </div>
          </motion.div>

          {/* Subscription */}
          <motion.div className="glass rounded-2xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Subscription</h2>
                <p className="text-xs text-muted-foreground">Your current plan</p>
              </div>
            </div>
            {subscription ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Plan</p>
                    <p className="text-foreground font-medium capitalize">{subscription.plan}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant="outline" className={subscription.status === "active" ? "border-primary/30 text-primary" : "border-muted text-muted-foreground"}>
                      {subscription.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-foreground font-medium">£{subscription.amount?.toFixed(2)}</p>
                  </div>
                  {subscription.renewalDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">Renewal Date</p>
                      <p className="text-foreground font-medium">{format(new Date(subscription.renewalDate), "dd MMM yyyy")}</p>
                    </div>
                  )}
                </div>
                {subscription.status === "active" && (
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive/40 hover:bg-destructive/10"
                    onClick={handleCancelSubscription}
                    disabled={cancelMutation.isPending}
                    data-testid="button-cancel-subscription"
                  >
                    {cancelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Cancel Subscription
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No active subscription</p>
            )}
          </motion.div>

          {/* Charity Selection */}
          <motion.div className="glass rounded-2xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Charity Selection</h2>
                <p className="text-xs text-muted-foreground">Choose where your contribution goes</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-foreground block mb-3">
                Contribution: <span className="text-primary">{charityPct}%</span>
              </label>
              <Slider
                min={10}
                max={50}
                step={5}
                value={[charityPct]}
                onValueChange={([v]) => setCharityPct(v!)}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10% (minimum)</span>
                <span>50%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4 max-h-48 overflow-y-auto pr-1">
              {charities.map((c: any) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCharity(c.id)}
                  className={`p-3 rounded-xl border text-left transition-all text-sm ${
                    selectedCharity === c.id
                      ? "border-primary bg-primary/10"
                      : "border-border glass hover:border-primary/30"
                  }`}
                  data-testid={`button-select-charity-${c.id}`}
                >
                  <Heart className={`w-3 h-3 mb-1 ${selectedCharity === c.id ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-foreground font-medium leading-tight">{c.name}</div>
                </button>
              ))}
            </div>
            <Button
              onClick={handleUpdateCharity}
              className="bg-primary hover:bg-primary/90"
              disabled={selectCharityMutation.isPending}
              data-testid="button-save-charity"
            >
              {selectCharityMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Charity Preferences
            </Button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
