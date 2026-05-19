"use client";

import { useEffect, useState } from "react";
import { getSettings, saveSettings, VideoProvider } from "@/lib/settings";

export function SettingsClient() {
  const [videoProvider, setVideoProvider] = useState<VideoProvider>("ark");
  const [arkApiKey, setArkApiKey] = useState("");
  const [arkBaseUrl, setArkBaseUrl] = useState("");
  const [seedanceModel, setSeedanceModel] = useState("");
  const [seedreamModel, setSeedreamModel] = useState("");
  const [storyboardModel, setStoryboardModel] = useState("");
  const [klingApiKey, setKlingApiKey] = useState("");
  const [klingModel, setKlingModel] = useState("kling-v1-6");
  const [dashscopeApiKey, setDashscopeApiKey] = useState("");
  const [dashscopeModel, setDashscopeModel] = useState("wan2.1-t2v-turbo");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const settings = getSettings();
    setVideoProvider(settings.videoProvider || "ark");
    setArkApiKey(settings.arkApiKey);
    setArkBaseUrl(settings.arkBaseUrl);
    setSeedanceModel(settings.seedanceModel);
    setSeedreamModel(settings.seedreamModel);
    setStoryboardModel(settings.storyboardModel);
    setKlingApiKey(settings.klingApiKey || "");
    setKlingModel(settings.klingModel || "kling-v1-6");
    setDashscopeApiKey(settings.dashscopeApiKey || "");
    setDashscopeModel(settings.dashscopeModel || "wan2.1-t2v-turbo");
  }, []);

  function handleSave() {
    saveSettings({
      videoProvider,
      arkApiKey,
      arkBaseUrl,
      seedanceModel,
      seedreamModel,
      storyboardModel,
      klingApiKey,
      klingModel,
      dashscopeApiKey,
      dashscopeModel,
    });
    setSavedMessage("保存成功！");
    setTimeout(() => setSavedMessage(""), 3000);
  }

  const providerOptions: { value: VideoProvider; label: string }[] = [
    { value: "ark", label: "火山引擎 ARK" },
    { value: "kling", label: "可灵 Kling AI" },
    { value: "dashscope", label: "阿里云 DashScope" },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-8 md:px-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft backdrop-blur md:p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">系统设置</h1>
        <p className="text-sm text-slate-400 mb-6">
          配置您自己的 API Key 与模型端点，配置将保存在本地缓存。请确保各项配置均已填写，系统不再回退使用默认环境变量。
        </p>

        {/* Provider Selection */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-slate-950/60 p-5">
          <h3 className="mb-3 text-sm font-medium text-white">视频生成提供商</h3>
          <p className="mb-4 text-xs text-slate-500">
            图片生成与分镜脚本仍使用火山引擎 ARK，此处仅影响视频生成。
          </p>
          <div className="flex flex-wrap gap-3">
            {providerOptions.map((p) => (
              <button
                key={p.value}
                onClick={() => setVideoProvider(p.value)}
                className={`rounded-full px-5 py-2 text-sm transition ${
                  videoProvider === p.value
                    ? "bg-violet-500 text-white"
                    : "border border-white/10 text-slate-300 hover:bg-white/5"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5 text-sm text-sky-200">
          <h3 className="mb-2 font-semibold text-sky-300">如何获取这些参数？</h3>
          <ul className="list-inside list-disc space-y-1 ml-1 mb-2">
            <li><strong>火山引擎 ARK</strong>：在「火山引擎 - 火山方舟 - API Key 管理」页面获取 API Key，在「在线推理 - 预置推理接入点」页面获取各模型接入点 (ep-xxx)。</li>
            <li><strong>可灵 Kling AI</strong>：在 Kling AI 开放平台获取 API Key。</li>
            <li><strong>阿里云 DashScope</strong>：在「阿里云模型服务 - DashScope - API-KEY 管理」页面获取 API Key。</li>
          </ul>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* ===== ARK common fields (always needed for image gen + storyboard) ===== */}
          <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">
            <div className="flex justify-between items-center">
              <span>ARK_API_KEY</span>
            </div>
            <input
              type="password"
              value={arkApiKey}
              onChange={(e) => setArkApiKey(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-violet-400"
              placeholder="sk-..."
            />
            <p className="text-xs text-slate-500">
              火山引擎鉴权密钥。用于图片生成 (Seedream) 和分镜脚本 (Storyboard)。
            </p>
          </label>

          <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">
            <div className="flex justify-between items-center">
              <span>ARK_BASE_URL</span>
            </div>
            <input
              type="text"
              value={arkBaseUrl}
              onChange={(e) => setArkBaseUrl(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-violet-400"
              placeholder="https://ark.cn-beijing.volces.com/api/v3"
            />
            <p className="text-xs text-slate-500">火山引擎接口基础地址，通常不需要修改。</p>
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            <div className="flex justify-between items-center">
              <span>SEEDREAM_MODEL</span>
            </div>
            <input
              type="text"
              value={seedreamModel}
              onChange={(e) => setSeedreamModel(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-violet-400"
              placeholder="ep-..."
            />
            <p className="text-xs text-slate-500">用于底图生成的 Endpoint ID。</p>
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            <div className="flex justify-between items-center">
              <span>STORYBOARD_MODEL</span>
            </div>
            <input
              type="text"
              value={storyboardModel}
              onChange={(e) => setStoryboardModel(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-violet-400"
              placeholder="ep-..."
            />
            <p className="text-xs text-slate-500">用于生成分镜脚本的语言模型 Endpoint ID (如 doubao-pro)。</p>
          </label>

          {/* ===== Separator ===== */}
          <div className="md:col-span-2 border-t border-white/10 pt-4">
            <h3 className="text-sm font-medium text-white mb-1">视频生成模型</h3>
            <p className="text-xs text-slate-500 mb-4">
              根据上方选中的提供商，填写对应的视频生成模型参数。
            </p>
          </div>

          {/* ===== ARK video-specific fields ===== */}
          {videoProvider === "ark" && (
            <label className="grid gap-2 text-sm text-slate-300">
              <div className="flex justify-between items-center">
                <span>SEEDANCE_MODEL</span>
              </div>
              <input
                type="text"
                value={seedanceModel}
                onChange={(e) => setSeedanceModel(e.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-violet-400"
                placeholder="ep-..."
              />
              <p className="text-xs text-slate-500">用于视频生成的 Endpoint ID。</p>
            </label>
          )}

          {/* ===== Kling-specific fields ===== */}
          {videoProvider === "kling" && (
            <>
              <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">
                <div className="flex justify-between items-center">
                  <span>KLING_API_KEY</span>
                </div>
                <input
                  type="password"
                  value={klingApiKey}
                  onChange={(e) => setKlingApiKey(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-violet-400"
                  placeholder="kling-..."
                />
                <p className="text-xs text-slate-500">可灵 AI 的 API 密钥。</p>
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                <div className="flex justify-between items-center">
                  <span>KLING_MODEL</span>
                </div>
                <select
                  value={klingModel}
                  onChange={(e) => setKlingModel(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-violet-400"
                >
                  <option value="kling-v1-6">Kling 1.6</option>
                  <option value="kling-v1-5">Kling 1.5</option>
                </select>
                <p className="text-xs text-slate-500">Kling 视频模型版本。</p>
              </label>
            </>
          )}

          {/* ===== DashScope-specific fields ===== */}
          {videoProvider === "dashscope" && (
            <>
              <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">
                <div className="flex justify-between items-center">
                  <span>DASHSCOPE_API_KEY</span>
                </div>
                <input
                  type="password"
                  value={dashscopeApiKey}
                  onChange={(e) => setDashscopeApiKey(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-violet-400"
                  placeholder="sk-..."
                />
                <p className="text-xs text-slate-500">阿里云 DashScope API 密钥。</p>
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                <div className="flex justify-between items-center">
                  <span>DASHSCOPE_MODEL</span>
                </div>
                <select
                  value={dashscopeModel}
                  onChange={(e) => setDashscopeModel(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-violet-400"
                >
                  <option value="wan2.1-t2v-turbo">Wan2.1 T2V Turbo</option>
                  <option value="wan2.1-i2v-turbo">Wan2.1 I2V Turbo</option>
                  <option value="wan2.1-t2v">Wan2.1 T2V</option>
                </select>
                <p className="text-xs text-slate-500">DashScope 视频模型。</p>
              </label>
            </>
          )}

          <div className="mt-4 flex items-center gap-4 md:col-span-2">
            <button
              onClick={handleSave}
              className="rounded-full bg-violet-500 px-8 py-3 text-sm font-medium text-white transition hover:bg-violet-400"
            >
              保存配置
            </button>
            {savedMessage && <span className="text-sm text-green-400">{savedMessage}</span>}
          </div>
        </div>
      </section>
    </main>
  );
}
