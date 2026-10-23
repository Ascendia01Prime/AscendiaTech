import type { ReactNode } from "react";
import { GraduationCap } from "lucide-react";

export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-accent-fg">
            <GraduationCap className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-muted">{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
