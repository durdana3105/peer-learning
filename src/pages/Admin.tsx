import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  skills: string[] | null;
  points: number | null;
  sessions_completed: number | null;
  created_at: string;
  last_active_at: string | null;
}

type AdminRpcClient = {
  rpc(
    fn: "admin_get_all_profiles"
  ): Promise<{ data: UserProfile[] | null; error: unknown }>;
  rpc(
    fn: "has_role",
    args: { _user_id: string; _role: string }
  ): Promise<{ data: boolean | null; error: unknown }>;
};

const adminSupabase = supabase as unknown as AdminRpcClient;

const calculateActiveTodayCount = (userList: UserProfile[]): number => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return userList.filter((profile) => {
    if (!profile.last_active_at) {
      return false;
    }

    return new Date(profile.last_active_at) >= oneDayAgo;
  }).length;
};

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTodayCount, setActiveTodayCount] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await adminSupabase.rpc("admin_get_all_profiles");
        if (data) {
          setUsers(data);
          setActiveTodayCount(calculateActiveTodayCount(data));
        }
      } finally {
        setLoading(false);
      }
    };

    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await adminSupabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (!error && data === true) {
        setIsAdmin(true);
        fetchUsers();
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user]);

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
          <h2 className="mt-4 font-heading text-2xl font-bold">
            Access Denied
          </h2>
          <p className="mt-2 text-muted-foreground">
            You don't have admin privileges to view this page.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="flex items-center gap-2 font-heading text-3xl font-extrabold">
            <Shield className="h-8 w-8 text-primary" /> Admin Panel
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage users and platform activity.
          </p>
        </motion.div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Total Users", value: users.length, icon: Users },
            { label: "Active Today", value: activeTodayCount, icon: Calendar },
            {
              label: "Total Sessions",
              value: users.reduce((a, u) => a + (u.sessions_completed || 0), 0),
              icon: Calendar,
            },
            {
              label: "Avg Points",
              value: Math.round(
                users.reduce((a, u) => a + (u.points || 0), 0) /
                  (users.length || 1)
              ),
              icon: Shield,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-4 shadow-card"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <stat.icon className="h-4 w-4" /> {stat.label}
              </div>
              <p className="mt-2 font-heading text-2xl font-extrabold">
                {stat.value}
              </p>
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
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-hero text-sm font-bold text-primary-foreground">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-sm font-bold">
                      {u.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.email}
                    </p>
                  </div>
                  <div className="hidden gap-1 md:flex">
                    {(u.skills || []).slice(0, 3).map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-primary">
                      {u.points || 0} pts
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {u.sessions_completed || 0} sessions
                    </p>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  No users found.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
