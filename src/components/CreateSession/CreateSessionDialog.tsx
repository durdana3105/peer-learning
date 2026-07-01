import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateSession } from "@/hooks/useCreateSession";
import { SessionForm } from "./SessionForm";

interface CreateSessionDialogProps {
  onSessionCreated: () => void;
  children: React.ReactNode;
}

export function CreateSessionDialog({
  onSessionCreated,
  children,
}: CreateSessionDialogProps) {
  const [open, setOpen] = useState(false);

  const {
    form,
    isLoading,
    selectedPreset,
    setSelectedPreset,
    useCustom,
    setUseCustom,
    onSubmit,
  } = useCreateSession({
    onSuccess: onSessionCreated,
    setOpen,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px] bg-[#0f172a] text-white border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Schedule a Session
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Pick a date &amp; time at least 1 hour from now. Peers will see it
            in the calendar.
          </DialogDescription>
        </DialogHeader>

        <SessionForm
          form={form}
          onSubmit={onSubmit}
          isLoading={isLoading}
          selectedPreset={selectedPreset}
          setSelectedPreset={setSelectedPreset}
          useCustom={useCustom}
          setUseCustom={setUseCustom}
        />
      </DialogContent>
    </Dialog>
  );
}

export default CreateSessionDialog;
