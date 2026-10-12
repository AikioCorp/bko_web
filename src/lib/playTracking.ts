import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/token";

type PlayEvent = "start" | "qualified" | "complete" | "progress";

const post = (path: string, body: unknown) => {
  const token = typeof window !== "undefined" ? getAccessToken() : null;
  return fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    keepalive: true,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }).catch(() => {});
};

const isMockId = (id: string) =>
  id.startsWith("hist-") ||
  id.startsWith("save-") ||
  id.startsWith("dl-") ||
  id.startsWith("foll-") ||
  id.startsWith("p-") ||
  id.startsWith("ep-");

export const sendPlayEvent = (episodeId: string, event: PlayEvent, seconds?: number) => {
  if (isMockId(episodeId)) return Promise.resolve();
  return post(`/episodes/${episodeId}/plays`, {
    event,
    ...(seconds !== undefined ? { seconds: Math.round(seconds) } : {}),
  });
};

export const saveHistory = (
  episodeId: string,
  positionSeconds: number,
  durationSeconds?: number
) => {
  if (isMockId(episodeId)) return Promise.resolve();
  return post(`/me/history`, {
    episodeId,
    positionSeconds: Math.floor(positionSeconds),
    durationSeconds: durationSeconds ? Math.floor(durationSeconds) : undefined,
  });
};

export const recordRecommendationImpression = (
  batchId: string,
  sectionId: string,
  sectionSlug: string,
  targetType: "EPISODE" | "PODCAST",
  targetId: string,
  position: number,
  reason?: string
) => {
  if (isMockId(targetId)) return;
  return post("/recommendations/events/impressions", {
    impressions: [
      {
        batchId,
        sectionId,
        sectionSlug,
        targetType,
        targetId,
        position,
        reason,
        visibleAt: new Date().toISOString(),
      },
    ],
  });
};

export const recordRecommendationInteraction = (
  batchId: string,
  sectionId: string,
  sectionSlug: string,
  targetType: "EPISODE" | "PODCAST",
  targetId: string,
  action: "CLICK" | "PLAY_START" | "QUALIFIED_PLAY" | "FAVORITE" | "LIKE" | "FOLLOW",
  position?: number
) => {
  if (isMockId(targetId)) return;
  return post("/recommendations/events/interactions", {
    batchId,
    sectionId,
    sectionSlug,
    targetType,
    targetId,
    action,
    position,
  });
};

export class ListenTracker {
  private lastT = 0;
  private listenedRealSeconds = 0; // Temps réel écoulé en secondes (wall-clock)
  private sentProgress = 0;
  private started = false;
  private qualified = false;
  private completed = false;
  private lastHistoryAt = 0;
  private rate = 1.0;
  private sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  constructor(
    private episodeId: string,
    private authenticated: () => boolean,
    private attribution?: {
      batchId?: string;
      sectionId?: string;
      sectionSlug?: string;
      recommendationId?: string;
    }
  ) {}

  setPlaybackRate(rate: number) {
    if (rate > 0 && Number.isFinite(rate)) {
      this.rate = rate;
    }
  }

  private sendStructuredEvent(
    eventType: "start" | "progress" | "pause" | "seek" | "complete",
    pos: number,
    deltaSeconds = 0
  ) {
    if (isMockId(this.episodeId)) return;
    const clientEventId = `evt_${this.sessionId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    post("/recommendations/events/listening", {
      events: [
        {
          clientEventId,
          sessionId: this.sessionId,
          episodeId: this.episodeId,
          eventType,
          positionSeconds: Math.floor(pos),
          deltaSeconds: Math.floor(deltaSeconds),
          playbackRate: this.rate,
          recommendationId: this.attribution?.recommendationId,
          sectionId: this.attribution?.sectionId,
          occurredAtClient: new Date().toISOString(),
        },
      ],
    });
  }

  start(startAt = 0, initialRate = 1.0) {
    this.lastT = startAt;
    this.rate = initialRate > 0 ? initialRate : 1.0;
    if (!this.started) {
      this.started = true;
      sendPlayEvent(this.episodeId, "start");
      this.sendStructuredEvent("start", startAt);
    }
  }

  tick(currentTime: number, duration: number, currentRate = 1.0) {
    if (currentRate > 0) this.rate = currentRate;
    const contentDelta = currentTime - this.lastT;
    this.lastT = currentTime;

    // Seul un avancement continu (0 < contentDelta < 4) compte comme écoute active
    // Un saut (seek) de 30s ou 10 minutes ne compte JAMAIS comme temps écouté
    if (contentDelta > 0 && contentDelta < 4) {
      const realElapsedSeconds = contentDelta / this.rate;
      this.listenedRealSeconds += realElapsedSeconds;
    }

    if (!this.qualified && this.listenedRealSeconds >= 30) {
      this.qualified = true;
      sendPlayEvent(this.episodeId, "qualified");
    }
    if (this.listenedRealSeconds - this.sentProgress >= 15) {
      this.flushProgress(currentTime);
    }
    if (this.authenticated() && Date.now() - this.lastHistoryAt > 15000) {
      this.lastHistoryAt = Date.now();
      saveHistory(this.episodeId, currentTime, duration);
    }
  }

  private flushProgress(currentTime?: number) {
    const deltaReal = this.listenedRealSeconds - this.sentProgress;
    if (deltaReal >= 1) {
      this.sentProgress = this.listenedRealSeconds;
      sendPlayEvent(this.episodeId, "progress", deltaReal);
      this.sendStructuredEvent("progress", currentTime ?? this.lastT, deltaReal);
    }
  }

  pause(currentTime: number, duration: number) {
    this.flushProgress(currentTime);
    this.sendStructuredEvent("pause", currentTime);
    if (this.authenticated() && currentTime > 0) saveHistory(this.episodeId, currentTime, duration);
  }

  end(duration: number) {
    this.flushProgress(duration);
    if (!this.completed) {
      this.completed = true;
      sendPlayEvent(this.episodeId, "complete");
      this.sendStructuredEvent("complete", duration);
    }
    if (this.authenticated()) saveHistory(this.episodeId, duration, duration);
  }
}
