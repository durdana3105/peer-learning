import { BookOpen } from "lucide-react";

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <BookOpen className="h-7 w-7 text-primary" />

      <span className="text-xl font-bold tracking-tight">
        PeerLearning
      </span>
    </div>
  );
};

export default Logo;