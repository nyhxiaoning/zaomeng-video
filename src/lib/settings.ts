export type VideoProvider = "ark" | "kling" | "dashscope";

export type ProviderConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export type Settings = {
  // 当前选中的视频提供商
  videoProvider: VideoProvider;

  // 各模型独立配置
  seedance: ProviderConfig;
  kling: ProviderConfig;
  dashscope: ProviderConfig;

  // ARK 通用配置（图片生成 + 分镜脚本仍使用 ARK）
  arkApiKey: string;
  arkBaseUrl: string;
  seedreamModel: string;   // ARK 图片模型 endpoint
  storyboardModel: string; // ARK 分镜 LLM endpoint
};

const DEFAULT_SETTINGS: Settings = {
  videoProvider: "ark",
  seedance: {
    apiKey: "",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    model: "",
  },
  kling: {
    apiKey: "",
    baseUrl: "https://api-beijing.klingai.com",
    model: "kling-v1-6",
  },
  dashscope: {
    apiKey: "",
    baseUrl: "https://dashscope.aliyuncs.com",
    model: "wan2.1-t2v-turbo",
  },
  arkApiKey: "",
  arkBaseUrl: "https://ark.cn-beijing.volces.com/api/v3",
  seedreamModel: "",
  storyboardModel: "",
};

/**
 * 对旧版本 localStorage 数据的迁移兼容
 */
function migrateSettings(raw: Record<string, unknown>): Settings {
  const merged = { ...DEFAULT_SETTINGS } as Record<string, unknown>;

  // 旧的扁平字段 → 新的嵌套结构
  if (typeof raw.seedanceApiKey === "string") {
    (merged.seedance as Record<string, unknown>).apiKey = raw.seedanceApiKey;
  }
  if (typeof raw.seedanceBaseUrl === "string") {
    (merged.seedance as Record<string, unknown>).baseUrl = raw.seedanceBaseUrl;
  }
  if (typeof raw.seedanceModel === "string") {
    (merged.seedance as Record<string, unknown>).model = raw.seedanceModel;
  }
  if (typeof raw.klingApiKey === "string") {
    (merged.kling as Record<string, unknown>).apiKey = raw.klingApiKey;
  }
  if (typeof raw.klingBaseUrl === "string") {
    (merged.kling as Record<string, unknown>).baseUrl = raw.klingBaseUrl;
  }
  if (typeof raw.klingModel === "string") {
    (merged.kling as Record<string, unknown>).model = raw.klingModel;
  }
  if (typeof raw.dashscopeApiKey === "string") {
    (merged.dashscope as Record<string, unknown>).apiKey = raw.dashscopeApiKey;
  }
  if (typeof raw.dashscopeBaseUrl === "string") {
    (merged.dashscope as Record<string, unknown>).baseUrl = raw.dashscopeBaseUrl;
  }
  if (typeof raw.dashscopeModel === "string") {
    (merged.dashscope as Record<string, unknown>).model = raw.dashscopeModel;
  }

  // 新的嵌套字段直接覆盖
  if (raw.seedance && typeof raw.seedance === "object") {
    merged.seedance = { ...(merged.seedance as object), ...(raw.seedance as object) };
  }
  if (raw.kling && typeof raw.kling === "object") {
    merged.kling = { ...(merged.kling as object), ...(raw.kling as object) };
  }
  if (raw.dashscope && typeof raw.dashscope === "object") {
    merged.dashscope = { ...(merged.dashscope as object), ...(raw.dashscope as object) };
  }

  // 其他字段直接覆盖
  for (const key of ["videoProvider", "arkApiKey", "arkBaseUrl", "seedreamModel", "storyboardModel"]) {
    if (key in raw) {
      merged[key] = raw[key];
    }
  }

  return merged as unknown as Settings;
}

export function getSettings(): Settings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }
  const saved = localStorage.getItem("zaomeng_settings");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // 检测是否为旧格式（扁平字段无 seedance 嵌套）
      if (!parsed.seedance && (parsed.seedanceApiKey || parsed.seedanceModel)) {
        return migrateSettings(parsed);
      }
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        seedance: { ...DEFAULT_SETTINGS.seedance, ...(parsed.seedance || {}) },
        kling: { ...DEFAULT_SETTINGS.kling, ...(parsed.kling || {}) },
        dashscope: { ...DEFAULT_SETTINGS.dashscope, ...(parsed.dashscope || {}) },
      };
    } catch (e) {
      // Ignore parse error
    }
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings) {
  if (typeof window !== "undefined") {
    localStorage.setItem("zaomeng_settings", JSON.stringify(settings));
  }
}
