import { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useListWinners, useVerifyWinner, useMarkWinnerPaid, getListWinnersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Check, X, ChevronLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function AdminWinners() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending_verification");

  const { data: winners = [], isLoading } = useListWinners(
    { status: filter },
    { query: { queryKey: getListWinnersQueryKey({ status: filter }) } }
  );

  const verifyMutation = useVerifyWinner();
  const markPaidMutation = useMarkWinnerPaid();

  const handleVerify = async (winnerId: number) => {
    try {
      await verifyMutation.mutateAsync({ winnerId, data: { approved: true } });
      qc.invalidateQueries({ queryKey: getListWinnersQueryKey({ status: filter }) });
      toast({ title: "Winner verified", description: "Payment can now be processed." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed", variant: "destructive" });
    }
  };

  const handleReject = async (winnerId: number) => {
    if (!confirm("Reject this winner claim?")) return;
    try {
      await verifyMutation.mutateAsync({ winnerId, data: { approved: false, adminNote: "Claim rejected by admin" } });
      qc.invalidateQueries({ queryKey: getListWinnersQueryKey({ status: filter }) });
      toast({ title: "Winner rejected" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed", variant: "destructive" });
    }
  };

  const handleMarkPaid = async (winnerId: number) => {
    if (!confirm("Mark this winner as paid?")) return;
    try {
      await markPaidMutation.mutateAsync({ winnerId });
      qc.invalidateQueries({ queryKey: getListWinnersQueryKey({ status: filter }) });
      toast({ title: "Marked as paid" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed", variant: "destructive" });
    }
  };

  const filters = [
    { value: "pending_verification", label: "Pending" },
    { value: "verified", label: "Verified" },
    { value: "paid", label: "Paid" },
    { value: "rejected", label: "Rejected" },
  ];

  const statusColors: Record<string, string> = {
    pending_verification: "border-accent/40 text-accent",
    verified: "border-primary/40 text-primary",
    paid: "border-primary/30 text-primary",
    rejected: "border-destructive/40 text-destructive",
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4">
            <ChevronLeft className="w-4 h-4" /> Admin Dashboard
          </Link>
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">Winners</h1>
          <p className="text-muted-foreground">Verify and manage prize winners</p>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {filters.map(f => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? "default" : "outline"}
              onClick={() => setFilter(f.value)}
              className={filter === f.value ? "bg-primary hover:bg-primary/90" : ""}
              data-testid={`filter-${f.value}`}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        )}

        {!isLoading && (winners as any[]).length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No winners in this category.</p>
          </div>
        )}

        <div className="space-y-4">
          {(winners as any[]).map((winner: any, i: number) => (
            <motion.div
              key={winner.id}
              className="glass rounded-xl p-5"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              data-testid={`winner-row-${winner.id}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-foreground">{winner.userName || `User #${winner.userId}`}</span>
                    <Badge variant="outline" className={statusColors[winner.status] || "border-border text-muted-foreground"}>
                      {winner.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="capitalize text-muted-foreground">{winner.matchType.replace(/_/g, " ")}</span>
                    <span className="text-accent font-semibold">£{winner.prizeAmount?.toFixed(2)}</span>
                  </div>
                  {winner.proofImageUrl && (
                    <a href={winner.proofImageUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline mt-1 block">
                      View proof
                    </a>
                  )}
                  {winner.adminNote && (
                    <p className="text-xs text-muted-foreground mt-1">Note: {winner.adminNote}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {winner.status === "pending_verification" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleVerify(winner.id)}
                        disabled={verifyMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                        data-testid={`button-verify-winner-${winner.id}`}
                      >
                        {verifyMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive/40 text-destructive hover:bg-destructive/10"
                        onClick={() => handleReject(winner.id)}
                        disabled={verifyMutation.isPending}
                        data-testid={`button-reject-winner-${winner.id}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {winner.status === "verified" && (
                    <Button
                      size="sm"
                      onClick={() => handleMarkPaid(winner.id)}
                      disabled={markPaidMutation.isPending}
                      className="bg-accent hover:bg-accent/90 text-white"
                      data-testid={`button-mark-paid-${winner.id}`}
                    >
                      {markPaidMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      Mark Paid
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
