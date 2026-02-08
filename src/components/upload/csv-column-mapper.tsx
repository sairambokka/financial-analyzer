"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ColumnMappings } from "@/lib/types/parsing.types";
import { autoDetectColumns } from "@/lib/parsers/csv-parser";

interface CSVColumnMapperProps {
  headers: string[];
  onConfirm: (mappings: ColumnMappings) => void;
  onCancel: () => void;
}

const UNMAPPED = "__unmapped__";

export function CSVColumnMapper({ headers, onConfirm, onCancel }: CSVColumnMapperProps) {
  const [date, setDate] = useState(UNMAPPED);
  const [description, setDescription] = useState(UNMAPPED);
  const [amount, setAmount] = useState(UNMAPPED);
  const [credit, setCredit] = useState(UNMAPPED);
  const [debit, setDebit] = useState(UNMAPPED);
  const [useSeparate, setUseSeparate] = useState(false);

  useEffect(() => {
    const detected = autoDetectColumns(headers);
    if (detected.date) setDate(detected.date);
    if (detected.description) setDescription(detected.description);
    if (detected.amount) setAmount(detected.amount);
    if (detected.credit && detected.debit) {
      setCredit(detected.credit);
      setDebit(detected.debit);
      setUseSeparate(true);
    }
  }, [headers]);

  const isValid = useSeparate
    ? date !== UNMAPPED && description !== UNMAPPED && credit !== UNMAPPED && debit !== UNMAPPED
    : date !== UNMAPPED && description !== UNMAPPED && amount !== UNMAPPED;

  function handleConfirm() {
    const mappings: ColumnMappings = { date, description, amount };
    if (useSeparate) {
      mappings.credit = credit;
      mappings.debit = debit;
    }
    onConfirm(mappings);
  }

  function renderSelect(label: string, value: string, onChange: (v: string) => void) {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{label}</label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select column" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNMAPPED}>— Not mapped —</SelectItem>
            {headers.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Map CSV Columns</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderSelect("Date", date, setDate)}
        {renderSelect("Description", description, setDescription)}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="separate-cols"
            checked={useSeparate}
            onChange={(e) => setUseSeparate(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="separate-cols" className="text-sm">
            Separate credit/debit columns
          </label>
        </div>

        {useSeparate ? (
          <>
            {renderSelect("Credit Column", credit, setCredit)}
            {renderSelect("Debit Column", debit, setDebit)}
          </>
        ) : (
          renderSelect("Amount", amount, setAmount)
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={handleConfirm} disabled={!isValid}>
            Continue
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
