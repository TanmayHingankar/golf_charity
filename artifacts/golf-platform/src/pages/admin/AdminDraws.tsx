import { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useListDraws, useCreateDraw, useSimulateDraw, usePublishDraw, getListDrawsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Play, Megaphone, ChevronLeft, Loader2, Plus } from "lucide-react";
import { Link } from "wouter";

export default function AdminDraws() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [runningId, setRunningId] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [creatingDraw, setCreatingDraw] = useState(false);

  const { data: draws = [], isLoading } = useListDraws({}, { query: { queryKey: getListDrawsQueryKey({}) } });
  const createDrawMutation = useCreateDraw();
  const simulateDrawMutation = useSimulateDraw();
  const publishDrawMutation = usePublishDraw();

  const handleCreateDraw = async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    setCreatingDraw(true);
    try {
      await createDrawMutation.mutateAsync({ data: { month, year, drawType: "random" } });
      qc.invalidateQueries({ queryKey: getListDrawsQueryKey({}) });
      toast({ title: "Draw created", description: `${now.toLocaleString("default", { month: "long" })} ${year} draw is ready.` });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed to create draw", variant: "destructive" });
    } finally {
      setCreatingDraw(false);
    }
  };

  const handleRunDraw = async (drawId: number) => {
    if (!confirm("Run this draw? This will generate the winning numbers.")) return;
    setRunningId(drawId);
    try {
      await simulateDrawMutation.mutateAsync({ drawId });
      qc.invalidateQueries({ queryKey: getListDrawsQueryKey({}) });
      toast({ title: "Draw completed", description: "Numbers have been generated." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed to run draw", variant: "destructive" });
    } finally {
      setRunningId(null);
    }
  };

  const handlePublishDraw = async (drawId: number) => {
    if (!confirm("Publish this draw? Results will be visible to all users.")) return;
    setPublishingId(drawId);
    try {
      await publishDrawMutation.mutateAsync({ drawId });
      qc.invalidateQueries({ queryKey: getListDrawsQueryKey({}) });
      toast({ title: "Draw published", description: "Results are now visible." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed to publish", variant: "destructive" });
    } finally {
      setPublishingId(null);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "border-muted text-muted-foreground",
      completed: "border-accent/40 text-accent",
      published: "border-primary/40 text-primary",
    };
    return map[status] || "border-border text-muted-foreground";
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4">
            <ChevronLeft className="w-4 h-4" /> Admin Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-1">Prize Draws</h1>
              <p className="text-muted-foreground">Run and publish monthly draws</p>
            </div>
            <Button
              onClick={handleCreateDraw}
              disabled={creatingDraw}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-create-draw"
            >
              {creatingDraw ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Draw
            </Button>
          </div>
        </motion.div>

        {isLoading && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
          </div>
        )}

        <div className="space-y-4">
          {(draws as any[]).map((draw: any, i: number) => (
            <motion.div
              key={draw.id}
              className="glass rounded-2xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              data-testid={`draw-row-${draw.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-foreground">
                      {new Date(0, draw.month - 1).toLocaleString("default", { month: "long" })} {draw.year}
                    </h3>
                    <Badge variant="outline" className={statusBadge(draw.status)}>
                      {draw.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{draw.participantCount} participants</p>
                </div>
                <div className="flex gap-2">
                  {draw.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => handleRunDraw(draw.id)}
                      disabled={runningId === draw.id}
                      className="bg-primary hover:bg-primary/90"
                      data-testid={`button-run-draw-${draw.id}`}
                    >
                      {runningId === draw.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                      Run Draw
                    </Button>
                  )}
                  {draw.status === "simulated" && (
                    <Button
                      size="sm"
                      onClick={() => handlePublishDraw(draw.id)}
                      disabled={publishingId === draw.id}
                      variant="outline"
                      className="border-accent/40 text-accent hover:bg-accent/10"
                      data-testid={`button-publish-draw-${draw.id}`}
                    >
                      {publishingId === draw.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Megaphone className="w-4 h-4 mr-1" />}
                      Publish
                    </Button>
                  )}
                </div>
              </div>
              {draw.drawnNumbers && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Drawn Numbers</p>
                  <div className="flex gap-2 flex-wrap">
                    {(draw.drawnNumbers as number[]).map((n: number, j: number) => (
                      <div
                        key={j}
                        className="w-9 h-9 rounded-full glass-gold border border-accent/30 flex items-center justify-center font-display font-bold text-sm text-accent"
                      >
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3 mt-4 text-xs text-muted-foreground">
                <div>Jackpot: <span className="text-accent font-semibold">£{draw.jackpotAmount?.toFixed(0)}</span></div>
                <div>4-Match: <span className="text-primary font-semibold">£{draw.fourMatchAmount?.toFixed(0)}</span></div>
                <div>3-Match: <span className="text-foreground font-semibold">£{draw.threeMatchAmount?.toFixed(0)}</span></div>
              </div>
            </motion.div>
          ))}
        </div>

        {!isLoading && draws.length === 0 && (
          <div className="text-center py-16 glass rounded-2xl">
            <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No draws yet.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
