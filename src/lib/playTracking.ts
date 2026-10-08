import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/token";

type PlayEvent = "start" | "qualified" | "complete" | "progress";

const post = (path: string, body: unknown) => {
  const token = getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "omit", // We use Bearer token now
    keepalive: true,
    headers,
    body: JSON.stringify(body),
  }).catch(() => {});
};

const isMockId = (id: string) => id.startsWith("hist-") || id.startsWith("save-") || id.startsWith("dl-") || id.startsWith("foll-") || id.startsWith("p-") || id.startsWith("ep-");

export const sendPlayEvent = (episodeId: string, event: PlayEvent, seconds?: number) => {
  if (isMockId(episodeId)) return Promise.resolve();
  return post(`/episodes/${episodeId}/plays`, { event, ...(seconds !== undefined ? { seconds: Math.round(seconds) } : {}) });
};

export const saveHistory = (episodeId: string, positionSeconds: number, durationSeconds?: number) => {
  if (isMockId(episodeId)) return Promise.resolve();
  return post(`/me/history`, { episodeId, positionSeconds: Math.floor(positionSeconds), durationSeconds: durationSeconds ? Math.floor(durationSeconds) : undefined });
};

export class ListenTracker {
  private lastT = 0;
  private listened = 0;
  private sentProgress = 0;
  private started = false;
  private qualified = false;
  private completed = false;
  private lastHistoryAt = 0;

  constructor(private episodeId: string, private authenticated: () => boolean) {}

  start(startAt = 0) {
    this.lastT = startAt;
    if (!this.started) {
      this.started = true;
      sendPlayEvent(this.episodeId, "start");
    }
  }

  tick(currentTime: number, duration: number) {
    const delta = currentTime - this.lastT;
    this.lastT = currentTime;
    if (delta > 0 && delta < 3) this.listened += delta;

    if (!this.qualified && this.listened >= 30) {
      this.qualified = true;
      sendPlayEvent(this.episodeId, "qualified");
    }
    if (this.listened - this.sentProgress >= 15) this.flushProgress();
    if (this.authenticated() && Date.now() - this.lastHistoryAt > 15000) {
      this.lastHistoryAt = Date.now();
      saveHistory(this.episodeId, currentTime, duration);
    }
  }

  private flushProgress() {
    const delta = this.listened - this.sentProgress;
    if (delta >= 1) {
      this.sentProgress = this.listened;
      sendPlayEvent(this.episodeId, "progress", delta);
    }
  }

  pause(currentTime: number, duration: number) {
    this.flushProgress();
    if (this.authenticated() && currentTime > 0) saveHistory(this.episodeId, currentTime, duration);
  }

  end(duration: number) {
    this.flushProgress();
    if (!this.completed) {
      this.completed = true;
      sendPlayEvent(this.episodeId, "complete");
    }
    if (this.authenticated()) saveHistory(this.episodeId, duration, duration);
  }
}
