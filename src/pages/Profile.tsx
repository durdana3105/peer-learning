import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [teachInput, setTeachInput] = useState("");
  const [teachSubjects, setTeachSubjects] = useState<string[]>([]);
  const [learnInput, setLearnInput] = useState("");
  const [learnSubjects, setLearnSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setName(data.name || "");
        setBio(data.bio || "");
        setSkills(data.skills || []);
        setInterests(data.interests || []);
        setTeachSubjects(data.teach_subjects || []);
        setLearnSubjects(data.learn_subjects || []);
      }
      setLoading(false);
    });
  }, [user]);

  const addTag = (value: string, list: string[], setter: (v: string[]) => void, inputSetter: (v: string) => void) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setter([...list, trimmed]);
    }
    inputSetter("");
  };

  const removeTag = (tag: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      name, bio, skills, interests, teach_subjects: teachSubjects, learn_subjects: learnSubjects,
    }).eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved!", description: "Your changes have been saved." });
    }
  };

  const TagInput = ({ label, value, onChange, list, onAdd, onRemove, color }: {
    label: string; value: string; onChange: (v: string) => void;
    list: string[]; onAdd: () => void; onRemove: (t: string) => void; color: string;
  }) => (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 flex gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={`Add ${label.toLowerCase()}...`}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }} />
        <Button type="button" variant="outline" size="icon" onClick={onAdd}><Plus className="h-4 w-4" /></Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {list.map((tag) => (
          <Badge key={tag} variant="secondary" className={`${color} gap-1`}>
            {tag}
            <button onClick={() => onRemove(tag)}><X className="h-3 w-3" /></button>
          </Badge>
        ))}
      </div>
    </div>
  );

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background py-8">
        <div className="container max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-heading text-3xl font-extrabold">Edit Profile ✏️</h1>
            <p className="mt-1 text-muted-foreground">Tell peers about yourself.</p>
          </motion.div>

          <div className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-6 shadow-card">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="mt-1" placeholder="Tell us about yourself..." />
            </div>

            <TagInput label="Skills" value={skillInput} onChange={setSkillInput} list={skills}
              onAdd={() => addTag(skillInput, skills, setSkills, setSkillInput)}
              onRemove={(t) => removeTag(t, skills, setSkills)} color="" />

            <TagInput label="Interests" value={interestInput} onChange={setInterestInput} list={interests}
              onAdd={() => addTag(interestInput, interests, setInterests, setInterestInput)}
              onRemove={(t) => removeTag(t, interests, setInterests)} color="" />

            <TagInput label="Subjects You Teach" value={teachInput} onChange={setTeachInput} list={teachSubjects}
              onAdd={() => addTag(teachInput, teachSubjects, setTeachSubjects, setTeachInput)}
              onRemove={(t) => removeTag(t, teachSubjects, setTeachSubjects)} color="" />

            <TagInput label="Subjects You Want to Learn" value={learnInput} onChange={setLearnInput} list={learnSubjects}
              onAdd={() => addTag(learnInput, learnSubjects, setLearnSubjects, setLearnInput)}
              onRemove={(t) => removeTag(t, learnSubjects, setLearnSubjects)} color="" />

            <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
