import { memo, useContext, useEffect, useMemo, useState } from "react";
import { Archive, Bookmark, Code, Download, FileText, Loader2, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { AuthContext } from "@/contexts/AuthContext";
import { deleteResource } from "@/lib/deleteResource";
import { downloadResource } from "@/lib/downloadResource";
import type { Resource } from "@/types/resource";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useResourceInteractions } from "@/hooks/useResourceInteractions";
import { cn } from "@/lib/utils";

type ResourceCardProps = {
  resource: Resource;
  onDelete: () => void;
};

const formatFileSize = (size: number | null) => {
  if (!size) return "Unknown size";
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(size / 1024).toFixed(2)} KB`;
};

const ResourceCard = ({ resource, onDelete }: ResourceCardProps) => {
  const auth = useContext(AuthContext);
  const currentUser = auth?.user ?? null;

  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(resource.upvotes_count || 0);
  const [localDownvotes, setLocalDownvotes] = useState(resource.downvotes_count || 0);
  const [pendingVote, setPendingVote] = useState<1 | -1 | null | undefined>(undefined);

  const isOwner = currentUser?.id === resource.uploaded_by;

  const { vote, isSaved, toggleVote, toggleSave } = useResourceInteractions(
    resource.id,
    currentUser?.id
  );

  const displayedVote = pendingVote !== undefined ? pendingVote : vote;

  useEffect(() => {
    setLocalUpvotes(resource.upvotes_count || 0);
    setLocalDownvotes(resource.downvotes_count || 0);
  }, [resource.upvotes_count, resource.downvotes_count]);

  const resourceIcon = useMemo(() => {
    if (["py", "js", "ts"].includes(resource.file_type)) {
      return Code;
    }

    if (resource.file_type === "zip") {
      return Archive;
    }

    return FileText;
  }, [resource.file_type]);

  const Icon = resourceIcon;

  const handleDownload = async () => {
    setIsDownloading(true);

    const filename = resource.title.toLowerCase().endsWith(`.${resource.file_type}`)
      ? resource.title
      : `${resource.title}.${resource.file_type}`;

    const result = await downloadResource(resource.file_url, filename);
    setIsDownloading(false);

    if (!result.success) {
      toast.error(result.error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    const result = await deleteResource(resource.id);
    setIsDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Resource deleted successfully.");
    onDelete();
  };

  const handleVote = async (type: 1 | -1) => {
    if (!currentUser) {
      toast.error("Please login to vote");
      return;
    }

    if (pendingVote !== undefined) return;

    const previousVote = vote;
    const newVote = previousVote === type ? null : type;

    let upvoteDelta = 0;
    let downvoteDelta = 0;
    if (previousVote === 1) upvoteDelta -= 1;
    if (previousVote === -1) downvoteDelta -= 1;
    if (newVote === 1) upvoteDelta += 1;
    if (newVote === -1) downvoteDelta += 1;

    setPendingVote(newVote);
    setLocalUpvotes((prev) => prev + upvoteDelta);
    setLocalDownvotes((prev) => prev + downvoteDelta);

    try {
      await toggleVote(newVote);
    } catch (e) {
      setLocalUpvotes((prev) => prev - upvoteDelta);
      setLocalDownvotes((prev) => prev - downvoteDelta);
      toast.error("Failed to register vote");
    } finally {
      setPendingVote(undefined);
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      toast.error("Please login to save resources");
      return;
    }
    try {
      await toggleSave(!isSaved);
    } catch (e) {
      toast.error("Failed to save resource");
    }
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-lg">{resource.title}</CardTitle>
              <Badge variant="secondary" className="uppercase">
                {resource.file_type}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(isSaved && "text-primary")}
            onClick={handleSave}
            aria-label={isSaved ? "Unsave resource" : "Save resource"}
            title={isSaved ? "Unsave resource" : "Save resource"}
          >
            <Bookmark className="h-5 w-5" fill={isSaved ? "currentColor" : "none"} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <p className="overflow-hidden text-sm text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
          {resource.description || "No description provided."}
        </p>

        <div className="flex flex-wrap gap-2">
          {resource.tags?.length ? (
            resource.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))
          ) : (
            <Badge variant="outline">No tags</Badge>
          )}
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p>Uploaded {format(new Date(resource.created_at), "MMM d, yyyy")}</p>
          <p>{formatFileSize(resource.file_size)}</p>
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex flex-col gap-3">
        <div className="flex items-center gap-2 w-full justify-start border-b pb-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("gap-1.5", displayedVote === 1 && "text-green-600 bg-green-50")}
            onClick={() => handleVote(1)}
            disabled={pendingVote !== undefined}
          >
            <ThumbsUp className="h-4 w-4" fill={displayedVote === 1 ? "currentColor" : "none"} />
            <span className="text-xs font-medium">{localUpvotes}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("gap-1.5", displayedVote === -1 && "text-red-600 bg-red-50")}
            onClick={() => handleVote(-1)}
            disabled={pendingVote !== undefined}
          >
            <ThumbsDown className="h-4 w-4" fill={displayedVote === -1 ? "currentColor" : "none"} />
            <span className="text-xs font-medium">{localDownvotes}</span>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 w-full">
          <Button onClick={handleDownload} disabled={isDownloading || isDeleting} className="flex-1">
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isDownloading ? "Downloading..." : "Download"}
          </Button>

          {isOwner ? (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || isDownloading}
              className="flex-1"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
};

export default memo(ResourceCard);
