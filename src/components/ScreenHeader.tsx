import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { ReactNode } from "react";

export function ScreenHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  right?: ReactNode;
}) {
  return (
    <header className="px-5 pt-10 pb-4 bg-surface sticky top-0 z-10 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {back && (
            <Link
              to={back}
              className="size-8 -mr-2 grid place-items-center text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="size-5" />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground text-xs truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {right}
      </div>
    </header>
  );
}
