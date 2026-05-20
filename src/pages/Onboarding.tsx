import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, GraduationCap, Users, UserRoundCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type RoleChoice = "learner" | "mentor" | "both";

const roleOptions: {
  id: RoleChoice;
  title: string;
  description: string;
  is_mentor: boolean;
  is_learner: boolean;
  icon: typeof GraduationCap;
}[] = [
  {
    id: "learner",
    title: "I want to Learn",
    description: "Join sessions, ask questions, and learn from mentors.",
    is_mentor: false,
    is_learner: true,
    icon: GraduationCap,
  },
  {
    id: "mentor",
    title: "I want to Mentor",
    description: "Guide learners, share experience, and host sessions.",
    is_mentor: true,
    is_learner: false,
    icon: UserRoundCheck,
  },
  {
    id: "both",
    title: "I want to do Both",
    description: "Learn from others while also mentoring peers.",
    is_mentor: true,
    is_learner: true,
    icon: Users,
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<RoleChoice | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login", { replace: true });
      }
    };

    void checkUser();
  }, [navigate]);

  const handleRoleSelect = async (
    role: Pick<(typeof roleOptions)[number], "id" | "is_mentor" | "is_learner">
  ) => {
    setSelectedRole(role.id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSelectedRole(null);
      toast({
        title: "Authentication required",
        description: "Please log in to continue.",
        variant: "destructive",
      });
      navigate("/login", { replace: true });
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ is_mentor: role.is_mentor, is_learner: role.is_learner })
      .eq("id", user.id);

    if (error) {
      setSelectedRole(null);
      toast({
        title: "Could not update role",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-5xl">
        <div className="mb-10 text-center text-slate-100">
          <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2">
            <BookOpen className="h-5 w-5 text-emerald-300" />
            <span className="text-sm font-medium tracking-wide text-emerald-200">
              PeerLearn
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to PeerLearn
          </h1>
          <p className="mt-3 text-base text-slate-300">
            Choose how you want to use the platform.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {roleOptions.map((role) => {
            const Icon = role.icon;
            const isLoading = selectedRole === role.id;

            return (
              <Card
                key={role.id}
                className="border-white/10 bg-white/5 text-slate-100 transition hover:border-emerald-400/50 hover:bg-white/10"
              >
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{role.title}</CardTitle>
                  <CardDescription className="text-slate-300">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    type="button"
                    onClick={() => void handleRoleSelect(role)}
                    disabled={selectedRole !== null}
                    className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                        Saving...
                      </span>
                    ) : (
                      "Select"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
