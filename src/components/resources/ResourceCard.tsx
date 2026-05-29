import { memo, useContext, useMemo, useState } from "react";
import { Archive, Code, Download, FileText, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { AuthContext } from "@/contexts/AuthContext";
import { deleteResource } from "@/lib/deleteResource";
import { downloadResource } from "@/lib/downloadResource";
import type { Resource } from "@/types/resource";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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

  const isOwner = currentUser?.id === resource.uploaded_by;

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

      <CardFooter className="mt-auto flex flex-wrap gap-2">
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
      </CardFooter>
    </Card>
  );
};

export default memo(ResourceCard);
