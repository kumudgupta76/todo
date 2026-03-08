"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useUserData, SyncStatus } from "@/lib/use-user-data";
import { Task, TaskGroup, UserData, SortMode, SortDirection } from "@/lib/types";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { TaskCard } from "@/components/task-card";
import { JsonEditor } from "@/components/json-editor";
import { PresentationMode } from "@/components/presentation-mode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Plus, Menu, Braces, Play, ArrowUpDown, Sparkles, ListTodo,
  Cloud, CloudOff, Loader2, ArrowUp, ArrowDown
} from "lucide-react";

function SyncStatusIndicator({ status }: { status: SyncStatus }) {
  return (
    <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
      {status === "saving" && <><Loader2 className="h-3 w-3 animate-spin" /> Saving...</>}
      {status === "synced" && <><Cloud className="h-3 w-3 text-green-500" /> Synced</>}
      {status === "error" && <><CloudOff className="h-3 w-3 text-red-500" /> Sync failed</>}
      {status === "idle" && <Cloud className="h-3 w-3 opacity-30" />}
    </div>
  );
}

export function TaskBuddyApp() {
  const { user } = useAuth();
  const { data, setData, syncStatus, loaded } = useUserData(user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [jsonOpen, setJsonOpen] = useState(false);
  const [presentOpen, setPresentOpen] = useState(false);
  const dragItem = React.useRef<number | null>(null);
  const dragOver = React.useRef<number | null>(null);

  const taskGroups = data.taskGroups ?? [];

  const activeGroup = useMemo(() => {
    return taskGroups.find((g) => g.id === data.activeAgendaId) || null;
  }, [taskGroups, data.activeAgendaId]);

  const sortedTasks = useMemo(() => {
    if (!activeGroup) return [];
    const tasks = [...activeGroup.tasks];
    if (sortMode === "manual") return tasks;

    return tasks.sort((a, b) => {
      let cmp = 0;
      switch (sortMode) {
        case "dueDate": {
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          cmp = aDate - bDate;
          break;
        }
        case "createdAt":
          cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case "updatedAt":
          cmp = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [activeGroup, sortMode, sortDir]);

  const updateData = useCallback((updater: (prev: UserData) => UserData) => {
    setData((prev) => ({ ...updater(prev), updatedAt: new Date().toISOString() }));
  }, [setData]);

  // Agenda operations
  const handleAddAgenda = useCallback((name: string) => {
    const newGroup: TaskGroup = {
      id: crypto.randomUUID(),
      name,
      tasks: [],
      archived: false,
    };
    updateData((prev) => ({
      ...prev,
      taskGroups: [...prev.taskGroups, newGroup],
      activeAgendaId: newGroup.id,
    }));
  }, [updateData]);

  const handleSelectAgenda = useCallback((id: string) => {
    updateData((prev) => ({ ...prev, activeAgendaId: id }));
    setMobileMenuOpen(false);
  }, [updateData]);

  const handleRenameAgenda = useCallback((id: string, name: string) => {
    updateData((prev) => ({
      ...prev,
      taskGroups: prev.taskGroups.map((g) => g.id === id ? { ...g, name } : g),
    }));
  }, [updateData]);

  const handleDeleteAgenda = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      taskGroups: prev.taskGroups.filter((g) => g.id !== id),
      activeAgendaId: prev.activeAgendaId === id ? null : prev.activeAgendaId,
    }));
  }, [updateData]);

  const handleArchiveAgenda = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      taskGroups: prev.taskGroups.map((g) => g.id === id ? { ...g, archived: true } : g),
    }));
  }, [updateData]);

  const handleUnarchiveAgenda = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      taskGroups: prev.taskGroups.map((g) => g.id === id ? { ...g, archived: false } : g),
    }));
  }, [updateData]);

  const handlePinAgenda = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      taskGroups: prev.taskGroups.map((g) => g.id === id ? { ...g, pinned: !g.pinned } : g),
    }));
  }, [updateData]);

  const handleReorderAgendas = useCallback((groups: TaskGroup[]) => {
    updateData((prev) => ({ ...prev, taskGroups: groups }));
  }, [updateData]);

  // Task operations
  const updateActiveGroupTasks = useCallback((updater: (tasks: Task[]) => Task[]) => {
    if (!data.activeAgendaId) return;
    updateData((prev) => ({
      ...prev,
      taskGroups: prev.taskGroups.map((g) =>
        g.id === prev.activeAgendaId ? { ...g, tasks: updater(g.tasks) } : g
      ),
    }));
  }, [data.activeAgendaId, updateData]);

  const handleAddTask = useCallback(() => {
    if (!newTaskText.trim() || !data.activeAgendaId) return;
    const now = new Date().toISOString();
    const newTask: Task = {
      id: crypto.randomUUID(),
      text: newTaskText.trim(),
      details: "",
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    updateActiveGroupTasks((tasks) => [...tasks, newTask]);
    setNewTaskText("");
  }, [newTaskText, data.activeAgendaId, updateActiveGroupTasks]);

  const handleUpdateTask = useCallback((updatedTask: Task) => {
    updateActiveGroupTasks((tasks) =>
      tasks.map((t) => t.id === updatedTask.id ? updatedTask : t)
    );
  }, [updateActiveGroupTasks]);

  const handleDeleteTask = useCallback((id: string) => {
    updateActiveGroupTasks((tasks) => tasks.filter((t) => t.id !== id));
  }, [updateActiveGroupTasks]);

  const handleToggleComplete = useCallback((taskId: string) => {
    updateActiveGroupTasks((tasks) =>
      tasks.map((t) => t.id === taskId ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() } : t)
    );
  }, [updateActiveGroupTasks]);

  const handleJsonSave = useCallback((tasks: Task[]) => {
    updateActiveGroupTasks(() => tasks);
  }, [updateActiveGroupTasks]);

  // Task drag & drop
  const handleTaskDragStart = useCallback((idx: number) => { dragItem.current = idx; }, []);
  const handleTaskDragEnter = useCallback((idx: number) => { dragOver.current = idx; }, []);
  const handleTaskDragEnd = useCallback(() => {
    if (dragItem.current !== null && dragOver.current !== null && dragItem.current !== dragOver.current) {
      updateActiveGroupTasks((tasks) => {
        const items = [...tasks];
        const [removed] = items.splice(dragItem.current!, 1);
        items.splice(dragOver.current!, 0, removed);
        return items;
      });
    }
    dragItem.current = null;
    dragOver.current = null;
  }, [updateActiveGroupTasks]);

  const handleSortClick = useCallback((mode: SortMode) => {
    if (sortMode === mode) {
      setSortDir((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSortMode(mode);
      setSortDir("desc");
    }
  }, [sortMode]);

  // Sidebar preferences
  const handleWidthChange = useCallback((w: number) => {
    updateData((prev) => ({ ...prev, preferences: { ...prev.preferences, sidebarWidth: w } }));
  }, [updateData]);

  const handleCollapsedChange = useCallback((c: boolean) => {
    updateData((prev) => ({ ...prev, preferences: { ...prev.preferences, sidebarCollapsed: c } }));
  }, [updateData]);

  const handleToggleSound = useCallback(() => {
    updateData((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, soundEnabled: !prev.preferences.soundEnabled },
    }));
  }, [updateData]);

  const doneCount = activeGroup ? activeGroup.tasks.filter((t) => t.completed).length : 0;
  const totalCount = activeGroup ? activeGroup.tasks.length : 0;
  const progressPercent = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  if (!loaded) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header soundEnabled={data.preferences.soundEnabled ?? true} onToggleSound={handleToggleSound} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          groups={data.taskGroups}
          activeId={data.activeAgendaId}
          onSelect={handleSelectAgenda}
          onAdd={handleAddAgenda}
          onRename={handleRenameAgenda}
          onDelete={handleDeleteAgenda}
          onArchive={handleArchiveAgenda}
          onUnarchive={handleUnarchiveAgenda}
          onPin={handlePinAgenda}
          onReorder={handleReorderAgendas}
          width={data.preferences.sidebarWidth}
          collapsed={data.preferences.sidebarCollapsed}
          onWidthChange={handleWidthChange}
          onCollapsedChange={handleCollapsedChange}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeGroup ? (
            <>
              {/* Top Bar */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--border))]">
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setMobileMenuOpen(true)}>
                  <Menu className="h-4 w-4" />
                </Button>

                <h2 className="font-bold text-lg truncate">{activeGroup.name}</h2>

                <div className="hidden sm:flex items-center gap-2 ml-auto">
                  <Progress value={progressPercent} className="h-1.5 w-32 max-w-[200px]" />
                  <span className="text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap">{doneCount}/{totalCount}</span>
                </div>

                <div className={cn("flex items-center gap-1", !activeGroup && "hidden")}>
                  {/* Sort */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {(["manual", "dueDate", "createdAt", "updatedAt"] as SortMode[]).map((m) => (
                        <DropdownMenuItem
                          key={m}
                          onClick={() => handleSortClick(m)}
                          className={cn(sortMode === m && "text-[hsl(var(--primary))] font-medium")}
                        >
                          {m === "manual" ? "Manual" : m === "dueDate" ? "Due Date" : m === "createdAt" ? "Created" : "Updated"}
                          {sortMode === m && m !== "manual" && (
                            sortDir === "asc" ? <ArrowUp className="h-3 w-3 ml-auto" /> : <ArrowDown className="h-3 w-3 ml-auto" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* JSON */}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setJsonOpen(true)}>
                    <Braces className="h-4 w-4" />
                  </Button>

                  {/* Present */}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPresentOpen(true)} disabled={totalCount === 0}>
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Add Task */}
              <div className="flex items-center gap-2 px-4 py-3">
                <Input
                  placeholder="Add a new task..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  className="flex-1"
                />
                <Button onClick={handleAddTask} disabled={!newTaskText.trim()} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>

              {/* Task List */}
              <ScrollArea className="flex-1 px-4">
                <div className="space-y-2 pb-4">
                  {sortedTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-[hsl(var(--muted-foreground))]">
                      <Sparkles className="h-12 w-12 mb-3 opacity-30" />
                      <p className="text-lg font-medium">Ready to start?</p>
                      <p className="text-sm">Add your first task above</p>
                    </div>
                  ) : (
                    sortedTasks.map((task, idx) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onUpdate={handleUpdateTask}
                        onDelete={handleDeleteTask}
                        onDragStart={() => handleTaskDragStart(idx)}
                        onDragEnter={() => handleTaskDragEnter(idx)}
                        onDragEnd={handleTaskDragEnd}
                        soundEnabled={data.preferences.soundEnabled ?? true}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))]">
                <span>
                  {totalCount === 0 ? "No tasks" : doneCount === totalCount ? "All done! 🎉" : `${doneCount}/${totalCount} completed`}
                </span>
                <SyncStatusIndicator status={syncStatus} />
              </div>
            </>
          ) : (
            /* No Agenda Selected */
            <div className="flex-1 flex flex-col items-center justify-center text-[hsl(var(--muted-foreground))]">
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 absolute top-16 left-4" onClick={() => setMobileMenuOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>
              <ListTodo className="h-16 w-16 mb-4 opacity-20" />
              <h2 className="text-xl font-bold mb-2">Welcome to Task Buddy</h2>
              <p className="text-sm">Create or select an agenda to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* JSON Editor */}
      <JsonEditor
        open={jsonOpen}
        onOpenChange={setJsonOpen}
        tasks={activeGroup?.tasks || []}
        onSave={handleJsonSave}
      />

      {/* Presentation Mode */}
      {presentOpen && activeGroup && (
        <PresentationMode
          tasks={activeGroup.tasks}
          agendaName={activeGroup.name}
          onClose={() => setPresentOpen(false)}
          onToggleComplete={handleToggleComplete}
        />
      )}
    </div>
  );
}
