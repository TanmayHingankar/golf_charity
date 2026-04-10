import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useRegister, useCreateSubscription, useListCharities } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Check, Loader2, Heart, ChevronRight } from "lucide-react";

const step1Schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const step2Schema = z.object({
  plan: z.enum(["monthly", "yearly"]),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

export default function Register() {
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [selectedCharity, setSelectedCharity] = useState<number | null>(null);
  const [charityPct, setCharityPct] = useState(10);
  const [registeredToken, setRegisteredToken] = useState<string | null>(null);

  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();
  const subscriptionMutation = useCreateSubscription();
  const { data: charities } = useListCharities({ featured: false });

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { plan: "monthly" },
  });

  const handleStep1 = (data: Step1Data) => {
    setStep1Data(data);
    setStep(2);
  };

  const handleStep2 = (data: Step2Data) => {
    setStep2Data(data);
    setStep(3);
  };

  const handleStep3Submit = async () => {
    if (!step1Data || !step2Data) return;

    try {
      // Register user
      const regRes = await registerMutation.mutateAsync({
        data: {
          name: step1Data.name,
          email: step1Data.email,
          password: step1Data.password,
          charityId: selectedCharity || undefined,
          charityPercentage: charityPct,
        }
      });

      // Create subscription
      await subscriptionMutation.mutateAsync({
        data: {
          plan: step2Data.plan,
          charityId: selectedCharity || undefined,
          charityPercentage: charityPct,
        }
      });

      setRegisteredToken(null);
      login(regRes.user as any, null);
      toast({ title: "Welcome to Par for Purpose!", description: "Your subscription is active." });
      setLocation("/dashboard");
    } catch (err: any) {
      const msg = err?.data?.message || "Registration failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const steps = [
    { num: 1, label: "Your Info" },
    { num: 2, label: "Choose Plan" },
    { num: 3, label: "Pick Charity" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12">
      <div className="absolute inset-0 bg-gradient-radial-emerald" />

      <div className="relative w-full max-w-2xl px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Trophy className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-xl">Par for Purpose</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Create Your Account</h1>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step > s.num ? "bg-primary text-white" :
                  step === s.num ? "bg-primary/20 text-primary border border-primary" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className={`text-sm hidden sm:block ${step === s.num ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
                {i < steps.length - 1 && <div className="w-8 h-px bg-border ml-1" />}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1 */}
          {step === 1 && (
            <motion.div
              key="step1"
              className="glass rounded-2xl p-8"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold text-foreground mb-6">Your Information</h2>
              <Form {...form1}>
                <form onSubmit={form1.handleSubmit(handleStep1)} className="space-y-5">
                  <FormField control={form1.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="John Smith" data-testid="input-name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form1.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" placeholder="you@example.com" data-testid="input-email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form1.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" placeholder="Min 8 characters" data-testid="input-password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" data-testid="button-next-step1">
                    Continue <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </Form>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
              </p>
            </motion.div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <motion.div
              key="step2"
              className="glass rounded-2xl p-8"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold text-foreground mb-6">Choose Your Plan</h2>
              <Form {...form2}>
                <form onSubmit={form2.handleSubmit(handleStep2)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { plan: "monthly" as const, price: "£19.99", period: "per month", savings: null },
                      { plan: "yearly" as const, price: "£199.99", period: "per year", savings: "Save £40" },
                    ].map(({ plan, price, period, savings }) => (
                      <button
                        key={plan}
                        type="button"
                        data-testid={`button-plan-${plan}`}
                        onClick={() => form2.setValue("plan", plan)}
                        className={`p-6 rounded-xl border text-left transition-all ${
                          form2.watch("plan") === plan
                            ? "border-primary bg-primary/10"
                            : "border-border glass hover:border-primary/40"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="capitalize font-semibold text-foreground">{plan}</span>
                          {savings && (
                            <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">{savings}</span>
                          )}
                        </div>
                        <div className="font-display text-3xl font-bold text-foreground">{price}</div>
                        <div className="text-sm text-muted-foreground">{period}</div>
                        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-primary" /> Monthly prize draws</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-primary" /> Charity contributions</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-primary" /> Score tracking</li>
                        </ul>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-2">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                    <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" data-testid="button-next-step2">
                      Continue <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <motion.div
              key="step3"
              className="glass rounded-2xl p-8"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold text-foreground mb-2">Choose Your Charity</h2>
              <p className="text-muted-foreground text-sm mb-6">
                {charityPct}% of your subscription goes to your chosen charity (minimum 10%)
              </p>

              <div className="mb-6">
                <label className="text-sm font-medium text-foreground block mb-3">
                  Charity Contribution: <span className="text-primary">{charityPct}%</span>
                </label>
                <Slider
                  min={10}
                  max={50}
                  step={5}
                  value={[charityPct]}
                  onValueChange={([v]) => setCharityPct(v!)}
                  className="w-full"
                  data-testid="slider-charity-pct"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>10% (minimum)</span>
                  <span>50%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 max-h-64 overflow-y-auto pr-1">
                {(charities || []).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    data-testid={`button-charity-${c.id}`}
                    onClick={() => setSelectedCharity(c.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedCharity === c.id
                        ? "border-primary bg-primary/10"
                        : "border-border glass hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Heart className={`w-4 h-4 ${selectedCharity === c.id ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                <Button
                  type="button"
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={registerMutation.isPending || subscriptionMutation.isPending}
                  onClick={handleStep3Submit}
                  data-testid="button-complete-registration"
                >
                  {(registerMutation.isPending || subscriptionMutation.isPending) ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Complete Registration
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
