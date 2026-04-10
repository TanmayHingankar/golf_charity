import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useParams } from "wouter";
import { Layout } from "@/components/Layout";
import { useGetCharity, getGetCharityQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Heart, Users, Globe, Calendar, ChevronLeft, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";

async function submitDonation(charityId: number, amount: number, message: string) {
  const res = await fetch(`/api/donations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Auth is handled via httpOnly cookie
    },
    body: JSON.stringify({ charityId, amount, message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw err;
  }
  return res.json();
}

function DonationForm({ charityId, charityName }: { charityId: number; charityName: string }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [donated, setDonated] = useState(false);

  const presets = [5, 10, 25, 50];

  const handleDonate = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed < 1) {
      toast({ title: "Please enter a valid amount (minimum £1)", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await submitDonation(charityId, parsed, message);
      setDonated(true);
      toast({ title: "Thank you!", description: `Your £${parsed.toFixed(2)} donation to ${charityName} has been recorded.` });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Donation failed. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="glass rounded-2xl p-6 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Make a Direct Donation</h2>
        </div>
        <p className="text-muted-foreground text-sm mb-4">Log in to make an independent donation directly to {charityName}.</p>
        <Link href="/login">
          <Button className="bg-primary hover:bg-primary/90">Log in to Donate</Button>
        </Link>
      </div>
    );
  }

  if (donated) {
    return (
      <motion.div
        className="glass rounded-2xl p-6 mt-6 border border-primary/30"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="text-center">
          <Heart className="w-10 h-10 text-primary mx-auto mb-3" />
          <h3 className="font-semibold text-foreground text-lg mb-1">Thank You!</h3>
          <p className="text-muted-foreground text-sm">Your donation to {charityName} has been recorded. Every contribution makes a real difference.</p>
          <Button variant="outline" className="mt-4" onClick={() => { setDonated(false); setAmount(""); setMessage(""); }}>
            Donate Again
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="glass rounded-2xl p-6 mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-foreground">Make a Direct Donation</h2>
      </div>
      <p className="text-muted-foreground text-sm mb-4">
        Make an independent donation directly to {charityName}, separate from your subscription.
      </p>

      <div className="flex gap-2 mb-3 flex-wrap">
        {presets.map(p => (
          <Button
            key={p}
            variant="outline"
            size="sm"
            className={`h-8 text-xs ${amount === String(p) ? "border-primary text-primary bg-primary/10" : ""}`}
            onClick={() => setAmount(String(p))}
          >
            £{p}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">£</span>
          <Input
            className="pl-7"
            type="number"
            min={1}
            placeholder="Enter amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>
        <Textarea
          placeholder="Optional message (e.g. 'In memory of...')"
          rows={2}
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="resize-none"
        />
        <Button
          className="w-full bg-primary hover:bg-primary/90"
          onClick={handleDonate}
          disabled={loading}
          data-testid="button-donate"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Heart className="w-4 h-4 mr-2" />}
          {loading ? "Processing..." : `Donate${amount ? ` £${parseFloat(amount) || 0}` : ""}`}
        </Button>
      </div>
    </motion.div>
  );
}

export default function CharityDetail() {
  const { id } = useParams<{ id: string }>();
  const charityId = parseInt(id || "0");
  const { data: charity, isLoading } = useGetCharity(charityId, { query: { enabled: !!charityId, queryKey: getGetCharityQueryKey(charityId) } });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-64 rounded-2xl mb-6" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!charity) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <p className="text-muted-foreground">Charity not found.</p>
          <Link href="/charities"><Button className="mt-4">Back to Charities</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Link href="/charities" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6">
            <ChevronLeft className="w-4 h-4" />
            Back to Charities
          </Link>

          {charity.imageUrl && (
            <div className="aspect-video w-full rounded-2xl overflow-hidden mb-8">
              <img src={charity.imageUrl} alt={charity.name} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="glass rounded-2xl p-8 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="font-display text-4xl font-bold text-foreground mb-2">{charity.name}</h1>
                {charity.featured && (
                  <Badge variant="outline" className="border-accent/40 text-accent">Featured Partner</Badge>
                )}
              </div>
              <Heart className="w-8 h-8 text-primary flex-shrink-0" />
            </div>

            <p className="text-muted-foreground leading-relaxed mb-6">{charity.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-primary/10 rounded-xl p-4 text-center">
                <div className="font-display text-2xl font-bold text-primary">£{charity.totalContributions?.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Raised</div>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="font-display text-2xl font-bold text-foreground">{charity.subscriberCount}</div>
                <div className="text-xs text-muted-foreground mt-1">Supporters</div>
              </div>
              {charity.website && (
                <div className="bg-muted/50 rounded-xl p-4 text-center flex items-center justify-center">
                  <a href={charity.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm">
                    <Globe className="w-4 h-4" /> Visit Website
                  </a>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/register">
                <Button className="bg-primary hover:bg-primary/90">
                  <Heart className="w-4 h-4 mr-2" />
                  Support via Subscription
                </Button>
              </Link>
            </div>
          </div>

          {/* Independent Donation Section */}
          <DonationForm charityId={charity.id} charityName={charity.name} />

          {/* Upcoming Events */}
          {charity.upcomingEvents && charity.upcomingEvents.length > 0 && (
            <div className="glass rounded-2xl p-6 mt-6">
              <h2 className="font-semibold text-foreground text-xl mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Upcoming Events
              </h2>
              <div className="space-y-3">
                {charity.upcomingEvents.map((event: any) => (
                  <div key={event.id} className="border border-border/40 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-foreground">{event.title}</h3>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.eventDate), "dd MMM yyyy")}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
