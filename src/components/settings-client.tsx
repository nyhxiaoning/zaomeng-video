"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { getSettings, saveSettings, type VideoProvider, type ProviderConfig } from "@/lib/settings";

// ============================================================
// Toast Context
// ============================================================

type ToastType = "success" | "error" | "info" | "warning";
type ToastItem = { id: number; type: ToastType; message: string };
type ToastCtx = { toasts: ToastItem[]; showToast: (type: ToastType, msg: string) => void };

const ToastContext = createContext<ToastCtx>({ toasts: [], showToast: () => {} });
export const useToast = () => useContext(ToastContext);

let _tid = 0;

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const showToast = useCallback((type: ToastType, msg: string) => {
    const id = ++_tid;
    setToasts((p) => [...p, { id, type, message: msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);
  const color: Record<ToastType, string> = {
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    error: "border-red-500/40 bg-red-500/10 text-red-300",
    info: "border-violet-500/40 bg-violet-500/10 text-violet-300",
    warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  };
  return (
    <ToastContext.Provider value={{ toasts, showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg animate-slide-in ${color[t.type]}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ============================================================
// Constants
// ============================================================

const DEF: Record<VideoProvider, ProviderConfig> = {
  ark: { apiKey: "", baseUrl: "https://ark.cn-beijing.volces.com/api/v3", model: "" },
  kling: { apiKey: "", baseUrl: "https://api-beijing.klingai.com", model: "kling-v1-6" },
  dashscope: { apiKey: "", baseUrl: "https://dashscope.aliyuncs.com", model: "wan2.1-t2v-turbo" },
};

const SEEDANCE_MODELS = [
  { v: "", l: "— 手动输入 Endpoint ID —" },
  { v: "doubao-seedance-2-0-260128", l: "Seedance 2.0 (260128)" },
  { v: "doubao-seedance-2-0-250828", l: "Seedance 2.0 (250828)" },
  { v: "doubao-seedance-1-5-250615", l: "Seedance 1.5" },
  { v: "doubao-seedance-1-0-pro-250528", l: "Seedance 1.0 Pro" },
];

const KLING_MODELS = [
  { v: "kling-v2-master", l: "Kling 2 Master" },
  { v: "kling-v2-1", l: "Kling 2.1" },
  { v: "kling-v1-6", l: "Kling 1.6" },
  { v: "kling-v1-5", l: "Kling 1.5" },
];

const DASHSCOPE_MODELS = [
  { v: "wan2.2-t2v-turbo", l: "Wan2.2 T2V Turbo" },
  { v: "wan2.1-t2v-turbo", l: "Wan2.1 T2V Turbo" },
  { v: "wan2.1-i2v-turbo", l: "Wan2.1 I2V Turbo" },
  { v: "wan2.1-t2v", l: "Wan2.1 T2V" },
];

const Spinner = () => (
  <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);

// ============================================================
// Feedback helper
// ============================================================

type Fb = { kind: "idle" } | { kind: "loading"; text: string } | { kind: "success"; text: string } | { kind: "error"; text: string };
const IDLE: Fb = { kind: "idle" };

// ============================================================
// ProviderCard
// ============================================================

function ProviderCard(p: {
  provider: VideoProvider;
  label: string;
  desc: string;
  active: boolean;
  onSwitch: (pv: VideoProvider) => void;
}) {
  const { showToast } = useToast();
  const key = p.provider === "ark" ? "seedance" : p.provider;

  const [cfg, setCfg] = useState<ProviderConfig>(() => {
    try {
      const s = getSettings();
      const v = (s as Record<string, unknown>)[key];
      return (v && typeof v === "object" ? v : DEF[p.provider]) as ProviderConfig;
    } catch { return DEF[p.provider]; }
  });

  const [saveFb, setSaveFb] = useState<Fb>(IDLE);
  const [switchFb, setSwitchFb] = useState<Fb>(IDLE);

  const ok = !!cfg.apiKey.trim();

  function upd(f: keyof ProviderConfig, v: string) {
    setCfg((pr) => ({ ...pr, [f]: v }));
    setSaveFb((fb) => fb.kind !== "idle" ? IDLE : fb);
  }

  async function doSave() {
    if (!cfg.apiKey.trim()) { setSaveFb({ kind: "error", text: "ApiKey 不能为空" }); showToast("error", "ApiKey 不能为空"); return; }
    if (!cfg.baseUrl.trim()) { setSaveFb({ kind: "error", text: "Base URL 不能为空" }); showToast("error", "Base URL 不能为空"); return; }
    if (!cfg.model.trim()) { setSaveFb({ kind: "error", text: "模型不能为空" }); showToast("error", "模型不能为空"); return; }

    setSaveFb({ kind: "loading", text: "正在验证并保存..." });
    try {
      const pu = `${cfg.baseUrl.replace(/\/$/, "")}/`;
      const r = await fetch(pu, { method: "HEAD", signal: AbortSignal.timeout(5000) }).catch(() => null);
      const s = getSettings();
      (s as Record<string, unknown>)[key] = cfg;
      saveSettings(s);
      if (!r || !r.ok) {
        const m = r ? `已保存，但服务器返回 ${r.status}，请检查 Base URL` : "已保存，但无法连接服务器，请检查网络";
        setSaveFb({ kind: "success", text: m });
        showToast("warning", m);
      } else {
        setSaveFb({ kind: "success", text: "配置验证通过，保存成功" });
        showToast("success", `${p.label} 配置验证通过`);
      }
    } catch (e) {
      const m = `保存失败: ${e instanceof Error ? e.message : "未知错误"}`;
      setSaveFb({ kind: "error", text: m });
      showToast("error", m);
    }
  }

  function doSwitch() {
    if (!ok) { setSwitchFb({ kind: "error", text: "请先保存 ApiKey 再启用" }); showToast("warning", "请先保存 ApiKey 再启用"); return; }
    setSwitchFb({ kind: "loading", text: "正在切换..." });
    try {
      const s = getSettings();
      s.videoProvider = p.provider;
      saveSettings(s);
    } catch (e) {
      setSwitchFb({ kind: "error", text: `切换失败: ${e instanceof Error ? e.message : ""}` });
      showToast("error", "切换失败");
      return;
    }
    setTimeout(() => {
      setSwitchFb({ kind: "success", text: `已切换至「${p.label}」` });
      showToast("success", `已切换至「${p.label}」`);
      p.onSwitch(p.provider);
    }, 300);
  }

  const activeClass = p.active
    ? "border-violet-500/40 bg-violet-500/8"
    : ok ? "border-emerald-500/20 bg-slate-950/40" : "border-white/10 bg-slate-950/30";

  const badge = p.active ? (
    <span className="rounded-full bg-violet-500/20 px-3 py-0.5 text-xs font-medium text-violet-300">当前使用</span>
  ) : ok ? (
    <span className="rounded-full bg-emerald-500/15 px-3 py-0.5 text-xs font-medium text-emerald-400">已配置</span>
  ) : (
    <span className="rounded-full bg-slate-500/20 px-3 py-0.5 text-xs font-medium text-slate-500">未配置</span>
  );

  return (
    <fieldset className={`rounded-2xl border p-5 ${activeClass}`}>
      <div className="flex items-center justify-between mb-3">
        <legend className="text-base font-semibold text-white">{p.label}</legend>
        {badge}
      </div>
      <p className="text-xs text-slate-500 mb-4">{p.desc}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm text-slate-300 md:col-span-2">
          <span>API Key</span>
          <input type="password" value={cfg.apiKey} onChange={(e) => upd("apiKey", e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-white outline-none focus:border-violet-400 placeholder:text-slate-600"
            placeholder={p.provider === "kling" ? "kling-..." : "sk-..."} />
        </label>
        <label className="grid gap-1.5 text-sm text-slate-300 md:col-span-2">
          <span>Base URL</span>
          <input type="text" value={cfg.baseUrl} onChange={(e) => upd("baseUrl", e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-white outline-none focus:border-violet-400 placeholder:text-slate-600"
            placeholder={DEF[p.provider].baseUrl} />
        </label>

        {p.provider === "ark" ? (
          <label className="grid gap-1.5 text-sm text-slate-300 md:col-span-2">
            <span>Seedance 模型</span>
            <select value={SEEDANCE_MODELS.some((m) => m.v === cfg.model) ? cfg.model : ""}
              onChange={(e) => { if (e.target.value) upd("model", e.target.value); }}
              className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-white outline-none focus:border-violet-400">
              {SEEDANCE_MODELS.map((m) => (<option key={m.v} value={m.v}>{m.l}</option>))}
            </select>
            <input type="text" value={cfg.model} onChange={(e) => upd("model", e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-white outline-none focus:border-violet-400 placeholder:text-slate-600 mt-1"
              placeholder="或直接输入 Endpoint ID（如 ep-xxx）" />
            <p className="text-xs text-slate-500">选择预置模型，或手动输入火山方舟 Endpoint ID。</p>
          </label>
        ) : p.provider === "kling" ? (
          <label className="grid gap-1.5 text-sm text-slate-300 md:col-span-2">
            <span>模型版本</span>
            <select value={cfg.model} onChange={(e) => upd("model", e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-white outline-none focus:border-violet-400">
              {KLING_MODELS.map((m) => (<option key={m.v} value={m.v}>{m.l}</option>))}
            </select>
          </label>
        ) : (
          <label className="grid gap-1.5 text-sm text-slate-300 md:col-span-2">
            <span>模型</span>
            <select value={cfg.model} onChange={(e) => upd("model", e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-white outline-none focus:border-violet-400">
              {DASHSCOPE_MODELS.map((m) => (<option key={m.v} value={m.v}>{m.l}</option>))}
            </select>
          </label>
        )}
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={doSave} disabled={saveFb.kind === "loading"}
            className={`rounded-full px-5 py-2 text-sm font-medium flex items-center gap-2 active:scale-95 ${
              saveFb.kind === "loading" ? "bg-slate-600 text-slate-400 cursor-not-allowed" : "bg-violet-500 text-white hover:bg-violet-400"
            }`}>
            {saveFb.kind === "loading" && <Spinner/>}
            {saveFb.kind === "loading" ? "保存中..." : "保存配置"}
          </button>
          {!p.active && (
            <button onClick={doSwitch} disabled={switchFb.kind === "loading"}
              className={`rounded-full px-5 py-2 text-sm font-medium flex items-center gap-2 active:scale-95 ${
                switchFb.kind === "loading" ? "bg-slate-600 text-slate-400 cursor-not-allowed" : "border border-violet-400/30 text-violet-300 hover:bg-violet-500/10"
              }`}>
              {switchFb.kind === "loading" && <Spinner/>}
              {switchFb.kind === "loading" ? "切换中..." : "启用此模型"}
            </button>
          )}
        </div>
        {saveFb.kind === "error" && <p className="text-sm text-red-400">{saveFb.text}</p>}
        {saveFb.kind === "success" && <p className={`text-sm ${saveFb.text.includes("无法连接") || saveFb.text.includes("返回") ? "text-amber-400" : "text-emerald-400"}`}>{saveFb.text}</p>}
        {switchFb.kind === "error" && <p className="text-sm text-amber-400">{switchFb.text}</p>}
        {switchFb.kind === "success" && <p className="text-sm text-violet-300">{switchFb.text}</p>}
      </div>
    </fieldset>
  );
}

// ============================================================
// SettingsInner
// ============================================================

function SettingsInner() {
  const { showToast } = useToast();

  const [vp, setVp] = useState<VideoProvider>(() => { try { return getSettings().videoProvider || "ark"; } catch { return "ark"; } });
  const [ak, setAk] = useState(() => { try { return getSettings().arkApiKey; } catch { return ""; } });
  const [au, setAu] = useState(() => { try { return getSettings().arkBaseUrl; } catch { return ""; } });
  const [sm, setSm] = useState(() => { try { return getSettings().seedreamModel; } catch { return ""; } });
  const [sb, setSb] = useState(() => { try { return getSettings().storyboardModel; } catch { return ""; } });
  const [arkFb, setArkFb] = useState<Fb>(IDLE);

  function doSaveArk() {
    console.log("doSaveArk======>", ak, au, sm, sb);
    if (!ak.trim()) { setArkFb({ kind: "error", text: "ARK API Key 不能为空" }); showToast("error", "ARK API Key 不能为空"); return; }
    if (!au.trim()) { setArkFb({ kind: "error", text: "ARK Base URL 不能为空" }); showToast("error", "ARK Base URL 不能为空"); return; }
    setArkFb({ kind: "loading", text: "保存中..." });
    try {
      const s = getSettings();
      s.arkApiKey = ak; s.arkBaseUrl = au; s.seedreamModel = sm; s.storyboardModel = sb;
      saveSettings(s);
      setArkFb({ kind: "success", text: "ARK 通用配置已保存" });
      showToast("success", "ARK 通用配置已保存");
    } catch (e) {
      setArkFb({ kind: "error", text: `保存失败: ${e instanceof Error ? e.message : ""}` });
      showToast("error", "ARK 保存失败");
    }
  }

  const cards = [
    { provider: "ark" as VideoProvider, label: "火山引擎 ARK — Seedance 视频模型", desc: "豆包 Seedance 视频生成，支持快捷选择预置模型或手动输入 Endpoint ID。" },
    { provider: "kling" as VideoProvider, label: "可灵 Kling AI — 视频模型", desc: "快手可灵 AI 视频生成，选择模型版本即可使用。" },
    { provider: "dashscope" as VideoProvider, label: "阿里云 DashScope — 视频模型", desc: "通义万相 Wan 系列视频生成，支持文生视频和图生视频。" },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-8 md:px-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft backdrop-blur md:p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">系统设置</h1>
        <p className="text-sm text-slate-400 mb-8">每个视频模型独立配置，互不干扰。配置完成后点击「启用此模型」即可切换。</p>

        {/* ARK 通用 */}
        <div className="mb-8 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-white">ARK 通用配置</h3>
            <span className="text-xs text-sky-300/70">图片生成 + 分镜脚本</span>
          </div>
          <p className="text-xs text-slate-500 mb-5">以下配置用于 Seedream 图片生成和分镜脚本 LLM。</p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm text-slate-300 md:col-span-2">
              <span>ARK_API_KEY</span>
              <input type="password" value={ak} onChange={(e) => setAk(e.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-white outline-none focus:border-violet-400 placeholder:text-slate-600" placeholder="sk-..." />
            </label>
            <label className="grid gap-1.5 text-sm text-slate-300 md:col-span-2">
              <span>ARK_BASE_URL</span>
              <input type="text" value={au} onChange={(e) => setAu(e.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-white outline-none focus:border-violet-400 placeholder:text-slate-600" placeholder="https://ark.cn-beijing.volces.com/api/v3" />
            </label>
            <label className="grid gap-1.5 text-sm text-slate-300">
              <span>SEEDREAM_MODEL（图片生成）</span>
              <input type="text" value={sm} onChange={(e) => setSm(e.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-white outline-none focus:border-violet-400 placeholder:text-slate-600" placeholder="ep-..." />
            </label>
            <label className="grid gap-1.5 text-sm text-slate-300">
              <span>STORYBOARD_MODEL（分镜脚本）</span>
              <input type="text" value={sb} onChange={(e) => setSb(e.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-white outline-none focus:border-violet-400 placeholder:text-slate-600" placeholder="ep-... 或 doubao-pro" />
            </label>
          </div>
          <div className="mt-4 space-y-2">
            <button onClick={doSaveArk} disabled={arkFb.kind === "loading"}
              className={`rounded-full px-5 py-2 text-sm font-medium flex items-center gap-2 active:scale-95 ${
                arkFb.kind === "loading" ? "bg-slate-600 text-slate-400 cursor-not-allowed" : "bg-sky-500 text-white hover:bg-sky-400"
              }`}>
              {arkFb.kind === "loading" && <Spinner/>}
              {arkFb.kind === "loading" ? "保存中..." : "保存 ARK 通用配置"}
            </button>
            {arkFb.kind === "error" && <p className="text-sm text-red-400">{arkFb.text}</p>}
            {arkFb.kind === "success" && <p className="text-sm text-emerald-400">{arkFb.text}</p>}
          </div>
        </div>

        {/* 帮助 */}
        <div className="mb-8 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5 text-sm text-sky-200">
          <h3 className="mb-2 font-semibold text-sky-300">如何获取这些参数？</h3>
          <ul className="list-inside list-disc space-y-1 ml-1">
            <li><strong>火山引擎 ARK</strong>：火山方舟 API Key 管理 + 在线推理接入点。</li>
            <li><strong>可灵 Kling AI</strong>：Kling AI 开放平台。</li>
            <li><strong>阿里云 DashScope</strong>：阿里云 DashScope API-KEY 管理。</li>
          </ul>
        </div>

        {/* 视频模型卡片 */}
        <div className="space-y-6">
          <h3 className="text-base font-semibold text-white mb-1">视频模型配置</h3>
          <p className="text-xs text-slate-500 -mt-5 mb-2">配置完成后点击「启用此模型」即可切换。</p>
          {cards.map((c) => (
            <ProviderCard key={c.provider} provider={c.provider} label={c.label} desc={c.desc}
              active={vp === c.provider}
              onSwitch={(pv) => setVp(pv)} />
          ))}
        </div>
      </section>
    </main>
  );
}

// ============================================================
// Export
// ============================================================

export function SettingsClient() {
  return <ToastProvider><SettingsInner /></ToastProvider>;
}
