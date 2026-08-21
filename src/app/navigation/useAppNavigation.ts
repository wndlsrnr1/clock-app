import { useState } from "react";

export type AppPage = "clock" | "calendar" | "data" | "theme";

export interface AppNavigation {
  page: AppPage;
  show(page: AppPage): void;
}

export function useAppNavigation(): AppNavigation {
  const [page, setPage] = useState<AppPage>("clock");

  return {
    page,
    show: (nextPage: AppPage): void => setPage(nextPage),
  };
}
