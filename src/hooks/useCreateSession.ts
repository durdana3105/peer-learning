import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addHours } from "date-fns";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAwardXP } from "@/hooks/useAwardXP";

export const MIN_CUSTOM_DURATION = 15;
export const MAX_CUSTOM_DURATION = 480;

export const formSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters."),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters."),
    date: z.date({ required_error: "A date is required." }),
    time: z.string().min(1, "Time is required."),
    useCustom: z.boolean().default(false),
    durationPreset: z.number().optional(),
    durationCustom: z.string().optional(),
    seatLimit: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    // ── Scheduled time must be at least 1 hour from now ──
    const [h, m] = v.time.split(":").map(Number);
    const dt = new Date(v.date);
    dt.setHours(h, m, 0, 0);
    if (dt.getTime() < addHours(new Date(), 1).getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Session must be scheduled at least 1 hour from now.",
        path: ["time"],
      });
    }

    // ── Custom duration must be a valid number in range ──
    if (v.useCustom) {
      const raw = (v.durationCustom ?? "").trim();

      if (raw === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a custom duration in minutes.",
          path: ["durationCustom"],
        });
      } else {
        const num = Number(raw);
        if (!Number.isFinite(num) || !Number.isInteger(num)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Duration must be a whole number of minutes.",
            path: ["durationCustom"],
          });
        } else if (num < MIN_CUSTOM_DURATION) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duration must be at least ${MIN_CUSTOM_DURATION} minutes.`,
            path: ["durationCustom"],
          });
        } else if (num > MAX_CUSTOM_DURATION) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duration cannot exceed ${MAX_CUSTOM_DURATION} minutes.`,
            path: ["durationCustom"],
          });
        }
      }
    }
  });

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
  const awardXP = useAwardXP();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      time: "12:00",
      useCustom: false,
      durationPreset: 60,
      durationCustom: "",
      seatLimit: "",
    },
  });

  const useCustom = form.watch("useCustom");

  const setUseCustom = useCallback((val: boolean) => {
    form.setValue("useCustom", val);
    if (!val) {
      form.clearErrors("durationCustom");
    }
  }, [form]);

  const resolveDurationMinutes = useCallback((values: FormValues): number => {
    if (values.useCustom) {
      return parseInt(values.durationCustom as string, 10);
    }
    return selectedPreset;
  }, [selectedPreset]);

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
  }, [user, resolveDurationMinutes, form, toast, awardXP, onSuccess, setOpen, setUseCustom]);

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
