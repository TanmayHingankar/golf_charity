import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useListCharities, getListCharitiesQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Heart, Users, TrendingUp } from "lucide-react";

export default function Charities() {
  const [search, setSearch] = useState("");
  const { data: charities = [], isLoading } = useListCharities({ search: search || undefined }, {
    query: { queryKey: getListCharitiesQueryKey({ search: search || undefined }) }
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <Badge variant="outline" className="border-primary/30 text-primary mb-4">Make a Difference</Badge>
          <h1 className="font-display text-5xl font-bold text-foreground mb-4">Our Charities</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Your subscription supports causes you care about. Explore our partner charities
            and see the collective impact our community is making.
          </p>
        </motion.div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-12 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search charities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="input-search-charities"
          />
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {charities.map((charity: any, i: number) => (
            <motion.div
              key={charity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link href={`/charities/${charity.id}`}>
                <div className="glass rounded-2xl overflow-hidden group cursor-pointer hover:border-primary/30 transition-all duration-300 h-full" data-testid={`charity-card-${charity.id}`}>
                  {charity.imageUrl && (
                    <div className="aspect-video overflow-hidden">
                      <img src={charity.imageUrl} alt={charity.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">{charity.name}</h3>
                      {charity.featured && (
                        <Badge variant="outline" className="border-accent/40 text-accent text-xs flex-shrink-0 ml-2">Featured</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{charity.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{charity.subscriberCount} supporters</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary font-semibold">
                        <TrendingUp className="w-4 h-4" />
                        <span>£{charity.totalContributions?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {!isLoading && charities.length === 0 && (
          <div className="text-center py-16">
            <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No charities found matching your search.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
