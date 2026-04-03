import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import SessionCard from "@/components/SessionCard";
import { sessions } from "@/data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Sessions = () => {
  const upcoming = sessions.filter((s) => s.status === "upcoming");
  const completed = sessions.filter((s) => s.status === "completed");

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-extrabold flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            My Sessions
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your upcoming and past learning sessions.
          </p>
        </motion.div>

        <Tabs defaultValue="upcoming" className="mt-8">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {upcoming.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
            {upcoming.length === 0 && (
              <p className="py-10 text-center text-muted-foreground">No upcoming sessions.</p>
            )}
          </TabsContent>
          <TabsContent value="completed" className="mt-4 space-y-3">
            {completed.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Sessions;
