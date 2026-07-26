import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getSafePeerReviewSubmissionUrl } from "@/utils/peerReviewUrl";
import { ArrowLeft, Send } from "lucide-react";
import { Link } from "react-router-dom";

export default function SubmitForReview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content_url: "",
    content: "",
    is_anonymous: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const safeContentUrl = getSafePeerReviewSubmissionUrl(formData.content_url);

    if (safeContentUrl === null) {
      toast.error("Validation Error", {
  description: "Please enter a valid http:// or https:// link."
});
      return;
    }

    if (!formData.title || (!safeContentUrl && !formData.content)) {
      toast.error("Validation Error", {
  description: "Please provide a title and either a link or text content."
});
      return;
    }

    setLoading(true);
    
    const { error } = await supabase
      .from('peer_submissions')
      .insert({
        user_id: formData.is_anonymous ? null : user.id,
        title: formData.title,
        description: formData.description,
        content_url: safeContentUrl,
        content: formData.content,
        is_anonymous: formData.is_anonymous,
        status: 'pending'
      });

    setLoading(false);

    if (error) {
      toast.error("Error", {
  description: error.message
});
    } else {
      toast.success("Success", {
  description: "Your work has been submitted for peer review."
});
      navigate("/peer-review");
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link to="/peer-review" className="mb-6 inline-flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Link>
      
      <div className="rounded-2xl border border-white/10 bg-[#050816]/50 p-6 backdrop-blur-xl md:p-8">
        <h1 className="mb-2 text-2xl font-bold text-white">Submit for Peer Review</h1>
        <p className="mb-8 text-slate-400">Share your project, code, or essay and get constructive feedback from the community.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">Title</Label>
            <Input 
              id="title" 
              placeholder="e.g. My React Portfolio" 
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Context / Description</Label>
            <Textarea 
              id="description" 
              placeholder="What specifically do you want feedback on? (e.g. Design, Code quality, Logic)" 
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 min-h-[100px]"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content_url" className="text-white">Link (Optional)</Label>
            <Input 
              id="content_url" 
              type="url"
              placeholder="https://github.com/..." 
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              value={formData.content_url}
              onChange={(e) => setFormData({...formData, content_url: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content" className="text-white">Code/Text Content (Optional)</Label>
            <Textarea 
              id="content" 
              placeholder="Paste your code snippet or essay here..." 
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 font-mono text-sm min-h-[200px]"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
            />
          </div>

          <div className="flex items-center space-x-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <Switch 
              id="is_anonymous" 
              checked={formData.is_anonymous}
              onCheckedChange={(checked) => setFormData({...formData, is_anonymous: checked})}
            />
            <div className="space-y-0.5">
              <Label htmlFor="is_anonymous" className="text-white font-medium">Submit Anonymously</Label>
              <p className="text-xs text-slate-400">Your name and profile will be hidden from reviewers.</p>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold shadow-lg hover:from-cyan-400 hover:to-blue-500"
            disabled={loading}
          >
            {loading ? "Submitting..." : <><Send className="mr-2 h-4 w-4" /> Submit for Review</>}
          </Button>
        </form>
      </div>
    </div>
  );
}
