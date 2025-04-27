"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateTimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
  const minuteOptions = Array.from({ length: 4 }, (_, i) => i * 15).map(
    (minute) => ({
      value: minute.toString(),
      label: minute.toString().padStart(2, "0"),
    })
  );

  const hourOptions = Array.from({ length: 24 }, (_, i) => i).map((hour) => ({
    value: hour.toString(),
    label: hour.toString().padStart(2, "0"),
  }));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP p") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => {
            if (newDate) {
              const newDateTime = new Date(newDate);
              newDateTime.setHours(date.getHours(), date.getMinutes());
              setDate(newDateTime);
            }
          }}
          initialFocus
        />
        <div className="border-t border-border p-3 space-y-2">
          <div className="flex items-center space-x-2">
            <Select
              value={date.getHours().toString()}
              onValueChange={(value) => {
                const newDate = new Date(date);
                newDate.setHours(parseInt(value));
                setDate(newDate);
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent>
                {hourOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">:</span>
            <Select
              value={(Math.floor(date.getMinutes() / 15) * 15).toString()}
              onValueChange={(value) => {
                const newDate = new Date(date);
                newDate.setMinutes(parseInt(value));
                setDate(newDate);
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Minute" />
              </SelectTrigger>
              <SelectContent>
                {minuteOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
