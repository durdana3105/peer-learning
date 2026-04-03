import { useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PeerCard from "@/components/PeerCard";
import { peers } from "@/data/mockData";

const allSubjects = Array.from(
  new Set(peers.flatMap((p) => [...p.teachSubjects, ...p.learnSubjects]))
);

const Discover = () => {
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const filtered = peers.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.teachSubjects.some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
      p.learnSubjects.some((s) => s.toLowerCase().includes(search.toLowerCase()));

    const matchesSubject =
      !selectedSubject ||
      p.teachSubjects.includes(selectedSubject) ||
      p.learnSubjects.includes(selectedSubject);

    return matchesSearch && matchesSubject;
  });

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-heading text-3xl font-extrabold">
            Discover Peers 🔍
          </h1>
          <p className="mt-1 text-muted-foreground">
            Find the perfect learning partner.
          </p>
        </motion.div>

        {/* Search & Filters */}
        <div className="mt-6 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, skill, or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={!selectedSubject ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedSubject(null)}
            >
              All
            </Badge>
            {allSubjects.slice(0, 10).map((s) => (
              <Badge
                key={s}
                variant={selectedSubject === s ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedSubject(selectedSubject === s ? null : s)}
              >
                {s}
              </Badge>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <PeerCard key={p.id} peer={p} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-16 text-center text-muted-foreground">
            <p className="text-lg">No peers found matching your search.</p>
            <p className="mt-1 text-sm">Try different keywords or remove filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
