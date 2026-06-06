export type VideoProvider = "ark" | "kling" | "dashscope";

export type ProviderConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export type Settings = {
  // 当前选中的视频提供商
  videoProvider: VideoProvider;

  // 各视频模型独立配置
  seedance: ProviderConfig;
  kling: ProviderConfig;
  dashscope: ProviderConfig;

  // 图片生成配置（支持 Seedream、阿里通义万相 等）
  imageGen: ProviderConfig;
  // 分镜脚本配置（支持 DeepSeek、Kimi、Qwen 等 LLM）
  storyboard: ProviderConfig;
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
  imageGen: {
    apiKey: "",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    model: "",
  },
  storyboard: {
    apiKey: "",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    model: "",
  },
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

  // 旧版 ARK 通用配置 → 新版 imageGen / storyboard
  if (typeof raw.arkApiKey === "string" || typeof raw.arkBaseUrl === "string") {
    const oldKey = typeof raw.arkApiKey === "string" ? raw.arkApiKey : "";
    const oldUrl = typeof raw.arkBaseUrl === "string" ? raw.arkBaseUrl : "https://ark.cn-beijing.volces.com/api/v3";
    const oldSeedream = typeof raw.seedreamModel === "string" ? raw.seedreamModel : "";
    const oldStoryboard = typeof raw.storyboardModel === "string" ? raw.storyboardModel : "";

    if (!merged.imageGen || typeof merged.imageGen !== "object") merged.imageGen = { ...DEFAULT_SETTINGS.imageGen };
    if (!merged.storyboard || typeof merged.storyboard !== "object") merged.storyboard = { ...DEFAULT_SETTINGS.storyboard };

    (merged.imageGen as Record<string, unknown>).apiKey = oldKey || DEFAULT_SETTINGS.imageGen.apiKey;
    (merged.imageGen as Record<string, unknown>).baseUrl = oldUrl;
    (merged.imageGen as Record<string, unknown>).model = oldSeedream || DEFAULT_SETTINGS.imageGen.model;

    (merged.storyboard as Record<string, unknown>).apiKey = oldKey || DEFAULT_SETTINGS.storyboard.apiKey;
    (merged.storyboard as Record<string, unknown>).baseUrl = oldUrl;
    (merged.storyboard as Record<string, unknown>).model = oldStoryboard || DEFAULT_SETTINGS.storyboard.model;
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
      // 检测是否为旧版 ARK 扁平格式
      if (parsed.arkApiKey || parsed.arkBaseUrl || parsed.seedreamModel || parsed.storyboardModel) {
        return migrateSettings(parsed);
      }
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        seedance: { ...DEFAULT_SETTINGS.seedance, ...(parsed.seedance || {}) },
        kling: { ...DEFAULT_SETTINGS.kling, ...(parsed.kling || {}) },
        dashscope: { ...DEFAULT_SETTINGS.dashscope, ...(parsed.dashscope || {}) },
        imageGen: { ...DEFAULT_SETTINGS.imageGen, ...(parsed.imageGen || {}) },
        storyboard: { ...DEFAULT_SETTINGS.storyboard, ...(parsed.storyboard || {}) },
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
