import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useGetMyScores, useAddScore, useUpdateScore, useDeleteScore, getGetMyScoresQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Check, X, Trophy, Calendar, Info } from "lucide-react";
import { format } from "date-fns";

export default function Scores() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: scores = [], isLoading } = useGetMyScores();
  const addScoreMutation = useAddScore();
  const updateScoreMutation = useUpdateScore();
  const deleteScoreMutation = useDeleteScore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editDate, setEditDate] = useState("");

  const handleAdd = async () => {
    const v = parseInt(newValue);
    if (!v || v < 1 || v > 45) {
      toast({ title: "Invalid score", description: "Score must be between 1 and 45", variant: "destructive" });
      return;
    }
    if (!newDate) {
      toast({ title: "Date required", description: "Please select a date", variant: "destructive" });
      return;
    }
    try {
      await addScoreMutation.mutateAsync({ data: { value: v, playedAt: new Date(newDate).toISOString() } });
      qc.invalidateQueries({ queryKey: getGetMyScoresQueryKey() });
      setShowAddForm(false);
      setNewValue("");
      setNewDate(format(new Date(), "yyyy-MM-dd"));
      toast({ title: "Score added", description: "Your score has been recorded." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed to add score", variant: "destructive" });
    }
  };

  const handleUpdate = async (scoreId: number) => {
    const v = parseInt(editValue);
    if (!v || v < 1 || v > 45) {
      toast({ title: "Invalid score", description: "Score must be between 1 and 45", variant: "destructive" });
      return;
    }
    try {
      await updateScoreMutation.mutateAsync({ scoreId, data: { value: v, playedAt: new Date(editDate).toISOString() } });
      qc.invalidateQueries({ queryKey: getGetMyScoresQueryKey() });
      setEditingId(null);
      toast({ title: "Score updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed to update", variant: "destructive" });
    }
  };

  const handleDelete = async (scoreId: number) => {
    if (!confirm("Delete this score?")) return;
    try {
      await deleteScoreMutation.mutateAsync({ scoreId });
      qc.invalidateQueries({ queryKey: getGetMyScoresQueryKey() });
      toast({ title: "Score deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed to delete", variant: "destructive" });
    }
  };

  const startEdit = (score: any) => {
    setEditingId(score.id);
    setEditValue(String(score.value));
    setEditDate(format(new Date(score.playedAt), "yyyy-MM-dd"));
  };

  const avg = scores.length > 0 ? (scores.reduce((s: number, sc: any) => s + sc.value, 0) / scores.length).toFixed(1) : "—";
  const best = scores.length > 0 ? Math.max(...scores.map((s: any) => s.value)) : null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">My Scores</h1>
          <p className="text-muted-foreground">Your last 5 Stableford scores — these are your draw tickets</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Scores Logged", value: `${scores.length}/5` },
            { label: "Average", value: avg },
            { label: "Best Score", value: best || "—" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="glass rounded-xl p-4 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="font-display text-2xl font-bold text-primary">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Info Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3 mb-6">
          <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-foreground font-medium">Rolling 5-Score System</p>
            <p className="text-xs text-muted-foreground">You can only store 5 scores at a time. Adding a new one will remove your oldest score.</p>
          </div>
        </div>

        {/* Add score button */}
        {!showAddForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-primary hover:bg-primary/90 mb-6"
              disabled={scores.length >= 5}
              data-testid="button-add-score"
            >
              <Plus className="w-4 h-4 mr-2" />
              {scores.length >= 5 ? "Max 5 scores (adding will remove oldest)" : "Add New Score"}
            </Button>
            {scores.length >= 5 && (
              <Button onClick={() => setShowAddForm(true)} className="w-full bg-primary hover:bg-primary/90 mb-6" data-testid="button-add-score-full">
                <Plus className="w-4 h-4 mr-2" /> Add Score (replaces oldest)
              </Button>
            )}
          </motion.div>
        )}

        {/* Add form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              className="glass rounded-xl p-6 mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h3 className="font-semibold text-foreground mb-4">Add New Score</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Stableford Points (1-45)</label>
                  <Input
                    type="number"
                    min={1}
                    max={45}
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    placeholder="e.g. 32"
                    data-testid="input-score-value"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Date Played</label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    max={format(new Date(), "yyyy-MM-dd")}
                    data-testid="input-score-date"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90" disabled={addScoreMutation.isPending} data-testid="button-save-score">
                  <Check className="w-4 h-4 mr-2" /> Save Score
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score List */}
        <div className="space-y-3">
          {isLoading && [...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-4 animate-pulse h-16" />
          ))}
          {!isLoading && scores.length === 0 && (
            <div className="text-center py-12 glass rounded-2xl">
              <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No scores yet. Add your first Stableford score.</p>
            </div>
          )}
          <AnimatePresence>
            {scores.map((score: any, i: number) => (
              <motion.div
                key={score.id}
                className="glass rounded-xl p-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                data-testid={`score-item-${score.id}`}
              >
                {editingId === score.id ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <Input
                      type="number"
                      min={1}
                      max={45}
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="w-24"
                    />
                    <Input
                      type="date"
                      value={editDate}
                      onChange={e => setEditDate(e.target.value)}
                      className="w-40"
                    />
                    <Button size="sm" onClick={() => handleUpdate(score.id)} className="bg-primary hover:bg-primary/90">
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full glass-emerald border border-primary/20 flex items-center justify-center">
                        <span className="font-display font-bold text-lg text-primary">{score.value}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">Stableford Points</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(score.playedAt), "dd MMM yyyy")}
                        </div>
                      </div>
                      {i === 0 && (
                        <Badge variant="outline" className="border-primary/30 text-primary text-xs">Latest</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(score)} data-testid={`button-edit-score-${score.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(score.id)} data-testid={`button-delete-score-${score.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
