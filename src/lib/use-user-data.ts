"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { stripUndefined } from "@/lib/helpers";
import { UserData, defaultUserData } from "@/lib/types";
import { User } from "firebase/auth";

export type SyncStatus = "idle" | "saving" | "synced" | "error";

export function useUserData(user: User | null) {
  const [data, setData] = useState<UserData>(defaultUserData);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [loaded, setLoaded] = useState(false);
  const lastSavedJsonRef = useRef<string>("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef(false);

  // Load data from Firestore
  useEffect(() => {
    if (!user) {
      setData(defaultUserData);
      setLoaded(false);
      return;
    }

    const loadData = async () => {
      try {
        const docRef = doc(getFirebaseDb(), "userData", user.uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const raw = snapshot.data();
          const loadedData: UserData = {
            ...defaultUserData,
            ...raw,
            taskGroups: Array.isArray(raw.taskGroups) ? raw.taskGroups : [],
            preferences: { ...defaultUserData.preferences, ...(raw.preferences || {}) },
          };
          setData(loadedData);
          lastSavedJsonRef.current = JSON.stringify(loadedData);
        } else {
          const initial = { ...defaultUserData, updatedAt: new Date().toISOString() };
          setData(initial);
          lastSavedJsonRef.current = JSON.stringify(initial);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      }
      setLoaded(true);
    };

    loadData();
  }, [user]);

  // Save function
  const saveToFirestore = useCallback(async (dataToSave: UserData) => {
    if (!user) return;
    const json = JSON.stringify(dataToSave);
    if (json === lastSavedJsonRef.current) return;

    setSyncStatus("saving");
    try {
      const docRef = doc(getFirebaseDb(), "userData", user.uid);
      await setDoc(docRef, stripUndefined(dataToSave));
      lastSavedJsonRef.current = json;
      setSyncStatus("synced");
      setTimeout(() => setSyncStatus("idle"), 3000);
    } catch (err) {
      console.error("Save failed:", err);
      setSyncStatus("error");
    }
    pendingSaveRef.current = false;
  }, [user]);

  // Debounced save on data change
  useEffect(() => {
    if (!loaded || !user) return;

    const currentJson = JSON.stringify(data);
    if (currentJson === lastSavedJsonRef.current) return;

    pendingSaveRef.current = true;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveToFirestore(data);
    }, 1000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, loaded, user, saveToFirestore]);

  // Flush pending save on tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingSaveRef.current && user) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        // Sync save on unload
        const json = JSON.stringify(data);
        if (json !== lastSavedJsonRef.current) {
          const docRef = doc(getFirebaseDb(), "userData", user.uid);
          // Fallback: just try setDoc (may not complete on unload)
          setDoc(docRef, stripUndefined(data)).catch(() => {});
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [data, user]);

  return { data, setData, syncStatus, loaded };
}
