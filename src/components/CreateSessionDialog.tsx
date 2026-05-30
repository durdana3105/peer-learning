import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addHours } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ── Duration presets ──────────────────────────────────────────
const DURATION_PRESETS = [
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
];

// ── Validation schema ──────────────────────────────────────────
const formSchema = z
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

type FormValues = z.infer<typeof formSchema>;

interface CreateSessionDialogProps {
  onSessionCreated: () => void;
  children: React.ReactNode;
}

export function CreateSessionDialog({
  onSessionCreated,
  children,
}: CreateSessionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number>(60);
  const [useCustom, setUseCustom] = useState(false);

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

  const resolveDurationMinutes = (values: FormValues): number => {
    if (useCustom) {
      const c = parseInt(values.durationCustom ?? "", 10);
      return isNaN(c) || c < 15 ? 60 : c;
    }
    return selectedPreset;
  };

  async function onSubmit(values: FormValues) {
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
      onSessionCreated();
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
  }

  const inputCls =
    "bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-cyan-500";

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

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. React Hooks Deep Dive"
                      className={inputCls}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What will you cover in this session?"
                      className={`${inputCls} resize-none`}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            {/* Date + Time row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white",
                              !field.value && "text-gray-500"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-[#0f172a] border-white/10"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                          className="text-white"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        className={inputCls}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            {/* Duration selector */}
            <div>
              <FormLabel className="block mb-2">Duration</FormLabel>
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(p.value);
                      setUseCustom(false);
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      !useCustom && selectedPreset === p.value
                        ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-black"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <Clock size={14} />
                    {p.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setUseCustom(true)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    useCustom
                      ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-black"
                      : "bg-white/5 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  Custom
                </button>
              </div>

              {useCustom && (
                <FormField
                  control={form.control}
                  name="durationCustom"
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <FormControl>
                        <Input
                          type="number"
                          min={15}
                          max={480}
                          placeholder="Minutes (e.g. 45)"
                          className={inputCls}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Seat Limit */}
            <FormField
              control={form.control}
              name="seatLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seat Limit (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="e.g. 50"
                      className={inputCls}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold hover:opacity-90 transition mt-2"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Scheduling..." : "Schedule Session"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
