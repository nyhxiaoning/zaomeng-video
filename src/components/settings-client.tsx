"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import { getSettings, saveSettings, type VideoProvider, type ProviderConfig } from "@/lib/settings";

// ============================================================
// Toast Context — 统一管理全局通知
// ============================================================

type ToastType = "success" | "error" | "info" | "warning";

type ToastItem = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastContextType = {
  toasts: ToastItem[];
  showToast: (type: ToastType, message: string) => void;
};

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let _toastId = 0;

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast }}>
      {children}
      {/* Toast 渲染区 */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => {
          const colorMap: Record<ToastType, string> = {
            success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
            error: "border-red-500/40 bg-red-500/10 text-red-300",
            info: "border-violet-500/40 bg-violet-500/10 text-violet-300",
            warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
          };
          return (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur animate-slide-in ${colorMap[t.type]}`}
            >
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// ============================================================
// 常量
// ============================================================

const DEFAULT_CONFIGS: Record<VideoProvider, ProviderConfig> = {
  ark: { apiKey: "", baseUrl: "https://ark.cn-beijing.volces.com/api/v3", model: "" },
  kling: { apiKey: "", baseUrl: "https://api-beijing.klingai.com", model: "kling-v1-6" },
  dashscope: { apiKey: "", baseUrl: "https://dashscope.aliyuncs.com", model: "wan2.1-t2v-turbo" },
};

const SEEDANCE_PRESET_MODELS = [
  { value: "", label: "— 手动输入 Endpoint ID —" },
  { value: "doubao-seedance-2-0-260128", label: "Seedance 2.0 (260128)" },
  { value: "doubao-seedance-2-0-250828", label: "Seedance 2.0 (250828)" },
  { value: "doubao-seedance-1-5-250615", label: "Seedance 1.5" },
  { value: "doubao-seedance-1-0-pro-250528", label: "Seedance 1.0 Pro" },
];

const KLING_MODELS = [
  { value: "kling-v2-master", label: "Kling 2 Master" },
  { value: "kling-v2-1", label: "Kling 2.1" },
  { value: "kling-v1-6", label: "Kling 1.6" },
  { value: "kling-v1-5", label: "Kling 1.5" },
];

const DASHSCOPE_MODELS = [
  { value: "wan2.2-t2v-turbo", label: "Wan2.2 T2V Turbo" },
  { value: "wan2.1-t2v-turbo", label: "Wan2.1 T2V Turbo" },
  { value: "wan2.1-i2v-turbo", label: "Wan2.1 I2V Turbo" },
  { value: "wan2.1-t2v", label: "Wan2.1 T2V" },
];

// ============================================================
// SVG helpers
// ============================================================

function SpinnerIcon() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ============================================================
// ProviderCard — 单个模型卡片（自闭环）
// ============================================================

type CardFeedback =
  | { kind: "idle" }
  | { kind: "loading"; text: string }
  | { kind: "success"; text: string }
  | { kind: "error"; text: string };

function ProviderCard({
  provider,
  label,
  description,
  currentProvider,
  onSwitch,
}: {
  provider: VideoProvider;
  label: string;
  description: string;
  currentProvider: VideoProvider;
  onSwitch: (p: VideoProvider) => void;
}) {
  const { showToast } = useToast();
  const settingsKey = provider === "ark" ? "seedance" : provider;

  const [config, setConfig] = useState<ProviderConfig>(() => {
    const s = getSettings();
    const val = (s as Record<string, unknown>)[settingsKey];
    return (val && typeof val === "object" ? val : DEFAULT_CONFIGS[provider]) as ProviderConfig;
  });

  const [saveFeedback, setSaveFeedback] = useState<CardFeedback>({ kind: "idle" });
  const [switchFeedback, setSwitchFeedback] = useState<CardFeedback>({ kind: "idle" });

  const isActive = provider === currentProvider;
  const isConfigured = !!config.apiKey.trim();

  function updateField(field: keyof ProviderConfig, value: string) {
    setConfig((prev) => ({ ...prev, [field]: value }));
    if (saveFeedback.kind !== "idle") setSaveFeedback({ kind: "idle" });
  }

  async function handleSave() {
    // 校验
    if (!config.apiKey.trim()) {
      setSaveFeedback({ kind: "error", text: "ApiKey 不能为空" });
      showToast("error", "ApiKey 不能为空");
      return;
    }
    if (!config.baseUrl.trim()) {
      setSaveFeedback({ kind: "error", text: "Base URL 不能为空" });
      showToast("error", "Base URL 不能为空");
      return;
    }
    if (!config.model.trim()) {
      setSaveFeedback({ kind: "error", text: "模型不能为空" });
      showToast("error", "模型不能为空");
      return;
    }

    setSaveFeedback({ kind: "loading", text: "正在验证并保存..." });

    try {
      const pingUrl = `${config.baseUrl.replace(/\/$/, "")}/`;
      const pingRes = await fetch(pingUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      }).catch(() => null);

      const s = getSettings();
      (s as Record<string, unknown>)[settingsKey] = config;
      saveSettings(s);

      if (!pingRes || !pingRes.ok) {
        const msg = pingRes
          ? `配置已保存，但服务器返回 ${pingRes.status}，请检查 Base URL`
          : "配置已保存，但无法连接服务器，请检查网络";
        setSaveFeedback({ kind: "success", text: msg });
        showToast("warning", msg);
      } else {
        const msg = "配置验证通过，保存成功";
        setSaveFeedback({ kind: "success", text: msg });
        showToast("success", `${label} ${msg}`);
      }
    } catch (err) {
      const msg = `保存失败: ${err instanceof Error ? err.message : "未知错误"}`;
      setSaveFeedback({ kind: "error", text: msg });
      showToast("error", msg);
    }
  }

  function handleSetActive() {
    if (!isConfigured) {
      const msg = "请先填写 ApiKey 并保存后再启用";
      setSwitchFeedback({ kind: "error", text: msg });
      showToast("warning", msg);
      return;
    }

    setSwitchFeedback({ kind: "loading", text: "正在切换..." });

    const s = getSettings();
    s.videoProvider = provider;
    saveSettings(s);

    // 短暂延迟让 loading 可见
    setTimeout(() => {
      const msg = `已切换至「${label}」`;
      setSwitchFeedback({ kind: "success", text: msg });
      showToast("success", msg);
      onSwitch(provider);
    }, 350);
  }

  // 卡片样式
  const cardBorder = isActive
    ? "border-violet-500/40 bg-violet-500/8"
    : isConfigured
      ? "border-emerald-500/20 bg-slate-950/40"
      : "border-white/10 bg-slate-950/30";

  return (
    <fieldset className={`rounded-2xl border p-5 transition-all duration-300 ${cardBorder}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3">
        <legend className="text-base font-semibold text-white">{label}</legend>
        {isActive && (
          <span className="rounded-full bg-violet-500/20 px-3 py-0.5 text-xs font-medium text-violet-300">
            当前使用
          </span>
        )}
        {!isActive && isConfigured && (
          <span className="rounded-full bg-emerald-500/15 px-3 py-0.5 text-xs font-medium text-emerald-400">
            已配置
          </span>
        )}
        {!isConfigured && (
          <span className="rounded-full bg-slate-500/20 px-3 py-0.5 text-xs font-medium text-slate-500">
            未配置
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500 mb-4">{description}</p>

      {/* 表单 */}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm text-slate-300 md:col-span-2">
          <span>API Key</span>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => updateField("apiKey", e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-white outline-none transition focus:border-violet-400 placeholder:text-slate-600"
            placeholder={provider === "kling" ? "kling-..." : "sk-..."}
          />
        </label>

        <label className="grid gap-1.5 text-sm text-slate-300 md:col-span-2">
          <span>Base URL</span>
          <input
            type="text"
            value={config.baseUrl}
            onChange={(e) => updateField("baseUrl", e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-white outline-none transition focus:border-violet-400 placeholder:text-slate-600"
            placeholder={DEFAULT_CONFIGS[provider].baseUrl}
          />
        </label>

        {/* Model */}
        {provider === "ark" ? (
          <label className="grid gap-1.5 text-sm text-slate-300 md:col-span-2">
            <span>Seedance 模型</span>
            <select
              value={SEEDANCE_PRESET_MODELS.some((m) => m.value === config.model) ? config.model : ""}
              onChange={(e) => { if (e.target.value) updateField("model", e.target.value); }}
              className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-white outline-none transition focus:border-violet-400"
            >
              {SEEDANCE_PRESET_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={config.model}
              onChange={(e) => updateField("model", e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-white outline-none transition focus:border-violet-400 placeholder:text-slate-600 mt-1"
              placeholder="或直接输入 Endpoint ID（如 ep-xxx）"
            />
            <p className="text-xs text-slate-500">选择预置模型，或手动输入火山方舟 Endpoint ID。</p>
          </label>
        ) : provider === "kling" ? (
          <label className="grid gap-1.5 text-sm text-slate-300 md:col-span-2">
            <span>模型版本</span>
            <select
              value={config.model}
              onChange={(e) => updateField("model", e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-white outline-none transition focus:border-violet-400"
            >
              {KLING_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </label>
        ) : (
          <label className="grid gap-1.5 text-sm text-slate-300 md:col-span-2">
            <span>模型</span>
            <select
              value={config.model}
              onChange={(e) => updateField("model", e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-white outline-none transition focus:border-violet-400"
            >
              {DASHSCOPE_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* 按钮行 + 内联反馈 */}
      <div className="mt-5 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* 保存按钮 */}
          <button
            onClick={handleSave}
            disabled={saveFeedback.kind === "loading"}
            className={`rounded-full px-5 py-2 text-sm font-medium transition flex items-center gap-2 active:scale-95 ${
              saveFeedback.kind === "loading"
                ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                : "bg-violet-500 text-white hover:bg-violet-400"
            }`}
          >
            {saveFeedback.kind === "loading" && <SpinnerIcon />}
            {saveFeedback.kind === "loading" ? "保存中..." : "保存配置"}
          </button>

          {/* 启用按钮 */}
          {!isActive && (
            <button
              onClick={handleSetActive}
              disabled={switchFeedback.kind === "loading"}
              className={`rounded-full px-5 py-2 text-sm font-medium transition flex items-center gap-2 active:scale-95 ${
                switchFeedback.kind === "loading"
                  ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                  : "border border-violet-400/30 text-violet-300 hover:bg-violet-500/10"
              }`}
            >
              {switchFeedback.kind === "loading" && <SpinnerIcon />}
              {switchFeedback.kind === "loading" ? "切换中..." : "启用此模型"}
            </button>
          )}
        </div>

        {/* 内联反馈文字 */}
        {saveFeedback.kind === "error" && (
          <p className="text-sm text-red-400">{saveFeedback.text}</p>
        )}
        {saveFeedback.kind === "success" && (
          <p className={`text-sm ${saveFeedback.text.includes("无法连接") || saveFeedback.text.includes("服务器返回") ? "text-amber-400" : "text-emerald-400"}`}>
            {saveFeedback.text}
          </p>
        )}

        {switchFeedback.kind === "error" && (
          <p className="text-sm text-amber-400">{switchFeedback.text}</p>
        )}
        {switchFeedback.kind === "success" && (
          <p className="text-sm text-violet-300">{switchFeedback.text}</p>
        )}
      </div>
    </fieldset>
  );
}

// ============================================================
// 主页面
// ============================================================

function SettingsInner() {
  const { showToast } = useToast();

  const [videoProvider, setVideoProvider] = useState<VideoProvider>(() => getSettings().videoProvider || "ark");

  const [arkApiKey, setArkApiKey] = useState(() => getSettings().arkApiKey);
  const [arkBaseUrl, setArkBaseUrl] = useState(() => getSettings().arkBaseUrl);
  const [seedreamModel, setSeedreamModel] = useState(() => getSettings().seedreamModel);
  const [storyboardModel, setStoryboardModel] = useState(() => getSettings().storyboardModel);

  const [arkFeedback, setArkFeedback] = useState<CardFeedback>({ kind: "idle" });

  const handleProviderSwitch = useCallback((p: VideoProvider) => {
    setVideoProvider(p);
  }, []);

  function handleSaveArk() {
    alert('保存ARK配置')
    if (!arkApiKey.trim()) {
      setArkFeedback({ kind: "error", text: "ARK API Key 不能为空" });
      showToast("error", "ARK API Key 不能为空");
      return;
    }
    if (!arkBaseUrl.trim()) {
      setArkFeedback({ kind: "error", text: "ARK Base URL 不能为空" });
      showToast("error", "ARK Base URL 不能为空");
      return;
    }

    setArkFeedback({ kind: "loading", text: "保存中..." });

    const s = getSettings();
    s.arkApiKey = arkApiKey;
    s.arkBaseUrl = arkBaseUrl;
    s.seedreamModel = seedreamModel;
    s.storyboardModel = storyboardModel;
    saveSettings(s);

    setArkFeedback({ kind: "success", text: "ARK 通用配置已保存" });
    showToast("success", "ARK 通用配置已保存");
  }

  const models: { provider: VideoProvider; label: string; description: string }[] = [
    {
      provider: "ark",
      label: "火山引擎 ARK — Seedance 视频模型",
      description: "豆包 Seedance 视频生成，支持快捷选择预置模型或手动输入 Endpoint ID。",
    },
    {
      provider: "kling",
      label: "可灵 Kling AI — 视频模型",
      description: "快手可灵 AI 视频生成，选择模型版本即可使用。",
    },
    {
      provider: "dashscope",
      label: "阿里云 DashScope — 视频模型",
      description: "通义万相 Wan 系列视频生成，支持文生视频和图生视频。",
    },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-8 md:px-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft backdrop-blur md:p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">系统设置</h1>
        <p className="text-sm text-slate-400 mb-8">
          每个视频模型独立配置，互不干扰。配置完成后点击「启用此模型」即可切换。
        </p>

        {/* ARK 通用配置 */}
        <div className="mb-8 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-white">ARK 通用配置</h3>
            <span className="text-xs text-sky-300/70">图片生成 + 分镜脚本</span>
          </div>
          <p className="text-xs text-slate-500 mb-5">
            以下配置用于 Seedream 图片生成和分镜脚本 LLM，无论视频用哪个模型都需填写。
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm text-slate-300 md:col-span-2">
              <span>ARK_API_KEY</span>
              <input
                type="password"
                value={arkApiKey}
                onChange={(e) => { setArkApiKey(e.target.value); if (arkFeedback.kind !== "idle") setArkFeedback({ kind: "idle" }); }}
                className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-white outline-none transition focus:border-violet-400 placeholder:text-slate-600"
                placeholder="sk-..."
              />
            </label>
            <label className="grid gap-1.5 text-sm text-slate-300 md:col-span-2">
              <span>ARK_BASE_URL</span>
              <input
                type="text"
                value={arkBaseUrl}
                onChange={(e) => { setArkBaseUrl(e.target.value); if (arkFeedback.kind !== "idle") setArkFeedback({ kind: "idle" }); }}
                className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-white outline-none transition focus:border-violet-400 placeholder:text-slate-600"
                placeholder="https://ark.cn-beijing.volces.com/api/v3"
              />
            </label>
            <label className="grid gap-1.5 text-sm text-slate-300">
              <span>SEEDREAM_MODEL（图片生成）</span>
              <input
                type="text"
                value={seedreamModel}
                onChange={(e) => { setSeedreamModel(e.target.value); if (arkFeedback.kind !== "idle") setArkFeedback({ kind: "idle" }); }}
                className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-white outline-none transition focus:border-violet-400 placeholder:text-slate-600"
                placeholder="ep-..."
              />
            </label>
            <label className="grid gap-1.5 text-sm text-slate-300">
              <span>STORYBOARD_MODEL（分镜脚本）</span>
              <input
                type="text"
                value={storyboardModel}
                onChange={(e) => { setStoryboardModel(e.target.value); if (arkFeedback.kind !== "idle") setArkFeedback({ kind: "idle" }); }}
                className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-white outline-none transition focus:border-violet-400 placeholder:text-slate-600"
                placeholder="ep-... 或 doubao-pro"
              />
            </label>
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={handleSaveArk}
              disabled={arkFeedback.kind === "loading"}
              className={`rounded-full px-5 py-2 text-sm font-medium transition flex items-center gap-2 active:scale-95 ${
                arkFeedback.kind === "loading"
                  ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                  : "bg-sky-500 text-white hover:bg-sky-400"
              }`}
            >
              {arkFeedback.kind === "loading" && <SpinnerIcon />}
              {arkFeedback.kind === "loading" ? "保存中..." : "保存 ARK 通用配置"}
            </button>

            {arkFeedback.kind === "error" && (
              <p className="text-sm text-red-400">{arkFeedback.text}</p>
            )}
            {arkFeedback.kind === "success" && (
              <p className="text-sm text-emerald-400">{arkFeedback.text}</p>
            )}
          </div>
        </div>

        {/* 帮助提示 */}
        <div className="mb-8 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5 text-sm text-sky-200">
          <h3 className="mb-2 font-semibold text-sky-300">如何获取这些参数？</h3>
          <ul className="list-inside list-disc space-y-1 ml-1">
            <li><strong>火山引擎 ARK</strong>：在「火山引擎 - 火山方舟 - API Key 管理」页面获取 API Key，在「在线推理 - 预置推理接入点」页面获取各模型接入点 (ep-xxx)。</li>
            <li><strong>可灵 Kling AI</strong>：在 Kling AI 开放平台获取 API Key。</li>
            <li><strong>阿里云 DashScope</strong>：在「阿里云模型服务 - DashScope - API-KEY 管理」页面获取 API Key。</li>
          </ul>
        </div>

        {/* 三个视频模型卡片 */}
        <div className="space-y-6">
          <h3 className="text-base font-semibold text-white mb-1">视频模型配置</h3>
          <p className="text-xs text-slate-500 -mt-5 mb-2">
            配置完成后点击「启用此模型」即可切换当前使用的视频生成模型。
          </p>

          {models.map((m) => (
            <ProviderCard
              key={m.provider}
              provider={m.provider}
              label={m.label}
              description={m.description}
              currentProvider={videoProvider}
              onSwitch={handleProviderSwitch}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

// ============================================================
// 导出入口 — 包 ToastProvider
// ============================================================

export function SettingsClient() {
  return (
    <ToastProvider>
      <SettingsInner />
    </ToastProvider>
  );
}
