import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Plus, X } from "lucide-react";
import SessionCard from "@/components/SessionCard";
import { sessions } from "@/data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Sessions = () => {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");

  const upcoming = sessions.filter((s) => s.status === "upcoming");
  const completed = sessions.filter((s) => s.status === "completed");

  const handleCreate = () => {
    if (!topic || !date || !time) {
      toast({ title: "Missing fields", description: "Please fill in topic, date, and time.", variant: "destructive" });
      return;
    }
    toast({ title: "Session Created! 🎉", description: `"${topic}" scheduled for ${date} at ${time}.` });
    setShowCreate(false);
    setTopic("");
    setDate("");
    setTime("");
    setDescription("");
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-extrabold flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" /> My Sessions
            </h1>
            <p className="mt-1 text-muted-foreground">Manage your upcoming and past learning sessions.</p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)} className="bg-gradient-hero text-primary-foreground hover:opacity-90">
            {showCreate ? <X className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}
            {showCreate ? "Cancel" : "Create Session"}
          </Button>
        </motion.div>

        {/* Create session form */}
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-heading text-lg font-bold">Create a New Session</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="topic">Topic / Subject</Label>
                <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. React Hooks Deep Dive" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="desc">Description (optional)</Label>
                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will you cover?" rows={2} className="mt-1" />
              </div>
            </div>
            <Button onClick={handleCreate} className="mt-4 w-full bg-gradient-hero text-primary-foreground hover:opacity-90">
              <Plus className="mr-1 h-4 w-4" /> Create Session
            </Button>
          </motion.div>
        )}

        <Tabs defaultValue="upcoming" className="mt-8">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {upcoming.map((s) => <SessionCard key={s.id} session={s} />)}
            {upcoming.length === 0 && <p className="py-10 text-center text-muted-foreground">No upcoming sessions.</p>}
          </TabsContent>
          <TabsContent value="completed" className="mt-4 space-y-3">
            {completed.map((s) => <SessionCard key={s.id} session={s} />)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Sessions;
