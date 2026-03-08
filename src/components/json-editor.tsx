"use client";

import React, { useState, useEffect } from "react";
import { Task } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Copy, ClipboardPaste, Braces } from "lucide-react";

interface JsonEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  onSave: (tasks: Task[]) => void;
}

export function JsonEditor({ open, onOpenChange, tasks, onSave }: JsonEditorProps) {
  const [json, setJson] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      const simplified = tasks.map((t) => ({
        text: t.text,
        details: t.details || undefined,
        completed: t.completed,
        dueDate: t.dueDate || undefined,
      }));
      setJson(JSON.stringify(simplified, null, 2));
      setError("");
    }
  }, [open, tasks]);

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJson(text);
    } catch {
      // clipboard not available
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(json);
      setJson(JSON.stringify(parsed, null, 2));
      setError("");
    } catch {
      setError("Invalid JSON - cannot format");
    }
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) {
        setError("JSON must be an array of tasks");
        return;
      }
      const now = new Date().toISOString();
      const newTasks: Task[] = parsed.map((item: { text?: string; details?: string; completed?: boolean; dueDate?: string }) => {
        if (!item.text || typeof item.text !== "string") {
          throw new Error("Each task must have a 'text' property");
        }
        return {
          id: crypto.randomUUID(),
          text: item.text,
          details: item.details || "",
          completed: !!item.completed,
          createdAt: now,
          updatedAt: now,
          dueDate: item.dueDate || undefined,
        };
      });
      onSave(newTasks);
      onOpenChange(false);
    } catch (err) {
      setError((err as Error).message || "Invalid JSON");
    }
  };

  const taskCount = (() => {
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>JSON Editor</DialogTitle>
          <DialogDescription>Edit tasks as JSON. Each item needs at least a &quot;text&quot; property.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-3 w-3 mr-1" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handlePaste}>
            <ClipboardPaste className="h-3 w-3 mr-1" /> Paste
          </Button>
          <Button variant="outline" size="sm" onClick={handleFormat}>
            <Braces className="h-3 w-3 mr-1" /> Format
          </Button>
          <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">{taskCount} task(s)</span>
        </div>

        <Textarea
          value={json}
          onChange={(e) => { setJson(e.target.value); setError(""); }}
          className="flex-1 min-h-[300px] font-mono text-sm"
          placeholder='[{"text": "My task", "details": "optional markdown", "completed": false}]'
        />

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Tasks</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
