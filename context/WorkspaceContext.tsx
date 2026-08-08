import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { loadAppStore, saveAppStore } from "../services/storage";
import {
  AppStore,
  Brand,
  CreateWorkspaceInput,
  Creator,
  DraftSession,
  Product,
  ScriptRecord,
  ScriptStatus,
  Workspace,
  buildWorkspace,
  createId,
  emptyAppStore,
  nowIso,
} from "../types/workspace";

type WorkspaceContextValue = {
  ready: boolean;
  hasWorkspace: boolean;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  activeWorkspaceId: string | null;
  createWorkspace: (input: CreateWorkspaceInput) => Promise<Workspace>;
  switchWorkspace: (id: string) => Promise<void>;
  renameWorkspace: (id: string, name: string) => Promise<void>;
  deleteWorkspace: (
    id: string
  ) => Promise<{ ok: true } | { ok: false; reason: "last" }>;
  brand: Brand | null;
  products: Product[];
  creators: Creator[];
  scripts: ScriptRecord[];
  draft: DraftSession | null;
  hasBrand: boolean;
  upsertBrand: (brand: Brand) => Promise<void>;
  upsertProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  upsertCreator: (creator: Creator) => Promise<void>;
  deleteCreator: (id: string) => Promise<void>;
  saveScript: (
    input: Omit<ScriptRecord, "id" | "createdAt" | "updatedAt" | "syncStatus"> & {
      id?: string;
    }
  ) => Promise<ScriptRecord>;
  updateScript: (
    id: string,
    patch: Partial<Pick<ScriptRecord, "favorite" | "status" | "title">>
  ) => Promise<void>;
  deleteScript: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  setScriptStatus: (id: string, status: ScriptStatus) => Promise<void>;
  getScript: (id: string) => ScriptRecord | undefined;
  saveDraft: (draft: Omit<DraftSession, "updatedAt">) => Promise<void>;
  clearDraft: () => Promise<void>;
  recentScripts: ScriptRecord[];
  favoriteScripts: ScriptRecord[];
  toShootScripts: ScriptRecord[];
  unpublishedScripts: ScriptRecord[];
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function patchActive(
  store: AppStore,
  updater: (ws: Workspace) => Workspace
): AppStore {
  const id = store.activeWorkspaceId;
  if (!id) return store;
  return {
    ...store,
    workspaces: store.workspaces.map((ws) =>
      ws.id === id
        ? { ...updater(ws), updatedAt: nowIso(), syncStatus: "local" as const }
        : ws
    ),
  };
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [store, setStore] = useState<AppStore>(emptyAppStore());

  useEffect(() => {
    let alive = true;

    (async () => {
      const loaded = await loadAppStore();
      if (!alive) return;
      setStore(loaded);
      setReady(true);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const commit = useCallback(async (updater: (prev: AppStore) => AppStore) => {
    let nextStore: AppStore = emptyAppStore();
    setStore((prev) => {
      nextStore = updater(prev);
      return nextStore;
    });
    await saveAppStore(nextStore);
    return nextStore;
  }, []);

  const activeWorkspace = useMemo(() => {
    if (!store.activeWorkspaceId) return null;
    return (
      store.workspaces.find((w) => w.id === store.activeWorkspaceId) ?? null
    );
  }, [store.activeWorkspaceId, store.workspaces]);

  const createWorkspace = useCallback(
    async (input: CreateWorkspaceInput) => {
      const workspace = buildWorkspace(input);
      await commit((prev) => ({
        ...prev,
        workspaces: [workspace, ...prev.workspaces],
        activeWorkspaceId: workspace.id,
      }));
      return workspace;
    },
    [commit]
  );

  const switchWorkspace = useCallback(
    async (id: string) => {
      await commit((prev) => {
        if (!prev.workspaces.some((w) => w.id === id)) return prev;
        return { ...prev, activeWorkspaceId: id };
      });
    },
    [commit]
  );

  const renameWorkspace = useCallback(
    async (id: string, name: string) => {
      const nextName = name.trim();
      if (!nextName) return;

      await commit((prev) => ({
        ...prev,
        workspaces: prev.workspaces.map((ws) => {
          if (ws.id !== id) return ws;
          const brand = ws.brand
            ? {
                ...ws.brand,
                company: nextName,
                updatedAt: nowIso(),
                syncStatus: "local" as const,
              }
            : ws.brand;
          return {
            ...ws,
            name: nextName,
            brand,
            updatedAt: nowIso(),
            syncStatus: "local" as const,
          };
        }),
      }));
    },
    [commit]
  );

  const deleteWorkspace = useCallback(
    async (id: string) => {
      let result: { ok: true } | { ok: false; reason: "last" } = {
        ok: true,
      };

      await commit((prev) => {
        if (prev.workspaces.length <= 1) {
          result = { ok: false, reason: "last" };
          return prev;
        }

        const remaining = prev.workspaces.filter((ws) => ws.id !== id);
        if (remaining.length === prev.workspaces.length) {
          return prev;
        }

        if (remaining.length === 0) {
          const fallback = buildWorkspace({
            name: "我的 Workspace",
            industry: "其他",
            brandIntro: "",
          });
          return {
            ...prev,
            workspaces: [fallback],
            activeWorkspaceId: fallback.id,
          };
        }

        const nextActiveId =
          prev.activeWorkspaceId === id
            ? remaining[0].id
            : prev.activeWorkspaceId &&
                remaining.some((w) => w.id === prev.activeWorkspaceId)
              ? prev.activeWorkspaceId
              : remaining[0].id;

        return {
          ...prev,
          workspaces: remaining,
          activeWorkspaceId: nextActiveId,
        };
      });

      return result;
    },
    [commit]
  );

  const upsertBrand = useCallback(
    async (brand: Brand) => {
      const nextBrand = {
        ...brand,
        updatedAt: nowIso(),
        syncStatus: "local" as const,
      };
      await commit((prev) =>
        patchActive(prev, (ws) => ({
          ...ws,
          brand: nextBrand,
          brandName: nextBrand.name || ws.brandName,
          brandIntro: nextBrand.intro || ws.brandIntro,
        }))
      );
    },
    [commit]
  );

  const upsertProduct = useCallback(
    async (product: Product) => {
      const stamped = {
        ...product,
        updatedAt: nowIso(),
        syncStatus: "local" as const,
      };
      await commit((prev) =>
        patchActive(prev, (ws) => {
          const exists = ws.products.some((p) => p.id === product.id);
          const products = exists
            ? ws.products.map((p) => (p.id === product.id ? stamped : p))
            : [stamped, ...ws.products];
          return { ...ws, products };
        })
      );
    },
    [commit]
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      await commit((prev) =>
        patchActive(prev, (ws) => ({
          ...ws,
          products: ws.products.filter((p) => p.id !== id),
        }))
      );
    },
    [commit]
  );

  const upsertCreator = useCallback(
    async (creator: Creator) => {
      const stamped = {
        ...creator,
        updatedAt: nowIso(),
        syncStatus: "local" as const,
      };
      await commit((prev) =>
        patchActive(prev, (ws) => {
          const exists = ws.creators.some((c) => c.id === creator.id);
          const creators = exists
            ? ws.creators.map((c) => (c.id === creator.id ? stamped : c))
            : [stamped, ...ws.creators];
          return { ...ws, creators };
        })
      );
    },
    [commit]
  );

  const deleteCreator = useCallback(
    async (id: string) => {
      await commit((prev) =>
        patchActive(prev, (ws) => ({
          ...ws,
          creators: ws.creators.filter((c) => c.id !== id),
        }))
      );
    },
    [commit]
  );

  const saveScript = useCallback(
    async (
      input: Omit<
        ScriptRecord,
        "id" | "createdAt" | "updatedAt" | "syncStatus"
      > & { id?: string }
    ) => {
      const t = nowIso();
      let saved!: ScriptRecord;

      await commit((prev) =>
        patchActive(prev, (ws) => {
          const existing = input.id
            ? ws.scripts.find((s) => s.id === input.id)
            : undefined;

          saved = {
            id: existing?.id ?? createId("script"),
            title: input.title,
            prompt: input.prompt,
            result: input.result,
            platform: input.platform,
            type: input.type,
            productId: input.productId,
            creatorIds: input.creatorIds ?? [],
            status: input.status,
            favorite: input.favorite,
            elapsedMs: input.elapsedMs,
            createdAt: existing?.createdAt ?? t,
            updatedAt: t,
            syncStatus: "local",
            ownerId: existing?.ownerId,
          };

          const scripts = existing
            ? ws.scripts.map((s) => (s.id === saved.id ? saved : s))
            : [saved, ...ws.scripts];

          return { ...ws, scripts };
        })
      );

      return saved;
    },
    [commit]
  );

  const updateScript = useCallback(
    async (
      id: string,
      patch: Partial<Pick<ScriptRecord, "favorite" | "status" | "title">>
    ) => {
      await commit((prev) =>
        patchActive(prev, (ws) => ({
          ...ws,
          scripts: ws.scripts.map((s) =>
            s.id === id
              ? {
                  ...s,
                  ...patch,
                  updatedAt: nowIso(),
                  syncStatus: "local" as const,
                }
              : s
          ),
        }))
      );
    },
    [commit]
  );

  const deleteScript = useCallback(
    async (id: string) => {
      await commit((prev) =>
        patchActive(prev, (ws) => ({
          ...ws,
          scripts: ws.scripts.filter((s) => s.id !== id),
        }))
      );
    },
    [commit]
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      await commit((prev) =>
        patchActive(prev, (ws) => ({
          ...ws,
          scripts: ws.scripts.map((s) =>
            s.id === id
              ? {
                  ...s,
                  favorite: !s.favorite,
                  updatedAt: nowIso(),
                  syncStatus: "local" as const,
                }
              : s
          ),
        }))
      );
    },
    [commit]
  );

  const setScriptStatus = useCallback(
    async (id: string, status: ScriptStatus) => {
      await updateScript(id, { status });
    },
    [updateScript]
  );

  const getScript = useCallback(
    (id: string) => activeWorkspace?.scripts.find((s) => s.id === id),
    [activeWorkspace]
  );

  const saveDraft = useCallback(
    async (draft: Omit<DraftSession, "updatedAt">) => {
      await commit((prev) =>
        patchActive(prev, (ws) => ({
          ...ws,
          draft: { ...draft, updatedAt: nowIso() },
        }))
      );
    },
    [commit]
  );

  const clearDraft = useCallback(async () => {
    await commit((prev) => patchActive(prev, (ws) => ({ ...ws, draft: null })));
  }, [commit]);

  const scripts = activeWorkspace?.scripts ?? [];

  const recentScripts = useMemo(
    () =>
      [...scripts]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
    [scripts]
  );

  const favoriteScripts = useMemo(
    () =>
      scripts
        .filter((s) => s.favorite)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [scripts]
  );

  const toShootScripts = useMemo(
    () =>
      scripts.filter(
        (s) => s.status === "ready" || s.status === "to_shoot"
      ),
    [scripts]
  );

  const unpublishedScripts = useMemo(
    () =>
      scripts.filter(
        (s) => s.status === "filmed" || s.status === "to_shoot" || s.status === "ready"
      ),
    [scripts]
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      ready,
      hasWorkspace: Boolean(activeWorkspace),
      workspaces: store.workspaces,
      activeWorkspace,
      activeWorkspaceId: store.activeWorkspaceId,
      createWorkspace,
      switchWorkspace,
      renameWorkspace,
      deleteWorkspace,
      brand: activeWorkspace?.brand ?? null,
      products: activeWorkspace?.products ?? [],
      creators: activeWorkspace?.creators ?? [],
      scripts,
      draft: activeWorkspace?.draft ?? null,
      hasBrand: Boolean(activeWorkspace?.brand?.name?.trim()),
      upsertBrand,
      upsertProduct,
      deleteProduct,
      upsertCreator,
      deleteCreator,
      saveScript,
      updateScript,
      deleteScript,
      toggleFavorite,
      setScriptStatus,
      getScript,
      saveDraft,
      clearDraft,
      recentScripts,
      favoriteScripts,
      toShootScripts,
      unpublishedScripts,
    }),
    [
      ready,
      store.workspaces,
      store.activeWorkspaceId,
      activeWorkspace,
      createWorkspace,
      switchWorkspace,
      renameWorkspace,
      deleteWorkspace,
      scripts,
      upsertBrand,
      upsertProduct,
      deleteProduct,
      upsertCreator,
      deleteCreator,
      saveScript,
      updateScript,
      deleteScript,
      toggleFavorite,
      setScriptStatus,
      getScript,
      saveDraft,
      clearDraft,
      recentScripts,
      favoriteScripts,
      toShootScripts,
      unpublishedScripts,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return ctx;
}
