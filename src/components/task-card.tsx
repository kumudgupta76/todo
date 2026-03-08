"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isOverdue, isUrgent, formatRelativeDate, playCompletionSound } from "@/lib/helpers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  GripVertical, ChevronDown, Trash2, Edit3, FileText,
  Clock, Calendar, Check
} from "lucide-react";

interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  soundEnabled: boolean;
}

export function TaskCard({ task, onUpdate, onDelete, onDragStart, onDragEnter, onDragEnd, soundEnabled }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [details, setDetails] = useState(task.details);
  const [showPreview, setShowPreview] = useState(false);
  const [showRelativeDate, setShowRelativeDate] = useState(true);
  const [justCompleted, setJustCompleted] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const detailsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDetails(task.details);
  }, [task.details]);

  const toggleComplete = useCallback(() => {
    const newCompleted = !task.completed;
    if (newCompleted) {
      setJustCompleted(true);
      setShowParticles(true);
      if (soundEnabled) playCompletionSound();
      setTimeout(() => setJustCompleted(false), 600);
      setTimeout(() => setShowParticles(false), 500);
    }
    onUpdate({
      ...task,
      completed: newCompleted,
      updatedAt: new Date().toISOString(),
    });
  }, [task, onUpdate, soundEnabled]);

  const handleEditSubmit = () => {
    if (editText.trim()) {
      onUpdate({ ...task, text: editText.trim(), updatedAt: new Date().toISOString() });
    }
    setEditing(false);
  };

  const handleDetailsChange = (val: string) => {
    setDetails(val);
    if (detailsTimerRef.current) clearTimeout(detailsTimerRef.current);
    detailsTimerRef.current = setTimeout(() => {
      onUpdate({ ...task, details: val, updatedAt: new Date().toISOString() });
    }, 1000);
  };

  const handleSetDueDate = (dateStr: string) => {
    onUpdate({ ...task, dueDate: dateStr || undefined, updatedAt: new Date().toISOString() });
  };

  const handleQuickDue = (hours: number) => {
    const d = new Date(Date.now() + hours * 3600000);
    handleSetDueDate(d.toISOString());
  };

  const overdue = !task.completed && isOverdue(task.dueDate);
  const urgent = !task.completed && !overdue && isUrgent(task.dueDate);

  return (
    <Card
      className={cn(
        "transition-all",
        overdue && "border-l-4 border-l-red-500",
        urgent && "border-l-4 border-l-orange-500",
        task.completed && "opacity-50",
        justCompleted && "animate-task-complete"
      )}
    >
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <div
          className="flex items-center gap-2 p-3 group"
          draggable
          onDragStart={onDragStart}
          onDragEnter={onDragEnter}
          onDragEnd={onDragEnd}
          onDragOver={(e) => e.preventDefault()}
        >
          {/* Drag Handle */}
          <GripVertical className="h-4 w-4 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 cursor-grab hidden md:block shrink-0" />

          {/* Checkbox */}
          <button
            onClick={toggleComplete}
            className={cn(
              "relative h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
              task.completed
                ? "border-green-500 bg-green-500"
                : "border-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))]",
              justCompleted && "animate-checkbox-pop"
            )}
          >
            {task.completed && (
              <Check className={cn("h-3 w-3 text-white", justCompleted && "animate-checkmark")} />
            )}
            {showParticles && (
              <>
                <span className="absolute h-1.5 w-1.5 rounded-full bg-green-400 animate-particle-1" />
                <span className="absolute h-1.5 w-1.5 rounded-full bg-green-400 animate-particle-2" />
                <span className="absolute h-1.5 w-1.5 rounded-full bg-green-400 animate-particle-3" />
                <span className="absolute h-1.5 w-1.5 rounded-full bg-green-400 animate-particle-4" />
              </>
            )}
            {justCompleted && (
              <span className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping-once" />
            )}
          </button>

          {/* Task Text */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <Input
                ref={editInputRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleEditSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditSubmit();
                  if (e.key === "Escape") { setEditText(task.text); setEditing(false); }
                }}
                className="h-7 text-sm"
                autoFocus
              />
            ) : (
              <p
                className={cn("text-sm truncate", task.completed && "line-through")}
                onDoubleClick={() => { setEditing(true); setEditText(task.text); }}
              >
                {task.text}
              </p>
            )}
          </div>

          {/* Due Date Badge */}
          {task.dueDate && (
            <button
              onClick={() => setShowRelativeDate(!showRelativeDate)}
              className={cn(
                "text-xs px-2 py-0.5 rounded-full shrink-0",
                overdue ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                urgent ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" :
                "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
              )}
            >
              <Clock className="h-3 w-3 inline mr-1" />
              {showRelativeDate ? formatRelativeDate(task.dueDate) : new Date(task.dueDate).toLocaleDateString()}
            </button>
          )}

          {/* Notes Indicator */}
          {task.details && !expanded && (
            <FileText className="h-3 w-3 text-[hsl(var(--muted-foreground))] shrink-0" />
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(true); setEditText(task.text); }}>
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => onDelete(task.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t border-[hsl(var(--border))] pt-3 ml-7">
            {/* Metadata */}
            <div className="flex gap-4 text-xs text-[hsl(var(--muted-foreground))]">
              <span>Created: {new Date(task.createdAt).toLocaleString()}</span>
              <span>Updated: {new Date(task.updatedAt).toLocaleString()}</span>
            </div>

            {/* Due Date Editor */}
            <div className="space-y-2">
              <label className="text-xs font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Due Date
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="datetime-local"
                  className="h-8 text-xs w-auto"
                  value={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ""}
                  onChange={(e) => handleSetDueDate(e.target.value ? new Date(e.target.value).toISOString() : "")}
                />
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleQuickDue(1)}>1h</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleQuickDue(4)}>4h</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleQuickDue(24)}>1d</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleQuickDue(168)}>1w</Button>
                </div>
                {task.dueDate && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500" onClick={() => handleSetDueDate("")}>
                    Remove
                  </Button>
                )}
              </div>
            </div>

            {/* Details Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Details (Markdown)</label>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowPreview(!showPreview)}>
                  {showPreview ? "Edit" : "Preview"}
                </Button>
              </div>
              {showPreview ? (
                <div className="prose prose-sm dark:prose-invert max-w-none p-3 rounded-[var(--radius)] bg-[hsl(var(--muted))] min-h-[80px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{details || "*No details*"}</ReactMarkdown>
                </div>
              ) : (
                <Textarea
                  value={details}
                  onChange={(e) => handleDetailsChange(e.target.value)}
                  placeholder="Add task details (supports Markdown)..."
                  className="min-h-[100px] text-sm font-mono"
                />
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
