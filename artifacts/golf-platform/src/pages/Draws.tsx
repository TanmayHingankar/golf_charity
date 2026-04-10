import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import {
  useListDraws,
  useGetMyWinnings,
  useSubmitWinnerProof,
  getListDrawsQueryKey,
  getGetMyWinningsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Award, Upload, Loader2, CheckCircle2 } from "lucide-react";

function ProofSubmitForm({ winnerId, onSuccess }: { winnerId: number; onSuccess: () => void }) {
  const [proofUrl, setProofUrl] = useState("");
  const { toast } = useToast();
  const submitMutation = useSubmitWinnerProof();

  const handleSubmit = async () => {
    if (!proofUrl.trim()) {
      toast({ title: "Please enter a proof URL", variant: "destructive" });
      return;
    }
    try {
      await submitMutation.mutateAsync({ winnerId, data: { proofImageUrl: proofUrl.trim() } });
      toast({ title: "Proof submitted!", description: "Admin will verify your win shortly." });
      onSuccess();
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed to submit proof", variant: "destructive" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 p-3 bg-accent/5 rounded-xl border border-accent/20"
    >
      <p className="text-xs text-muted-foreground mb-2">
        Upload a screenshot of your score to a public image host (e.g. Imgur) and paste the URL below.
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="https://i.imgur.com/..."
          value={proofUrl}
          onChange={e => setProofUrl(e.target.value)}
          className="h-8 text-sm flex-1"
        />
        <Button
          size="sm"
          className="h-8 bg-accent hover:bg-accent/90 text-accent-foreground"
          onClick={handleSubmit}
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
        </Button>
      </div>
    </motion.div>
  );
}

export default function Draws() {
  const { data: draws = [], isLoading: drawsLoading } = useListDraws({}, { query: { queryKey: getListDrawsQueryKey({}) } });
  const { data: winnings, isLoading: winningsLoading, refetch: refetchWinnings } = useGetMyWinnings({ query: { queryKey: getGetMyWinningsQueryKey() } });
  const [openProofId, setOpenProofId] = useState<number | null>(null);
  const qc = useQueryClient();

  const publishedDraws = draws.filter((d: any) => d.status === "published");

  const handleProofSuccess = () => {
    setOpenProofId(null);
    qc.invalidateQueries({ queryKey: getGetMyWinningsQueryKey() });
    refetchWinnings();
  };

  const statusColors: Record<string, string> = {
    paid: "border-primary/40 text-primary",
    verified: "border-primary/30 text-primary",
    rejected: "border-destructive/40 text-destructive",
    pending_verification: "border-accent/30 text-accent",
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">Draws</h1>
          <p className="text-muted-foreground">Monthly prize draws and your winnings history</p>
        </motion.div>

        {/* Winnings Summary */}
        {!winningsLoading && winnings && (
          <motion.div
            className="glass-gold rounded-2xl p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-6 h-6 text-accent" />
              <h2 className="font-semibold text-foreground">Your Winnings</h2>
            </div>
            <div className="font-display text-4xl font-bold text-accent mb-2">
              £{winnings.totalWon.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">Total won across all draws</p>

            {winnings.winners.length > 0 && (
              <div className="mt-4 space-y-2">
                {winnings.winners.map((w: any) => (
                  <div key={w.id} data-testid={`winner-item-${w.id}`}>
                    <div className="flex items-center justify-between bg-background/30 rounded-lg px-3 py-2 text-sm">
                      <div>
                        <span className="text-foreground capitalize">{w.matchType.replace(/_/g, " ")}</span>
                        {w.proofImageUrl && (
                          <span className="ml-2 text-xs text-muted-foreground inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-primary" /> Proof submitted
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-accent font-semibold">£{w.prizeAmount.toFixed(2)}</span>
                        <Badge variant="outline" className={statusColors[w.status] || "border-border text-muted-foreground"}>
                          {w.status.replace(/_/g, " ")}
                        </Badge>
                        {w.status === "pending_verification" && !w.proofImageUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-accent/40 text-accent hover:bg-accent/10"
                            onClick={() => setOpenProofId(openProofId === w.id ? null : w.id)}
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Submit Proof
                          </Button>
                        )}
                      </div>
                    </div>
                    <AnimatePresence>
                      {openProofId === w.id && (
                        <ProofSubmitForm winnerId={w.id} onSuccess={handleProofSuccess} />
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}

            {winnings.winners.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">No wins yet — keep entering your scores!</p>
            )}
          </motion.div>
        )}

        {/* Draws List */}
        <h2 className="font-semibold text-foreground text-xl mb-4">Published Draws</h2>
        {drawsLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        )}
        {!drawsLoading && publishedDraws.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <Award className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No published draws yet. Check back soon!</p>
          </div>
        )}
        <div className="space-y-4">
          {publishedDraws.map((draw: any, i: number) => (
            <motion.div
              key={draw.id}
              className="glass rounded-2xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              data-testid={`draw-item-${draw.id}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {new Date(0, draw.month - 1).toLocaleString("default", { month: "long" })} {draw.year}
                  </h3>
                  <p className="text-sm text-muted-foreground">{draw.participantCount} participants</p>
                </div>
                <Badge variant="outline" className="border-primary/30 text-primary capitalize">
                  {draw.status}
                </Badge>
              </div>
              {draw.drawnNumbers && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Drawn Numbers</p>
                  <div className="flex gap-2 flex-wrap">
                    {(draw.drawnNumbers as number[]).map((n: number, j: number) => (
                      <motion.div
                        key={j}
                        className="w-10 h-10 rounded-full glass-gold border border-accent/30 flex items-center justify-center font-display font-bold text-accent"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.08 + j * 0.06, type: "spring" }}
                      >
                        {n}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-accent/10 rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground">Jackpot</div>
                  <div className="text-accent font-semibold">£{draw.jackpotAmount?.toFixed(0)}</div>
                  {draw.jackpotRolledOver && <div className="text-xs text-muted-foreground">Rolled over</div>}
                </div>
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground">4 Match</div>
                  <div className="text-primary font-semibold">£{draw.fourMatchAmount?.toFixed(0)}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground">3 Match</div>
                  <div className="text-foreground font-semibold">£{draw.threeMatchAmount?.toFixed(0)}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
