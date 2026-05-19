export type KlingTaskInput = {
  prompt: string;
  model: string;
  ratio: string;
  duration: number;
  firstFrameUrl?: string;
};

export type KlingTaskResult = {
  id: string;
  status: string;
  videoUrl?: string;
  raw: unknown;
  error?: string;
};

const DEFAULT_BASE_URL = "https://api-beijing.klingai.com";

function getApiKey(inputApiKey: string) {
  if (!inputApiKey) throw new Error("Missing KLING_API_KEY. 请在设置页面配置。");
  return inputApiKey;
}

function buildHeaders(inputApiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getApiKey(inputApiKey)}`,
  };
}

export async function createKlingTask(
  input: KlingTaskInput,
  apiKey: string
): Promise<{ id: string }> {
  if (!input.model) throw new Error("Missing model for Kling");

  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
    duration: input.duration,
    aspect_ratio: input.ratio,
  };

  if (input.firstFrameUrl) {
    body.image = input.firstFrameUrl;
  }

  const response = await fetch(`${DEFAULT_BASE_URL}/v1/videos/generations`, {
    method: "POST",
    headers: buildHeaders(apiKey),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`创建 Kling 任务失败: ${message}`);
  }

  const payload = (await response.json()) as {
    code: number;
    data?: { task_id: string };
    message?: string;
  };

  if (payload.code !== 0 || !payload.data?.task_id) {
    throw new Error(
      `创建 Kling 任务失败: ${payload.message || JSON.stringify(payload)}`
    );
  }

  return { id: payload.data.task_id };
}

export async function getKlingTask(
  taskId: string,
  apiKey: string
): Promise<KlingTaskResult> {
  const response = await fetch(
    `${DEFAULT_BASE_URL}/v1/videos/generations/${taskId}`,
    {
      method: "GET",
      headers: buildHeaders(apiKey),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`查询 Kling 任务失败: ${message}`);
  }

  const payload = (await response.json()) as {
    code: number;
    data?: {
      task_id: string;
      status: string;
      task_result?: {
        videos?: Array<{ url: string; duration: number }>;
      };
    };
    message?: string;
  };

  if (payload.code !== 0 || !payload.data) {
    throw new Error(
      `查询 Kling 任务失败: ${payload.message || JSON.stringify(payload)}`
    );
  }

  const data = payload.data;
  const statusMap: Record<string, string> = {
    submitted: "running",
    processing: "running",
    succeeded: "succeeded",
    failed: "failed",
  };

  const videoUrl = data.task_result?.videos?.[0]?.url;

  return {
    id: String(data.task_id),
    status: statusMap[data.status] || data.status,
    videoUrl,
    raw: payload,
    error: data.status === "failed" ? "Kling 任务执行失败" : undefined,
  };
}

export async function pollKlingTask(
  taskId: string,
  apiKey: string
): Promise<KlingTaskResult> {
  while (true) {
    const task = await getKlingTask(taskId, apiKey);
    if (["succeeded", "failed", "expired"].includes(task.status)) {
      return task;
    }
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
}
