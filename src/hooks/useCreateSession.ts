import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addHours } from "date-fns";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAwardXP } from "@/hooks/useAwardXP";

export const formSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters."),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters."),
    date: z.date({ required_error: "A date is required." }),
    time: z.string().min(1, "Time is required."),
    durationPreset: z.number().optional(),
    durationCustom: z.string().optional(),
    seatLimit: z.string().optional(),
  })
  .refine(
    (v) => {
      const [h, m] = v.time.split(":").map(Number);
      const dt = new Date(v.date);
      dt.setHours(h, m, 0, 0);
      return dt.getTime() >= addHours(new Date(), 1).getTime();
    },
    {
      message: "Session must be scheduled at least 1 hour from now.",
      path: ["time"],
    }
  );

export type FormValues = z.infer<typeof formSchema>;

interface UseCreateSessionProps {
  onSuccess: () => void;
  setOpen: (open: boolean) => void;
}

export function useCreateSession({ onSuccess, setOpen }: UseCreateSessionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number>(60);
  const [useCustom, setUseCustom] = useState(false);
  const awardXP = useAwardXP();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      time: "12:00",
      durationPreset: 60,
      seatLimit: "",
    },
  });

  const resolveDurationMinutes = useCallback((values: FormValues): number => {
    if (useCustom) {
      const c = parseInt(values.durationCustom ?? "", 10);
      return isNaN(c) || c < 15 ? 60 : c;
    }
    return selectedPreset;
  }, [useCustom, selectedPreset]);

  const onSubmit = useCallback(async (values: FormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a session.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const [hours, minutes] = values.time.split(":").map(Number);
      const scheduledAt = new Date(values.date);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const durationMinutes = resolveDurationMinutes(values);
      const seatLimit = values.seatLimit && values.seatLimit.trim() !== "" ? parseInt(values.seatLimit, 10) : null;

      const { error } = await supabase.from("sessions").insert({
        title: values.title,
        description: values.description,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: durationMinutes,
        status: "scheduled",
        mentor_id: user.id,
        seat_limit: seatLimit,
      });

      if (error) throw error;

      toast({
        title: "Session scheduled! 🎉",
        description: `"${values.title}" is scheduled for ${format(scheduledAt, "PPP 'at' p")}.`,
      });

      form.reset();
      setSelectedPreset(60);
      setUseCustom(false);
      setOpen(false);
      awardXP.mutate({ activity: "host_session" });
      onSuccess();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Something went wrong.";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, resolveDurationMinutes, form, toast, awardXP, onSuccess, setOpen]);

  return {
    form,
    isLoading,
    selectedPreset,
    setSelectedPreset,
    useCustom,
    setUseCustom,
    onSubmit,
  };
}
