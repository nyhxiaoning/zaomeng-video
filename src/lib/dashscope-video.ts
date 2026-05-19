export type DashscopeVideoInput = {
  prompt: string;
  model: string;
  ratio: string;
  duration: number;
  firstFrameUrl?: string;
};

export type DashscopeVideoResult = {
  id: string;
  status: string;
  videoUrl?: string;
  raw: unknown;
  error?: string;
};

const DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com";

function getApiKey(inputApiKey: string) {
  if (!inputApiKey) throw new Error("Missing DASHSCOPE_API_KEY. 请在设置页面配置。");
  return inputApiKey;
}

function buildHeaders(inputApiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getApiKey(inputApiKey)}`,
    "X-DashScope-Async": "enable",
  };
}

function ratioToSize(ratio: string): string {
  const map: Record<string, string> = {
    "16:9": "1280*720",
    "9:16": "720*1280",
    "1:1": "1024*1024",
    "4:3": "1024*768",
    "3:4": "768*1024",
  };
  return map[ratio] || "720*1280";
}

export async function createDashscopeVideoTask(
  input: DashscopeVideoInput,
  apiKey: string
): Promise<{ id: string }> {
  if (!input.model) throw new Error("Missing model for DashScope");

  const body: Record<string, unknown> = {
    model: input.model,
    input: {
      prompt: input.prompt,
    },
    parameters: {
      size: ratioToSize(input.ratio),
      duration: input.duration,
      prompt_extend: true,
    },
  };

  if (input.firstFrameUrl) {
    (body.input as Record<string, unknown>).first_frame_image =
      input.firstFrameUrl;
  }

  const response = await fetch(
    `${DEFAULT_BASE_URL}/api/v1/services/aigc/videogeneration/video_generation`,
    {
      method: "POST",
      headers: buildHeaders(apiKey),
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`创建 DashScope 视频任务失败: ${message}`);
  }

  const payload = (await response.json()) as {
    output?: { task_id: string; task_status: string };
  };

  if (!payload.output?.task_id) {
    throw new Error(
      `创建 DashScope 视频任务失败: 未返回 task_id`
    );
  }

  return { id: payload.output.task_id };
}

export async function getDashscopeVideoTask(
  taskId: string,
  apiKey: string
): Promise<DashscopeVideoResult> {
  const response = await fetch(
    `${DEFAULT_BASE_URL}/api/v1/tasks/${taskId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getApiKey(apiKey)}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    // Some DashScope versions use POST for task query
    const fallbackResponse = await fetch(
      `${DEFAULT_BASE_URL}/api/v1/tasks/${taskId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getApiKey(apiKey)}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!fallbackResponse.ok) {
      const message = await fallbackResponse.text();
      throw new Error(`查询 DashScope 任务失败: ${message}`);
    }

    return parseTaskResponse(await fallbackResponse.json());
  }

  return parseTaskResponse(await response.json());
}

function parseTaskResponse(
  payload: Record<string, unknown>
): DashscopeVideoResult {
  const output = payload.output as
    | {
        task_id?: string;
        task_status?: string;
        results?: Array<{ url: string; video_url?: string }>;
        video_url?: string;
      }
    | undefined;

  if (!output) {
    throw new Error(`DashScope 返回格式异常: ${JSON.stringify(payload)}`);
  }

  const statusMap: Record<string, string> = {
    PENDING: "running",
    RUNNING: "running",
    SUCCEEDED: "succeeded",
    FAILED: "failed",
  };

  const videoUrl =
    output.video_url ||
    output.results?.[0]?.url ||
    output.results?.[0]?.video_url;

  return {
    id: String(output.task_id || ""),
    status: statusMap[output.task_status || ""] || output.task_status || "unknown",
    videoUrl,
    raw: payload,
    error:
      output.task_status === "FAILED"
        ? "DashScope 视频任务执行失败"
        : undefined,
  };
}

export async function pollDashscopeVideoTask(
  taskId: string,
  apiKey: string
): Promise<DashscopeVideoResult> {
  while (true) {
    const task = await getDashscopeVideoTask(taskId, apiKey);
    if (["succeeded", "failed", "expired"].includes(task.status)) {
      return task;
    }
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
}
