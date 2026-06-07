import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addHours } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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

const formSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters."),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters."),
    date: z.date({ required_error: "A date is required." }),
    time: z.string().min(1, "Time is required."),
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
    },
  );

type FormValues = z.infer<typeof formSchema>;

type SessionRecord = {
  id: number;
  title: string | null;
  description: string | null;
  scheduled_at: string | null;
  seat_limit: number | null;
};

interface EditSessionDialogProps {
  session: SessionRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionUpdated: () => void;
}

export function EditSessionDialog({
  session,
  open,
  onOpenChange,
  onSessionUpdated,
}: EditSessionDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      time: "12:00",
      seatLimit: "",
    },
  });

  useEffect(() => {
    if (!session || !open) return;

    const scheduledAt = session.scheduled_at
      ? new Date(session.scheduled_at)
      : new Date();

    form.reset({
      title: session.title || "",
      description: session.description || "",
      date: scheduledAt,
      time: format(scheduledAt, "HH:mm"),
      seatLimit: session.seat_limit ? String(session.seat_limit) : "",
    });
  }, [session, open, form]);

  async function onSubmit(values: FormValues) {
    if (!session) return;

    setIsLoading(true);

    try {
      const [hours, minutes] = values.time.split(":").map(Number);
      const scheduledAt = new Date(values.date);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const seatLimit =
        values.seatLimit && values.seatLimit.trim() !== ""
          ? parseInt(values.seatLimit, 10)
          : null;

      const { error } = await supabase
        .from("sessions")
        .update({
          title: values.title,
          description: values.description,
          scheduled_at: scheduledAt.toISOString(),
          seat_limit: seatLimit,
        })
        .eq("id", session.id);

      if (error) throw error;

      toast({
        title: "Session updated",
        description: "Your session details were saved.",
      });

      onOpenChange(false);
      onSessionUpdated();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Something went wrong.";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-[#0f172a] text-white border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Session</DialogTitle>
          <DialogDescription className="text-gray-400">
            Update the schedule, description, or seat limit for this session.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input className={inputCls} {...field} />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea className={`${inputCls} resize-none`} rows={3} {...field} />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

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
                              !field.value && "text-gray-500",
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : "Pick a date"}
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
                      <Input type="time" className={inputCls} {...field} />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="seatLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seat Limit (Optional)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} className={inputCls} {...field} />
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
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
