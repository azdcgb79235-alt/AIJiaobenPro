export type SyncStatus = "local" | "pending" | "synced";

export type ScriptStatus =
  | "draft"
  | "ready"
  | "to_shoot"
  | "filmed"
  | "published";

export type BrandStyle = {
  personality: string;
  tone: string;
  cta: string;
  hashtags: string;
};

export type Brand = {
  id: string;
  name: string;
  company: string;
  intro: string;
  positioning: string;
  values: string;
  features: string;
  slogan: string;
  website: string;
  prohibitions: string;
  style: BrandStyle;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  ownerId?: string;
};

export type Product = {
  id: string;
  name: string;
  intro: string;
  features: string;
  audience: string;
  price: string;
  offer: string;
  faq: string;
  scenarios: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  ownerId?: string;
};

export type Creator = {
  id: string;
  name: string;
  role: string;
  personalities: string[];
  speakingStyles: string[];
  catchphrases: string[];
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  ownerId?: string;
};

export type ScriptRecord = {
  id: string;
  title: string;
  prompt: string;
  result: string;
  platform: string;
  type: string;
  productId?: string;
  creatorIds: string[];
  status: ScriptStatus;
  favorite: boolean;
  elapsedMs?: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  ownerId?: string;
};

export type DraftSession = {
  platform: string;
  type: string;
  productId?: string;
  creatorIds: string[];
  purpose?: string;
  style?: string;
  duration?: string;
  audience?: string;
  industry?: string;
  extraDescription?: string;
  updatedAt: string;
};

/** One isolated company / brand / client / store / project. */
export type Workspace = {
  id: string;
  name: string;
  brandName: string;
  logoUri: string;
  industry: string;
  brandIntro: string;
  brand: Brand | null;
  products: Product[];
  creators: Creator[];
  scripts: ScriptRecord[];
  draft: DraftSession | null;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  ownerId?: string;
};

/** Root local store. Ready to swap for Firebase / Supabase later. */
export type AppStore = {
  version: number;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
};

/** @deprecated V3 single-workspace blob — used only for migration. */
export type LegacyWorkspaceState = {
  brand: Brand | null;
  products: Product[];
  creators: Creator[];
  scripts: ScriptRecord[];
  draft: DraftSession | null;
  version?: number;
};

export const APP_STORAGE_KEY = "aics_v4_app";
export const LEGACY_V3_STORAGE_KEY = "aics_v3_workspace";
export const APP_VERSION = 4;

export const WORKSPACE_INDUSTRIES = [
  "電商",
  "餐飲",
  "健身",
  "美容",
  "美髮",
  "房仲",
  "保險",
  "汽車",
  "科技",
  "教育",
  "旅遊",
  "金融",
  "服飾",
  "珠寶",
  "醫療",
  "寵物",
  "法律",
  "建設",
  "其他",
] as const;

export function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function emptyBrand(): Brand {
  const t = nowIso();
  return {
    id: createId("brand"),
    name: "",
    company: "",
    intro: "",
    positioning: "",
    values: "",
    features: "",
    slogan: "",
    website: "",
    prohibitions: "不要誇大\n不要政治\n不要攻擊同業",
    style: {
      personality: "",
      tone: "",
      cta: "",
      hashtags: "",
    },
    createdAt: t,
    updatedAt: t,
    syncStatus: "local",
  };
}

export function emptyProduct(): Product {
  const t = nowIso();
  return {
    id: createId("product"),
    name: "",
    intro: "",
    features: "",
    audience: "",
    price: "",
    offer: "",
    faq: "",
    scenarios: "",
    createdAt: t,
    updatedAt: t,
    syncStatus: "local",
  };
}

export function emptyCreator(): Creator {
  const t = nowIso();
  return {
    id: createId("creator"),
    name: "",
    role: "",
    personalities: [],
    speakingStyles: [],
    catchphrases: [],
    createdAt: t,
    updatedAt: t,
    syncStatus: "local",
  };
}

export function emptyAppStore(): AppStore {
  return {
    version: APP_VERSION,
    workspaces: [],
    activeWorkspaceId: null,
  };
}

export type CreateWorkspaceInput = {
  name: string;
  brandName?: string;
  logoUri?: string;
  industry: string;
  brandIntro?: string;
};

export function buildWorkspace(input: CreateWorkspaceInput): Workspace {
  const t = nowIso();
  const name = input.name.trim();
  const brandName = (input.brandName || "").trim();
  const brandIntro = (input.brandIntro || "").trim();
  const industry = input.industry.trim() || "其他";

  const brand = emptyBrand();
  brand.name = brandName || name;
  brand.company = name;
  brand.intro = brandIntro;
  brand.updatedAt = t;

  return {
    id: createId("ws"),
    name,
    brandName: brandName || name,
    logoUri: (input.logoUri || "").trim(),
    industry,
    brandIntro,
    brand,
    products: [],
    creators: [],
    scripts: [],
    draft: null,
    createdAt: t,
    updatedAt: t,
    syncStatus: "local",
  };
}

export function migrateLegacyV3(legacy: LegacyWorkspaceState): AppStore {
  const t = nowIso();
  const brandName = legacy.brand?.name?.trim() || "我的 Workspace";
  const workspace: Workspace = {
    id: createId("ws"),
    name: brandName,
    brandName,
    logoUri: "",
    industry: "其他",
    brandIntro: legacy.brand?.intro || "",
    brand: legacy.brand ?? null,
    products: Array.isArray(legacy.products) ? legacy.products : [],
    creators: Array.isArray(legacy.creators) ? legacy.creators : [],
    scripts: Array.isArray(legacy.scripts) ? legacy.scripts : [],
    draft: legacy.draft ?? null,
    createdAt: legacy.brand?.createdAt || t,
    updatedAt: t,
    syncStatus: "local",
  };

  return {
    version: APP_VERSION,
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
  };
}
