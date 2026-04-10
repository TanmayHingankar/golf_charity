import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Pencil, Trash2, Check, X } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

interface Score {
  id: number;
  value: number;
  playedAt: string;
}

interface ScoresPanelProps {
  userId: number;
  userName: string;
}

function ScoresPanel({ userId, userName }: ScoresPanelProps) {
  const [scores, setScores] = useState<Score[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editDate, setEditDate] = useState("");
  const [saving, setSaving] = useState(false);
  const headers = { "Content-Type": "application/json" };

  const loadScores = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/scores`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load scores");
      const data = await res.json();
      setScores(data);
    } catch {
      setError("Could not load scores");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (s: Score) => {
    setEditingId(s.id);
    setEditValue(String(s.value));
    setEditDate(s.playedAt ? format(new Date(s.playedAt), "yyyy-MM-dd") : "");
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (scoreId: number) => {
    const scoreVal = parseInt(editValue);
    if (isNaN(scoreVal) || scoreVal < 1 || scoreVal > 45) {
      alert("Score must be between 1 and 45");
      return;
    }
    const dateVal = editDate ? new Date(editDate) : null;
    if (!dateVal || isNaN(dateVal.getTime())) {
      alert("Please enter a valid date");
      return;
    }
    if (dateVal > new Date()) {
      alert("Score date cannot be in the future");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/scores/${scoreId}`, {
        method: "PATCH",
        headers,
        credentials: "include",
        body: JSON.stringify({ value: scoreVal, playedAt: dateVal.toISOString() }),
      });
      if (!res.ok) throw new Error("Failed to update score");
      const updated = await res.json();
      setScores(prev => prev ? prev.map(s => s.id === scoreId ? updated : s) : prev);
      setEditingId(null);
    } catch {
      alert("Failed to save score");
    } finally {
      setSaving(false);
    }
  };

  const deleteScore = async (scoreId: number) => {
    if (!confirm("Delete this score? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/scores/${scoreId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete score");
      setScores(prev => prev ? prev.filter(s => s.id !== scoreId) : prev);
    } catch {
      alert("Failed to delete score");
    }
  };

  if (scores === null) {
    return (
      <div className="px-4 pb-4">
        <Button size="sm" variant="outline" onClick={loadScores} disabled={loading}>
          {loading ? "Loading..." : `View scores for ${userName}`}
        </Button>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      <h4 className="text-sm font-semibold text-muted-foreground mb-3">
        Golf Scores ({scores.length})
        {scores.length > 0 && (
          <span className="ml-2 text-primary">
            Avg: {(scores.reduce((a, s) => a + s.value, 0) / scores.length).toFixed(1)}
          </span>
        )}
      </h4>
      {scores.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No scores recorded yet</p>
      ) : (
        <div className="space-y-2">
          {scores.map(s => (
            <div key={s.id} className="flex items-center gap-3 text-sm bg-muted/30 rounded-lg px-3 py-2">
              {editingId === s.id ? (
                <>
                  <Input type="number" min={1} max={45} value={editValue} onChange={e => setEditValue(e.target.value)} className="h-7 w-16 text-xs" />
                  <Input type="date" value={editDate} max={format(new Date(), "yyyy-MM-dd")} onChange={e => setEditDate(e.target.value)} className="h-7 w-36 text-xs" />
                  <span className="flex-1" />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit(s.id)} disabled={saving}>
                    <Check className="w-3 h-3 text-primary" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}>
                    <X className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="font-bold text-primary w-8">{s.value}</span>
                  <span className="text-muted-foreground flex-1">{format(new Date(s.playedAt), "dd MMM yyyy")}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(s)}>
                    <Pencil className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteScore(s.id)}>
                    <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PAGE_SIZE = 15;

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  const { data, isLoading } = useListUsers(
    { search: search || undefined, page, limit: PAGE_SIZE },
    { query: { queryKey: getListUsersQueryKey({ search: search || undefined, page, limit: PAGE_SIZE }) } }
  );

  const users = (data as any)?.users || (Array.isArray(data) ? data : []);
  const total = (data as any)?.total || (Array.isArray(data) ? data.length : 0);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const toggleUser = (id: number) => setExpandedUserId(prev => prev === id ? null : id);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4">
            <ChevronLeft className="w-4 h-4" /> Admin Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-1">Users</h1>
              <p className="text-muted-foreground">Manage subscribers and their scores</p>
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary">
              {total} total
            </Badge>
          </div>
        </motion.div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} data-testid="input-search-users" />
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4 text-muted-foreground font-medium">User</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Role</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Subscription</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Joined</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Scores</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    <td className="p-4" colSpan={5}><Skeleton className="h-6 w-full" /></td>
                  </tr>
                ))}
                {!isLoading && users.map((user: any, i: number) => (
                  <>
                    <motion.tr
                      key={user.id}
                      className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      data-testid={`user-row-${user.id}`}
                    >
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-foreground">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={user.role === "admin" ? "border-accent/40 text-accent" : "border-border text-muted-foreground"}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={user.subscriptionStatus === "active" ? "border-primary/30 text-primary" : "border-border text-muted-foreground"}>
                          {user.subscriptionStatus || "none"}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {format(new Date(user.createdAt), "dd MMM yyyy")}
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-xs text-muted-foreground"
                          onClick={() => toggleUser(user.id)}
                        >
                          {expandedUserId === user.id
                            ? <><ChevronUp className="w-3 h-3" /> Hide</>
                            : <><ChevronDown className="w-3 h-3" /> Scores</>
                          }
                        </Button>
                      </td>
                    </motion.tr>
                    <AnimatePresence>
                      {expandedUserId === user.id && (
                        <motion.tr
                          key={`${user.id}-scores`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <td colSpan={5} className="bg-muted/10 border-b border-border/30">
                            <ScoresPanel userId={user.id} userName={user.name} />
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border/30">
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
