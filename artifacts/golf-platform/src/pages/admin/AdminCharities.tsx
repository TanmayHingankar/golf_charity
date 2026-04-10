import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/Layout";
import { useListCharities, useCreateCharity, useUpdateCharity, getListCharitiesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Heart, Plus, ChevronLeft, Loader2, Check, X } from "lucide-react";
import { Link } from "wouter";

const charitySchema = z.object({
  name: z.string().min(2, "Name required"),
  description: z.string().min(10, "Description required"),
  website: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  featured: z.boolean().default(false),
});

type CharityFormData = z.infer<typeof charitySchema>;

export default function AdminCharities() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: charities = [], isLoading } = useListCharities({}, { query: { queryKey: getListCharitiesQueryKey({}) } });
  const createMutation = useCreateCharity();
  const updateMutation = useUpdateCharity();

  const form = useForm<CharityFormData>({
    resolver: zodResolver(charitySchema),
    defaultValues: { name: "", description: "", website: "", imageUrl: "", featured: false },
  });

  const handleSubmit = async (data: CharityFormData) => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ charityId: editingId, data });
        toast({ title: "Charity updated" });
      } else {
        await createMutation.mutateAsync({ data });
        toast({ title: "Charity created" });
      }
      qc.invalidateQueries({ queryKey: getListCharitiesQueryKey({}) });
      form.reset();
      setShowForm(false);
      setEditingId(null);
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed", variant: "destructive" });
    }
  };

  const startEdit = (charity: any) => {
    setEditingId(charity.id);
    form.reset({
      name: charity.name,
      description: charity.description,
      website: charity.website || "",
      imageUrl: charity.imageUrl || "",
      featured: charity.featured,
    });
    setShowForm(true);
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
              <h1 className="font-display text-3xl font-bold text-foreground mb-1">Charities</h1>
              <p className="text-muted-foreground">Manage charity partners</p>
            </div>
            <Button onClick={() => { setShowForm(true); setEditingId(null); form.reset(); }} className="bg-primary hover:bg-primary/90" data-testid="button-add-charity">
              <Plus className="w-4 h-4 mr-2" /> Add Charity
            </Button>
          </div>
        </motion.div>

        {showForm && (
          <motion.div className="glass rounded-2xl p-6 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="font-semibold text-foreground mb-4">{editingId ? "Edit Charity" : "New Charity"}</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl><Input placeholder="Charity name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="website" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (optional)</FormLabel>
                      <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="About this charity..." rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (optional)</FormLabel>
                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex gap-3">
                  <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-charity">
                    {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    {editingId ? "Update" : "Create"} Charity
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </motion.div>
        )}

        <div className="space-y-3">
          {isLoading && [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          {(charities as any[]).map((charity: any, i: number) => (
            <motion.div
              key={charity.id}
              className="glass rounded-xl p-4 flex items-center justify-between"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              data-testid={`charity-row-${charity.id}`}
            >
              <div className="flex items-center gap-4">
                {charity.imageUrl && (
                  <img src={charity.imageUrl} alt={charity.name} className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{charity.name}</span>
                    {charity.featured && (
                      <Badge variant="outline" className="border-accent/40 text-accent text-xs">Featured</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{charity.subscriberCount} supporters · £{charity.totalContributions?.toLocaleString()} raised</div>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => startEdit(charity)} data-testid={`button-edit-charity-${charity.id}`}>
                Edit
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
