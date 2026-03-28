"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type WorkspaceShellProps = {
  children: ReactNode;
};

type WorkspaceSidebarSlotContextValue = {
  sidebarContainer: HTMLDivElement | null;
  isSidebarAvailable: boolean;
  setSidebarState: (value: "hidden" | "collapsed" | "expanded") => void;
};

const WorkspaceSidebarSlotContext =
  createContext<WorkspaceSidebarSlotContextValue | null>(null);

const NAV_ITEMS = [
  {
    href: "/",
    label: "首页",
    description: "产品说明与入口",
    match: (pathname: string) => pathname === "/",
  },
  {
    href: "/resume",
    label: "简历",
    description: "输入简历与 JD",
    match: (pathname: string) => pathname === "/resume",
  },
  {
    href: "/analysis",
    label: "分析",
    description: "分析、匹配、聊天、开始面试",
    match: (pathname: string) => pathname === "/analysis" || pathname === "/setup",
  },
  {
    href: "/history",
    label: "历史",
    description: "查看本地记录",
    match: (pathname: string) => pathname === "/history" || pathname.startsWith("/history/"),
  },
] as const;

const WORKFLOW_STEPS = [
  {
    label: "Resume",
    match: (pathname: string) => pathname === "/resume",
  },
  {
    label: "Analysis",
    match: (pathname: string) => pathname === "/analysis" || pathname === "/setup",
  },
  {
    label: "Interview",
    match: (pathname: string) => pathname === "/interview",
  },
  {
    label: "Report",
    match: (pathname: string) => pathname === "/report",
  },
] as const;

function isWorkspacePath(pathname: string) {
  return pathname !== "/";
}

export function useWorkspaceSidebarSlot() {
  return useContext(WorkspaceSidebarSlotContext);
}

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  const pathname = usePathname() ?? "/";
  const currentStep =
    WORKFLOW_STEPS.find((step) => step.match(pathname))?.label ?? "Workspace";
  const isAnalysisPath = pathname === "/analysis";
  const [sidebarState, setSidebarState] = useState<"hidden" | "collapsed" | "expanded">(
    "hidden",
  );
  const [sidebarContainer, setSidebarContainer] = useState<HTMLDivElement | null>(null);

  const sidebarContextValue = useMemo(
    () => ({
      sidebarContainer,
      isSidebarAvailable: isAnalysisPath,
      setSidebarState,
    }),
    [isAnalysisPath, sidebarContainer],
  );
  const shouldRenderSidebar = isAnalysisPath && sidebarState !== "hidden";
  const desktopSidebarColumns =
    sidebarState === "expanded"
      ? "xl:grid-cols-[280px_minmax(0,1fr)_minmax(320px,380px)]"
      : sidebarState === "collapsed"
        ? "xl:grid-cols-[280px_minmax(0,1fr)_104px]"
        : "";
  const shellClassName = [
    "min-h-screen bg-zinc-100/80 lg:grid lg:h-screen lg:overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)]",
    desktopSidebarColumns,
  ]
    .filter(Boolean)
    .join(" ");

  if (!isWorkspacePath(pathname)) {
    return <>{children}</>;
  }

  return (
    <WorkspaceSidebarSlotContext.Provider value={sidebarContextValue}>
      <div className={shellClassName}>
        <aside className="hidden border-r border-zinc-200 bg-white lg:flex lg:h-screen lg:min-h-0 lg:flex-col lg:overflow-hidden">
          <div className="border-b border-zinc-100 px-6 py-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
              Workspace
            </p>
            <h2 className="mt-3 text-xl font-semibold text-zinc-900">
              Frontend Interview Copilot
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              当前工作区围绕 Resume、Analysis、Interview、Report 四步主链路组织。
            </p>
          </div>

          <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
            {NAV_ITEMS.map((item) => {
              const isActive = item.match(pathname);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-2xl border px-4 py-3 transition-colors ${
                    isActive
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <p className="text-sm font-medium">{item.label}</p>
                  <p
                    className={`mt-1 text-xs leading-5 ${
                      isActive ? "text-zinc-300" : "text-zinc-500"
                    }`}
                  >
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-zinc-100 px-6 py-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
              Current Step
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {WORKFLOW_STEPS.map((step) => {
                const isActive = step.label === currentStep;

                return (
                  <span
                    key={step.label}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isActive
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {step.label}
                  </span>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="min-w-0 lg:flex lg:h-screen lg:min-h-0 lg:flex-col lg:overflow-hidden">
          <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                  Workspace
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-900">{currentStep}</p>
              </div>
              <nav className="flex items-center gap-2 overflow-x-auto">
                {NAV_ITEMS.map((item) => {
                  const isActive = item.match(pathname);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium ${
                        isActive
                          ? "bg-zinc-900 text-white"
                          : "border border-zinc-200 bg-white text-zinc-600"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </header>

          <div className="min-w-0 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {children}
          </div>
        </div>

        {shouldRenderSidebar ? (
          <aside className="hidden border-l border-zinc-200 bg-white xl:flex xl:h-screen xl:min-h-0 xl:flex-col xl:overflow-hidden">
            <div
              className={`min-h-0 flex-1 ${
                sidebarState === "collapsed" ? "px-3 py-6" : "p-6"
              }`}
            >
              <div ref={setSidebarContainer} className="h-full min-h-0" />
            </div>
          </aside>
        ) : null}
      </div>
    </WorkspaceSidebarSlotContext.Provider>
  );
}
