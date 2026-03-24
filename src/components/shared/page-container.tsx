import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

export function PageContainer({
  children,
  className = "",
}: PageContainerProps) {
  return (
    <main
      className={`flex min-h-screen w-full bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8 ${className}`.trim()}
    >
      {children}
    </main>
  );
}
