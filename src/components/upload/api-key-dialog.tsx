"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentKey: string;
  onSave: (key: string) => void;
  onClear: () => void;
}

export function ApiKeyDialog({
  open,
  onOpenChange,
  currentKey,
  onSave,
  onClear,
}: ApiKeyDialogProps) {
  const [key, setKey] = useState(currentKey);

  function handleSave() {
    if (key.trim()) {
      onSave(key.trim());
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anthropic API Key</DialogTitle>
          <DialogDescription>
            Your API key is stored only in your browser&apos;s localStorage and sent directly to the Anthropic API. It is never sent to our servers.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="password"
          placeholder="sk-ant-..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <DialogFooter className="gap-2">
          {currentKey && (
            <Button
              variant="destructive"
              onClick={() => {
                onClear();
                setKey("");
                onOpenChange(false);
              }}
            >
              Remove Key
            </Button>
          )}
          <Button onClick={handleSave} disabled={!key.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
