import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  APP_STORAGE_KEY,
  APP_VERSION,
  AppStore,
  LEGACY_V3_STORAGE_KEY,
  LegacyWorkspaceState,
  emptyAppStore,
  migrateLegacyV3,
} from "../types/workspace";

/** Local-first persistence. Swap this module later for Firebase / Supabase / iCloud. */
export async function loadAppStore(): Promise<AppStore> {
  try {
    const rawV4 = await AsyncStorage.getItem(APP_STORAGE_KEY);
    if (rawV4) {
      const parsed = JSON.parse(rawV4) as AppStore;
      return normalizeAppStore(parsed);
    }

    const rawV3 = await AsyncStorage.getItem(LEGACY_V3_STORAGE_KEY);
    if (rawV3) {
      const legacy = JSON.parse(rawV3) as LegacyWorkspaceState;
      const migrated = migrateLegacyV3(legacy);
      await saveAppStore(migrated);
      return migrated;
    }

    return emptyAppStore();
  } catch {
    return emptyAppStore();
  }
}

export async function saveAppStore(store: AppStore): Promise<void> {
  const next: AppStore = {
    ...store,
    version: APP_VERSION,
  };
  await AsyncStorage.setItem(APP_STORAGE_KEY, JSON.stringify(next));
}

function normalizeAppStore(parsed: AppStore): AppStore {
  const workspaces = Array.isArray(parsed.workspaces) ? parsed.workspaces : [];
  let activeWorkspaceId = parsed.activeWorkspaceId ?? null;

  if (
    activeWorkspaceId &&
    !workspaces.some((w) => w.id === activeWorkspaceId)
  ) {
    activeWorkspaceId = workspaces[0]?.id ?? null;
  }

  if (!activeWorkspaceId && workspaces.length > 0) {
    activeWorkspaceId = workspaces[0].id;
  }

  return {
    version: APP_VERSION,
    workspaces: workspaces.map((w) => ({
      ...w,
      brandName: w.brandName || w.name || "",
      logoUri: w.logoUri || "",
      industry: w.industry || "其他",
      brandIntro: w.brandIntro || "",
      brand: w.brand ?? null,
      products: Array.isArray(w.products) ? w.products : [],
      creators: Array.isArray(w.creators) ? w.creators : [],
      scripts: Array.isArray(w.scripts) ? w.scripts : [],
      draft: w.draft ?? null,
      syncStatus: w.syncStatus || "local",
    })),
    activeWorkspaceId,
  };
}
