"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface DateRange {
  start: string | null;
  end: string | null;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

type Preset = { label: string; days: number | null };

const PRESETS: Preset[] = [
  { label: "All Time", days: null },
  { label: "30 Days", days: 30 },
  { label: "90 Days", days: 90 },
  { label: "This Year", days: -1 },
];

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function presetRange(days: number | null): DateRange {
  if (days === null) return { start: null, end: null };
  const now = new Date();
  const end = toISODate(now);
  if (days === -1) {
    return { start: `${now.getFullYear()}-01-01`, end };
  }
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return { start: toISODate(start), end };
}

function activePreset(value: DateRange): number | null {
  for (let i = 0; i < PRESETS.length; i++) {
    const r = presetRange(PRESETS[i].days);
    if (r.start === value.start && r.end === value.end) return i;
  }
  return null;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const active = activePreset(value);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p, i) => (
        <Button
          key={p.label}
          size="sm"
          variant={active === i ? "default" : "outline"}
          onClick={() => {
            onChange(presetRange(p.days));
            setCustomOpen(false);
          }}
        >
          {p.label}
        </Button>
      ))}

      <Button
        size="sm"
        variant={active === null && (value.start || value.end) ? "default" : "outline"}
        onClick={() => setCustomOpen(!customOpen)}
      >
        Custom
      </Button>

      {customOpen && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="h-8 rounded-md border border-input bg-background px-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
            value={value.start ?? ""}
            onChange={(e) => onChange({ ...value, start: e.target.value || null })}
          />
          <span className="text-sm text-muted-foreground">to</span>
          <input
            type="date"
            className="h-8 rounded-md border border-input bg-background px-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
            value={value.end ?? ""}
            onChange={(e) => onChange({ ...value, end: e.target.value || null })}
          />
        </div>
      )}
    </div>
  );
}
