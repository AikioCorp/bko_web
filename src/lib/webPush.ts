import { studioApi } from "./studioApi";

export type PushPermissionStatus = "granted" | "denied" | "default" | "unsupported";

/**
 * Vérifie si le navigateur prend en charge les Service Workers et l'API Push.
 */
export function isWebPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/**
 * Obtient le statut actuel de permission de notification du navigateur.
 */
export function getWebPushPermission(): PushPermissionStatus {
  if (!isWebPushSupported()) return "unsupported";
  return Notification.permission as PushPermissionStatus;
}

/**
 * Demande la permission et enregistre le jeton Web Push auprès du serveur Bamako Podcast.
 */
export async function requestAndRegisterWebPush(): Promise<{ success: boolean; status: PushPermissionStatus; message?: string }> {
  if (!isWebPushSupported()) {
    return { success: false, status: "unsupported", message: "Les notifications push ne sont pas prises en charge par ce navigateur." };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, status: permission as PushPermissionStatus, message: "Permission de notification refusée." };
    }

    // Enregistrement du Service Worker
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;

    // Récupération de la souscription Push existante ou nouvelle
    let subscription = await registration.pushManager.getSubscription();

    // Si pas de clé VAPID publique configurée dans le navigateur, on utilise l'endpoint FCM/standard
    if (!subscription) {
      // Inscription basique
      try {
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (vapidPublicKey) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });
        }
      } catch (subErr: any) {
        console.warn("[WebPush] Inscription standard sans clé VAPID :", subErr.message);
      }
    }

    const token = subscription ? JSON.stringify(subscription) : `web_browser_${navigator.userAgent.slice(0, 50)}_${Date.now()}`;

    // Envoi du token au backend via /me/push-token
    await studioApi("/me/push-token", {
      method: "POST",
      body: {
        token,
        deviceType: "WEB",
        deviceName: `Navigateur (${navigator.userAgent.includes("Chrome") ? "Chrome" : navigator.userAgent.includes("Firefox") ? "Firefox" : "Web"})`,
      },
    });

    return { success: true, status: "granted", message: "Notifications navigateur activées avec succès." };
  } catch (err: any) {
    return { success: false, status: getWebPushPermission(), message: err.message || "Erreur lors de l'activation des notifications." };
  }
}

/**
 * Désinscrit l'appareil des notifications web push.
 */
export async function unregisterWebPush(): Promise<boolean> {
  if (!isWebPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const token = JSON.stringify(sub);
        try {
          await studioApi("/me/push-token", {
            method: "DELETE",
            body: { token },
          });
        } catch (_) {}
        await sub.unsubscribe();
      }
    }
    return true;
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
