"use client";

import React, { useState, useRef, useCallback } from "react";
import { TaskGroup } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  Plus, PanelLeftClose, PanelLeftOpen, MoreHorizontal,
  Pin, PinOff, Edit3, Archive, ArchiveRestore, Trash2,
  GripVertical, X, ChevronDown, FolderArchive
} from "lucide-react";

interface SidebarProps {
  groups: TaskGroup[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onPin: (id: string) => void;
  onReorder: (groups: TaskGroup[]) => void;
  width: number;
  collapsed: boolean;
  onWidthChange: (w: number) => void;
  onCollapsedChange: (c: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  groups, activeId, onSelect, onAdd, onRename, onDelete, onArchive, onUnarchive, onPin, onReorder,
  width, collapsed, onWidthChange, onCollapsedChange, mobileOpen, onMobileClose,
}: SidebarProps) {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const resizing = useRef(false);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const activeGroups = groups.filter((g) => !g.archived);
  const archivedGroups = groups.filter((g) => g.archived);

  // Sort: pinned first
  const sortedActive = [...activeGroups].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = true;
    const startX = e.clientX;
    const startWidth = width;
    const onMouseMove = (e: MouseEvent) => {
      if (!resizing.current) return;
      const newWidth = Math.min(480, Math.max(200, startWidth + e.clientX - startX));
      onWidthChange(newWidth);
    };
    const onMouseUp = () => {
      resizing.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [width, onWidthChange]);

  const handleDragStart = (idx: number) => {
    dragItem.current = idx;
  };

  const handleDragEnter = (idx: number) => {
    dragOver.current = idx;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOver.current !== null && dragItem.current !== dragOver.current) {
      const items = [...sortedActive];
      const [removed] = items.splice(dragItem.current, 1);
      items.splice(dragOver.current, 0, removed);
      onReorder([...items, ...archivedGroups]);
    }
    dragItem.current = null;
    dragOver.current = null;
  };

  const handleAddAgenda = () => {
    if (newName.trim()) {
      onAdd(newName.trim());
      setNewName("");
      setShowNewDialog(false);
    }
  };

  const handleRename = () => {
    if (renameId && renameName.trim()) {
      onRename(renameId, renameName.trim());
      setRenameId(null);
      setRenameName("");
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[hsl(var(--border))]">
        {!collapsed && <h2 className="font-bold text-sm">Agendas</h2>}
        <div className="flex items-center gap-1">
          {/* Desktop: collapse toggle, Mobile: close */}
          <Button variant="ghost" size="icon" className="h-8 w-8 hidden md:flex" onClick={() => onCollapsedChange(!collapsed)}>
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={onMobileClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* New Agenda Button */}
      {!collapsed && (
        <div className="p-3">
          <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4" /> New Agenda
          </Button>
        </div>
      )}
      {collapsed && (
        <div className="p-2 flex justify-center">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Active Groups */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedActive.map((group, idx) => {
            const doneCount = group.tasks.filter((t) => t.completed).length;
            const totalCount = group.tasks.length;
            const isActive = group.id === activeId;

            return (
              <div
                key={group.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragEnter={() => handleDragEnter(idx)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={cn(
                  "flex items-center gap-2 px-2 py-2 rounded-[var(--radius)] cursor-pointer transition-colors group",
                  isActive
                    ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] border border-[hsl(var(--primary))]/20"
                    : "hover:bg-[hsl(var(--accent))]"
                )}
                onClick={() => onSelect(group.id)}
              >
                {!collapsed && (
                  <GripVertical className="h-3 w-3 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 hidden md:block cursor-grab shrink-0" />
                )}
                <div className={cn(
                  "h-7 w-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0",
                  isActive
                    ? "bg-[hsl(var(--primary))] text-white"
                    : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                )}>
                  {group.name.charAt(0).toUpperCase()}
                </div>
                {!collapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{group.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{doneCount}/{totalCount}</p>
                    </div>
                    {group.pinned && <Pin className="h-3 w-3 text-[hsl(var(--primary))] shrink-0" />}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin(group.id); }}>
                          {group.pinned ? <><PinOff className="h-4 w-4 mr-2" /> Unpin</> : <><Pin className="h-4 w-4 mr-2" /> Pin</>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRenameId(group.id); setRenameName(group.name); }}>
                          <Edit3 className="h-4 w-4 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(group.id); }}>
                          <Archive className="h-4 w-4 mr-2" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(group.id); }} className="text-red-600 dark:text-red-400">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Archived Section */}
        {archivedGroups.length > 0 && !collapsed && (
          <Collapsible open={archiveOpen} onOpenChange={setArchiveOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 w-full px-4 py-2 text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]">
                <FolderArchive className="h-3 w-3" />
                Archived
                <span className="ml-auto bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded-full text-[10px]">{archivedGroups.length}</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform", archiveOpen && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-2 space-y-1">
                {archivedGroups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center gap-2 px-2 py-2 rounded-[var(--radius)] cursor-pointer hover:bg-[hsl(var(--accent))] group opacity-60"
                    onClick={() => onSelect(group.id)}
                  >
                    <div className="h-7 w-7 rounded-md flex items-center justify-center text-xs font-bold bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm truncate flex-1">{group.name}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onUnarchive(group.id); }}>
                          <ArchiveRestore className="h-4 w-4 mr-2" /> Unarchive
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(group.id); }} className="text-red-600 dark:text-red-400">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </ScrollArea>

      {/* New Agenda Dialog */}
      <AlertDialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>New Agenda</AlertDialogTitle>
            <AlertDialogDescription>Enter a name for your new agenda.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input placeholder="Agenda name" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddAgenda()} autoFocus />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewName("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddAgenda} disabled={!newName.trim()}>Create</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <AlertDialog open={!!renameId} onOpenChange={(open) => { if (!open) setRenameId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Agenda</AlertDialogTitle>
            <AlertDialogDescription>Enter a new name.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input placeholder="New name" value={renameName} onChange={(e) => setRenameName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRename()} autoFocus />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRename} disabled={!renameName.trim()}>Rename</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={onMobileClose} />
      )}

      {/* Mobile Drawer */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-[280px] bg-[hsl(var(--background))] border-r border-[hsl(var(--border))] transform transition-transform duration-300 md:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebarContent}
      </div>

      {/* Desktop Sidebar */}
      <div
        className="hidden md:flex flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--background))] relative shrink-0"
        style={{ width: collapsed ? 52 : width }}
      >
        {sidebarContent}
        {/* Resize Handle */}
        {!collapsed && (
          <div
            className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-[hsl(var(--primary))]/30 transition-colors"
            onMouseDown={handleResizeStart}
          />
        )}
      </div>
    </>
  );
}
