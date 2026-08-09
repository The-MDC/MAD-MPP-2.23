"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  message: string;
  title?: string;
  type: "success" | "info" | "warning" | "error";
}

export interface ProjectGoal {
  id: string;
  title: string;
  description: string;
  category: "feature" | "chore" | "documentation" | "bugfix";
  status: "pending" | "completed";
  createdAt: string;
}

export interface WorkspaceContextType {
  userName: string;
  theme: "light" | "dark";
  projectGoals: ProjectGoal[];
  apiUsageCount: number;
  setUserName: (name: string) => void;
  setTheme: (theme: "light" | "dark") => void;
  addGoal: (title: string, description: string, category: ProjectGoal["category"]) => void;
  toggleGoal: (id: string) => void;
  deleteGoal: (id: string) => void;
  incrementUsage: () => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage["type"], title?: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const DEFAULT_GOALS: ProjectGoal[] = [
  {
    id: "g1",
    title: "Configure secure server-side Gemini client",
    description: "Initialize GoogleGenAI in Next.js Server Components or API routes to hide secrets.",
    category: "feature",
    status: "completed",
    createdAt: new Date().toISOString(),
  },
  {
    id: "g2",
    title: "Implement global React Context",
    description: "Handle application-wide configuration and logs via custom hooks.",
    category: "feature",
    status: "completed",
    createdAt: new Date().toISOString(),
  },
  {
    id: "g3",
    title: "Integrate Shadcn UI elements",
    description: "Install cards, inputs, buttons, and custom layout nodes to construct the workspace.",
    category: "documentation",
    status: "completed",
    createdAt: new Date().toISOString(),
  },
  {
    id: "g4",
    title: "Integrate interactive AI helper widget",
    description: "Query Gemini model to brainstorm roadmap item descriptions or debug code segments.",
    category: "feature",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [userName, setUserNameState] = useState<string>("Developer");
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [projectGoals, setProjectGoalsState] = useState<ProjectGoal[]>(DEFAULT_GOALS);
  const [apiUsageCount, setApiUsageCountState] = useState<number>(0);

  // Safely hydrate from localStorage on the client after mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("ws_username");
      const savedTheme = localStorage.getItem("ws_theme") as "light" | "dark" | null;
      let storedGoalsParsed: ProjectGoal[] | null = null;
      try {
        const storedGoals = localStorage.getItem("ws_goals");
        if (storedGoals) storedGoalsParsed = JSON.parse(storedGoals);
      } catch (e) {
        console.warn("Failed to parse stored goals", e);
      }
      const storedUsage = localStorage.getItem("ws_usage_count");
      const parsedUsage = storedUsage ? parseInt(storedUsage, 10) : null;

      // Defer calls to avoid synchronous cascading render warning
      setTimeout(() => {
        if (savedUser) setUserNameState(savedUser);
        if (savedTheme) setThemeState(savedTheme);
        if (storedGoalsParsed) setProjectGoalsState(storedGoalsParsed);
        if (parsedUsage !== null) setApiUsageCountState(parsedUsage);
      }, 0);
    }
  }, []);

  // Handle document level side-effects of theme changes and hydrate flags
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const setUserName = (name: string) => {
    setUserNameState(name);
    if (typeof window !== "undefined") {
      localStorage.setItem("ws_username", name);
    }
  };

  const setTheme = (newTheme: "light" | "dark") => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("ws_theme", newTheme);
    }
  };

  const addGoal = (title: string, description: string, category: ProjectGoal["category"]) => {
    const newGoal: ProjectGoal = {
      id: "g_" + Date.now(),
      title,
      description,
      category,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setProjectGoalsState((prev) => {
      const updated = [newGoal, ...prev];
      if (typeof window !== "undefined") {
        localStorage.setItem("ws_goals", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const toggleGoal = (id: string) => {
    setProjectGoalsState((prev) => {
      const updated = prev.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              status: (goal.status === "completed" ? "pending" : "completed") as "pending" | "completed",
            }
          : goal
      );
      if (typeof window !== "undefined") {
        localStorage.setItem("ws_goals", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const deleteGoal = (id: string) => {
    setProjectGoalsState((prev) => {
      const updated = prev.filter((goal) => goal.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("ws_goals", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastMessage["type"] = "info", title?: string) => {
    const id = "toast_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const incrementUsage = () => {
    setApiUsageCountState((prev) => {
      const updated = prev + 1;
      if (typeof window !== "undefined") {
        localStorage.setItem("ws_usage_count", updated.toString());
      }
      return updated;
    });
  };

  return (
    <WorkspaceContext.Provider
      value={{
        userName,
        theme,
        projectGoals,
        apiUsageCount,
        setUserName,
        setTheme,
        addGoal,
        toggleGoal,
        deleteGoal,
        incrementUsage,
        toasts,
        showToast,
      }}
    >
      <div className="relative min-h-screen">
        {children}

        {/* CSS definitions for Toast Portal */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes toastShrink {
            from { width: 100%; }
            to { width: 0%; }
          }
          @keyframes toastSlideIn {
            from { opacity: 0; transform: translateY(1.25rem) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}} />

        {/* Dynamic Toast Portal Dock */}
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
          {toasts.map((t) => {
            let icon = <Info className="w-5 h-5 text-indigo-400" />;
            let borderColor = "border-[#1e2f4a]";
            let bgColor = "bg-[#0c121e]/95";
            let titleColor = "text-indigo-300";

            if (t.type === "success") {
              icon = <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
              borderColor = "border-emerald-500/30";
              bgColor = "bg-[#0a1b15]/95";
              titleColor = "text-emerald-300";
            } else if (t.type === "warning") {
              icon = <AlertTriangle className="w-5 h-5 text-amber-400" />;
              borderColor = "border-amber-500/30";
              bgColor = "bg-[#1c160a]/95";
              titleColor = "text-amber-300";
            } else if (t.type === "error") {
              icon = <AlertCircle className="w-5 h-5 text-rose-400" />;
              borderColor = "border-rose-500/30";
              bgColor = "bg-[#1f0e13]/95";
              titleColor = "text-rose-300";
            }

            return (
              <div
                key={t.id}
                style={{
                  animation: "toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                }}
                className={`pointer-events-auto flex gap-3 p-4 rounded-xl border ${borderColor} ${bgColor} shadow-2xl backdrop-blur-md overflow-hidden relative`}
              >
                <div className="flex-shrink-0 mt-0.5">{icon}</div>
                <div className="flex-1 space-y-0.5">
                  {t.title && (
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${titleColor}`}>
                      {t.title}
                    </h4>
                  )}
                  <p className="text-xs text-neutral-200 font-sans leading-relaxed">
                    {t.message}
                  </p>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="flex-shrink-0 h-5 w-5 rounded hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {/* Progress completion visual indicator bar */}
                <div
                  style={{
                    animation: "toastShrink 4s linear forwards"
                  }}
                  className={`absolute bottom-0 left-0 h-0.5 ${
                    t.type === "success"
                      ? "bg-emerald-500"
                      : t.type === "warning"
                      ? "bg-amber-500"
                      : t.type === "error"
                      ? "bg-rose-500"
                      : "bg-indigo-500"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
