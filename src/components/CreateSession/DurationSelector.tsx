import React from "react";
import { Clock } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FormValues, MIN_CUSTOM_DURATION, MAX_CUSTOM_DURATION } from "@/hooks/useCreateSession";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const DURATION_PRESETS = [
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
];

interface DurationSelectorProps {
  form: UseFormReturn<FormValues>;
  selectedPreset: number;
  setSelectedPreset: (val: number) => void;
  useCustom: boolean;
  setUseCustom: (val: boolean) => void;
  inputCls: string;
}

export const DurationSelector = React.memo(function DurationSelector({
  form,
  selectedPreset,
  setSelectedPreset,
  useCustom,
  setUseCustom,
  inputCls,
}: DurationSelectorProps) {
  return (
    <div>
      <label className="block mb-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Duration
      </label>
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
                  min={MIN_CUSTOM_DURATION}
                  max={MAX_CUSTOM_DURATION}
                  placeholder={`Minutes (${MIN_CUSTOM_DURATION}–${MAX_CUSTOM_DURATION})`}
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
  );
});
