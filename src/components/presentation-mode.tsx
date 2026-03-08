"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatRelativeDate, isOverdue } from "@/lib/helpers";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  X, List, LayoutGrid, ChevronLeft, ChevronRight,
  Pencil, Eraser, Trash2, Minus, Plus,
  ChevronsUpDown, Check, Clock
} from "lucide-react";

const ANIMATION_STYLES = ["stack", "flip", "slide", "fade", "zoom"] as const;
type AnimationStyle = (typeof ANIMATION_STYLES)[number];

const DRAW_COLORS = ["#ef4444", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ffffff", "#000000"];

interface PresentationModeProps {
  tasks: Task[];
  agendaName: string;
  onClose: () => void;
  onToggleComplete: (taskId: string) => void;
  initialMode?: "list" | "slideshow";
}

export function PresentationMode({ tasks, agendaName, onClose, onToggleComplete, initialMode = "slideshow" }: PresentationModeProps) {
  const [mode, setMode] = useState<"list" | "slideshow">(initialMode);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animStyle, setAnimStyle] = useState<AnimationStyle>("stack");
  const [animDir, setAnimDir] = useState<"left" | "right">("right");
  const [animKey, setAnimKey] = useState(0);

  // Drawing state
  const [drawing, setDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#ef4444");
  const [drawSize, setDrawSize] = useState(3);
  const [isErasing, setIsErasing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // List mode expand/collapse
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const doneCount = tasks.filter((t) => t.completed).length;

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }, []);

  // Resize canvas (handle high-DPI / retina displays)
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Clear canvas on slide/style change
  useEffect(() => {
    clearCanvas();
  }, [currentSlide, animStyle, mode, clearCanvas]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (mode !== "slideshow") return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        goNext();
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "Home") setCurrentSlide(0);
      if (e.key === "End") setCurrentSlide(tasks.length - 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, currentSlide, tasks.length]);

  const goNext = () => {
    if (currentSlide < tasks.length - 1) {
      setAnimDir("right");
      setAnimKey((k) => k + 1);
      setCurrentSlide((s) => s + 1);
    }
  };

  const goPrev = () => {
    if (currentSlide > 0) {
      setAnimDir("left");
      setAnimKey((k) => k + 1);
      setCurrentSlide((s) => s - 1);
    }
  };

  // Drawing
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    isDrawingRef.current = true;
    const pos = getPos(e);
    lastPosRef.current = pos;
  };

  const doDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = isErasing ? "rgba(0,0,0,1)" : drawColor;
    ctx.lineWidth = isErasing ? drawSize * 4 : drawSize;
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = isErasing ? "destination-out" : "source-over";
    ctx.stroke();
    lastPosRef.current = pos;
  };

  const stopDraw = () => {
    isDrawingRef.current = false;
  };

  const toggleExpandTask = (id: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedTasks(new Set(tasks.filter((t) => t.details).map((t) => t.id)));
  const collapseAll = () => setExpandedTasks(new Set());

  const animationClass = `animate-${animStyle}-enter-${animDir}`;
  const listAnimationClass = `animate-list-${animStyle}`;

  return (
    <div className="fixed inset-0 z-[100] bg-[hsl(var(--background))] flex flex-col">
      {/* Drawing Canvas */}
      <canvas
        ref={canvasRef}
        className={cn("absolute inset-0 z-[110]", drawing ? "cursor-crosshair" : "pointer-events-none")}
        onMouseDown={startDraw}
        onMouseMove={doDraw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={doDraw}
        onTouchEnd={stopDraw}
      />

      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-[120] flex items-center gap-1.5 md:gap-2 flex-wrap justify-end">
        <Button variant="outline" size="sm" onClick={() => setMode(mode === "list" ? "slideshow" : "list")}>
          {mode === "list" ? <LayoutGrid className="h-4 w-4 mr-1" /> : <List className="h-4 w-4 mr-1" />}
          {mode === "list" ? "Cards" : "List"}
        </Button>

        {/* Animation picker (desktop, slideshow only) */}
        {mode === "slideshow" && (
          <div className="hidden md:flex items-center gap-1">
            {ANIMATION_STYLES.map((s) => (
              <Button
                key={s}
                variant={animStyle === s ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs capitalize"
                onClick={() => setAnimStyle(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        )}

        <Button variant="outline" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Drawing Controls */}
      <div className="absolute top-4 left-4 z-[120] flex items-center gap-2 flex-wrap">
        <Button
          variant={drawing ? "default" : "outline"}
          size="icon"
          className="h-8 w-8"
          onClick={() => { setDrawing(!drawing); setIsErasing(false); }}
        >
          <Pencil className="h-4 w-4" />
        </Button>

        {drawing && (
          <div className="flex items-center gap-1.5 md:gap-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[var(--radius)] p-1.5 md:p-2 flex-wrap">
            {DRAW_COLORS.map((c) => (
              <button
                key={c}
                className={cn("h-5 w-5 rounded-full border-2 transition-transform", drawColor === c && !isErasing ? "border-white scale-125 ring-2 ring-[hsl(var(--primary))]" : "border-transparent")}
                style={{ backgroundColor: c }}
                onClick={() => { setDrawColor(c); setIsErasing(false); }}
              />
            ))}
            <div className="w-px h-5 bg-[hsl(var(--border))] mx-1" />
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDrawSize(Math.max(1, drawSize - 1))}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-xs w-4 text-center">{drawSize}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDrawSize(Math.min(20, drawSize + 1))}>
              <Plus className="h-3 w-3" />
            </Button>
            <div className="w-px h-5 bg-[hsl(var(--border))] mx-1" />
            <Button variant={isErasing ? "default" : "ghost"} size="icon" className="h-6 w-6" onClick={() => setIsErasing(!isErasing)}>
              <Eraser className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearCanvas}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-4 pt-16 md:px-8 md:py-8 md:pt-16 overflow-auto">
        {mode === "list" ? (
          /* List Mode */
          <div className={cn("w-full max-w-3xl", listAnimationClass)} key={`list-${animStyle}`}>
            <div className="bg-[hsl(var(--card))] rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-lg overflow-hidden">
              <div className="p-6 border-b border-[hsl(var(--border))] flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{agendaName}</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{doneCount}/{tasks.length} completed</p>
                </div>
                {tasks.some((t) => t.details) && (
                  <Button variant="outline" size="sm" onClick={expandedTasks.size > 0 ? collapseAll : expandAll}>
                    <ChevronsUpDown className="h-4 w-4 mr-1" />
                    {expandedTasks.size > 0 ? "Collapse All" : "Expand All"}
                  </Button>
                )}
              </div>
              <div className="divide-y divide-[hsl(var(--border))]">
                {tasks.map((task, idx) => (
                  <div key={task.id} className="p-4">
                    <div className="flex items-start gap-3 cursor-pointer" onClick={() => task.details && toggleExpandTask(task.id)}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id); }}
                        className={cn(
                          "h-7 w-7 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors",
                          task.completed
                            ? "bg-green-500 text-white"
                            : "bg-[hsl(var(--primary))] text-white"
                        )}
                      >
                        {task.completed ? <Check className="h-4 w-4" /> : idx + 1}
                      </button>
                      <div className="flex-1">
                        <p className={cn("font-medium", task.completed && "line-through opacity-50")}>{task.text}</p>
                        {expandedTasks.has(task.id) && task.details && (
                          <div className="mt-2 prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.details}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                      {task.details && (
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {expandedTasks.has(task.id) ? "▾" : "▸"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-[hsl(var(--border))] flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
                <span>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                <span>{doneCount === tasks.length ? "All done! 🎉" : `${doneCount}/${tasks.length} completed`}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Slideshow Mode */
          <div className="relative w-full max-w-3xl mx-auto" style={{ perspective: "1000px" }}>
            {/* Background cards */}
            {[2, 1].map((offset) => {
              const bgIdx = currentSlide + offset;
              if (bgIdx >= tasks.length) return null;
              return (
                <div
                  key={`bg-${bgIdx}`}
                  className="absolute inset-0 bg-[hsl(var(--card))] rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-md"
                  style={{
                    transform: `translateY(${offset * 8}px) scale(${1 - offset * 0.03})`,
                    opacity: 0.5,
                    zIndex: -offset,
                  }}
                >
                  <div className="p-6 opacity-50">
                    <p className="text-sm font-medium truncate">{tasks[bgIdx].text}</p>
                  </div>
                </div>
              );
            })}

            {/* Current Card */}
            {tasks[currentSlide] && (
              <div
                key={`slide-${animKey}`}
                className={cn(
                  "bg-[hsl(var(--card))] rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-xl min-h-[300px] md:min-h-[400px] flex flex-col",
                  animationClass
                )}
              >
                <div className="p-4 md:p-8 flex-1">
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      onClick={() => onToggleComplete(tasks[currentSlide].id)}
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0",
                        tasks[currentSlide].completed
                          ? "bg-green-500 text-white"
                          : "bg-[hsl(var(--primary))] text-white"
                      )}
                    >
                      {tasks[currentSlide].completed ? <Check className="h-5 w-5" /> : currentSlide + 1}
                    </button>
                    <h2 className={cn("text-2xl font-bold", tasks[currentSlide].completed && "line-through opacity-50")}>
                      {tasks[currentSlide].text}
                    </h2>
                  </div>

                  {tasks[currentSlide].dueDate && (
                    <div className={cn(
                      "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm mb-4",
                      isOverdue(tasks[currentSlide].dueDate) ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                    )}>
                      <Clock className="h-3 w-3" />
                      {formatRelativeDate(tasks[currentSlide].dueDate!)}
                    </div>
                  )}

                  {tasks[currentSlide].details && (
                    <div className="prose prose-lg dark:prose-invert max-w-none mt-4">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{tasks[currentSlide].details}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Footer with dots */}
                <div className="p-4 border-t border-[hsl(var(--border))] flex items-center justify-center gap-1.5">
                  {tasks.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setAnimDir(idx > currentSlide ? "right" : "left"); setAnimKey((k) => k + 1); setCurrentSlide(idx); }}
                      className={cn(
                        "h-2 w-2 rounded-full transition-all",
                        idx === currentSlide ? "bg-[hsl(var(--primary))] w-6" : "bg-[hsl(var(--muted-foreground))]/30 hover:bg-[hsl(var(--muted-foreground))]/50"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Arrows - desktop: outside card, mobile: overlaid inside */}
            <Button
              variant="outline"
              size="icon"
              className="absolute md:left-[-60px] left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full z-10"
              onClick={goPrev}
              disabled={currentSlide === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute md:right-[-60px] right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full z-10"
              onClick={goNext}
              disabled={currentSlide === tasks.length - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[120] text-xs text-[hsl(var(--muted-foreground))]">
        {mode === "slideshow" ? "← → navigate • Space next • ESC exit" : "ESC to exit"}
      </div>
    </div>
  );
}
