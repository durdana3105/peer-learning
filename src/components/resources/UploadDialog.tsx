import { useContext, useMemo, useRef, useState, type FormEvent } from "react";
import { Loader2, Upload, FileUp } from "lucide-react";
import { toast } from "sonner";

import { AuthContext } from "@/contexts/AuthContext";
import { uploadResource } from "@/lib/uploadResource";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAwardXP } from "@/hooks/useAwardXP";

type UploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const ACCEPTED_FILES = ".pdf,.docx,.zip,.py,.js,.ts,.md,.txt";

const formatFileSize = (size: number) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(size / 1024).toFixed(2)} KB`;
};

const UploadDialog = ({ open, onOpenChange, onSuccess }: UploadDialogProps) => {
  const auth = useContext(AuthContext);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const awardXP = useAwardXP();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const currentUser = auth?.user ?? null;

  const parsedTags = useMemo(
    () =>
      tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tags]
  );

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTags("");
    setFile(null);
    setIsDragging(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFileSelection = (selectedFile: File | null) => {
    if (!selectedFile) return;
    setFile(selectedFile);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentUser) {
      toast.error("You must be signed in to upload resources.");
      return;
    }

    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    setIsUploading(true);

    const result = await uploadResource(
      file,
      title.trim(),
      description.trim(),
      parsedTags
    );

    setIsUploading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Resource uploaded successfully.");
    awardXP.mutate({ activity: "resource_upload" });
    resetForm();
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen && !isUploading) {
          resetForm();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Resource</DialogTitle>
          <DialogDescription>
            Add notes, code, references, and supporting files for the learning community.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Title</label>
            <Input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Linear Algebra Notes"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Short summary of what this resource contains."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tags</label>
            <Input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="math, pdf, notes"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">File</label>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_FILES}
              className="hidden"
              onChange={(event) => handleFileSelection(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                handleFileSelection(event.dataTransfer.files?.[0] ?? null);
              }}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/30 hover:bg-muted/50"
              )}
            >
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <FileUp className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Drag and drop a file here</p>
                <p className="text-xs text-muted-foreground">
                  Or click to browse. Accepted: PDF, DOCX, ZIP, PY, JS, TS, MD, TXT
                </p>
              </div>
            </button>

            {file ? (
              <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || !currentUser}>
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isUploading ? "Uploading..." : "Upload Resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
