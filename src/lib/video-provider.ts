import type { Settings } from "./settings";
import { createSeedanceTask, pollSeedanceTask } from "./seedance";
import {
  createKlingTask,
  pollKlingTask,
} from "./kling";
import {
  createDashscopeVideoTask,
  pollDashscopeVideoTask,
} from "./dashscope-video";

export type VideoTaskInput = {
  prompt: string;
  ratio: string;
  resolution: string;
  duration: number;
  generateAudio: boolean;
  watermark: boolean;
  returnLastFrame: boolean;
  firstFrameUrl?: string;
  referenceImageUrl?: string;
  assetId?: string;
};

export type VideoTaskResult = {
  id: string;
  status: string;
  videoUrl?: string;
  lastFrameUrl?: string;
  raw: unknown;
  error?: string;
};

export async function createVideoTask(
  input: VideoTaskInput,
  settings: Settings
): Promise<{ id: string }> {
  const provider = settings.videoProvider || "ark";

  switch (provider) {
    case "kling": {
      return createKlingTask(
        {
          prompt: input.prompt,
          model: settings.kling.model,
          ratio: input.ratio,
          duration: input.duration,
          firstFrameUrl: input.firstFrameUrl,
        },
        settings.kling.apiKey,
        settings.kling.baseUrl
      );
    }

    case "dashscope": {
      return createDashscopeVideoTask(
        {
          prompt: input.prompt,
          model: settings.dashscope.model,
          ratio: input.ratio,
          duration: input.duration,
          firstFrameUrl: input.firstFrameUrl,
        },
        settings.dashscope.apiKey,
        settings.dashscope.baseUrl
      );
    }

    case "ark":
    default: {
      return createSeedanceTask({
        prompt: input.prompt,
        model: settings.seedance.model,
        ratio: input.ratio,
        resolution: input.resolution,
        duration: input.duration,
        generateAudio: input.generateAudio,
        watermark: input.watermark,
        returnLastFrame: input.returnLastFrame,
        assetId: input.assetId,
        firstFrameUrl: input.firstFrameUrl,
        referenceImageUrl: input.referenceImageUrl,
        apiKey: settings.seedance.apiKey,
        baseUrl: settings.seedance.baseUrl,
      });
    }
  }
}

export async function pollVideoTask(
  taskId: string,
  settings: Settings
): Promise<VideoTaskResult> {
  const provider = settings.videoProvider || "ark";

  switch (provider) {
    case "kling": {
      const result = await pollKlingTask(taskId, settings.kling.apiKey, settings.kling.baseUrl);
      return {
        ...result,
        lastFrameUrl: undefined,
      };
    }

    case "dashscope": {
      const result = await pollDashscopeVideoTask(taskId, settings.dashscope.apiKey, settings.dashscope.baseUrl);
      return {
        ...result,
        lastFrameUrl: undefined,
      };
    }

    case "ark":
    default: {
      return pollSeedanceTask(taskId, settings.seedance.apiKey, settings.seedance.baseUrl);
    }
  }
}
