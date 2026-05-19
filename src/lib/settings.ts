export type VideoProvider = "ark" | "kling" | "dashscope";

export type Settings = {
  // Provider selection — drives dispatch in stores
  videoProvider: VideoProvider;

  // ARK (always required — powers image gen + storyboard LLM)
  arkApiKey: string;
  arkBaseUrl: string;
  seedanceModel: string;   // ARK video model endpoint
  seedreamModel: string;   // ARK image model endpoint
  storyboardModel: string; // ARK LLM endpoint

  // Kling AI (video only)
  klingApiKey: string;
  klingModel: string;

  // DashScope (video only)
  dashscopeApiKey: string;
  dashscopeModel: string;
};

const DEFAULT_SETTINGS: Settings = {
  videoProvider: "ark",
  arkApiKey: "",
  arkBaseUrl: "https://ark.cn-beijing.volces.com/api/v3",
  seedanceModel: "",
  seedreamModel: "",
  storyboardModel: "",
  klingApiKey: "",
  klingModel: "kling-v1-6",
  dashscopeApiKey: "",
  dashscopeModel: "wan2.1-t2v-turbo",
};

export function getSettings(): Settings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }
  const saved = localStorage.getItem("zaomeng_settings");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SETTINGS, ...parsed };
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
