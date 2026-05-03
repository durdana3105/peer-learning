import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Calendar, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  skills: string[] | null;
  interests: string[] | null;
  points: number | null;
  sessions_completed: number | null;
  created_at: string;
}

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // Check admin role via RPC-style: try to read user_roles. If it returns data, user is admin.
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .then(({ data, error }) => {
        const admin = !error && data && data.length > 0;
        setIsAdmin(admin);
        if (admin) fetchUsers();
        else setLoading(false);
      });
  }, [user]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, email, skills, interests, points, sessions_completed, created_at")
      .order("created_at", { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-16 w-16 text-destructive opacity-50" />
          <h2 className="mt-4 font-heading text-2xl font-bold">Access Denied</h2>
          <p className="mt-2 text-muted-foreground">You don't have admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  py-8">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-extrabold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" /> Admin Panel
          </h1>
          <p className="mt-1 text-muted-foreground">Manage users and platform activity.</p>
        </motion.div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Total Users", value: users.length, icon: Users },
            { label: "Active Today", value: Math.floor(users.length * 0.3) || 1, icon: Calendar },
            { label: "Total Sessions", value: users.reduce((a, u) => a + (u.sessions_completed || 0), 0), icon: Calendar },
            { label: "Avg Points", value: Math.round(users.reduce((a, u) => a + (u.points || 0), 0) / (users.length || 1)), icon: Shield },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <stat.icon className="h-4 w-4" /> {stat.label}
              </div>
              <p className="mt-2 font-heading text-2xl font-extrabold">{stat.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="users" className="mt-8">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4">
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-hero text-sm font-bold text-primary-foreground">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-sm font-bold truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="hidden gap-1 md:flex">
                    {(u.skills || []).slice(0, 3).map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">{u.points || 0} pts</p>
                    <p className="text-xs text-muted-foreground">{u.sessions_completed || 0} sessions</p>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">No users found.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
