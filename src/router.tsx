import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { attachQueryPersistence, PERSIST_KEYS } from "./lib/persist";

export const getRouter = () => {
  const queryClient = new QueryClient();

  // Persist wallet + escrow slices to localStorage so refreshing the page
  // or opening a second tab reflects the latest state (single source of
  // truth is the persisted store, cache is a live view).
  attachQueryPersistence(queryClient, [
    PERSIST_KEYS.walletBalance,
    PERSIST_KEYS.walletTx,
    PERSIST_KEYS.escrows,
  ]);

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};

