"use client";

import { ko } from "date-fns/locale";
import * as React from "react";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function DateTimePicker({ value, onChange, className }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  function handleDaySelect(day: Date | undefined) {
    if (!day) return;
    onChange(day);
    setOpen(false);
  }

  const formatted = value.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "w-full rounded-2xl border border-gray-200 px-4 py-3 text-left text-sm outline-none focus:border-black",
          className
        )}
      >
        {formatted}
      </PopoverTrigger>
      <PopoverContent className="w-[var(--anchor-width)] rounded-2xl p-0 overflow-hidden" align="start" sideOffset={6}>
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDaySelect}
          locale={ko}
          captionLayout="label"
          className="w-full p-3 [--cell-size:--spacing(10)]"
        />
      </PopoverContent>
    </Popover>
  );
}
