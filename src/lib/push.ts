// Web Push helper functions
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Bu tarayıcı bildirimleri desteklemiyor');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    throw new Error('Bildirim izni reddedilmiş');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker desteklenmiyor');
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch (error) {
    throw new Error(`Service Worker kaydı başarısız: ${error}`);
  }
}

export async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<PushSubscriptionData> {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  const appServerKey = urlBase64ToUint8Array(vapidKey);
  
  // ArrayBuffer'a normalize et (slice ile gerçek ArrayBuffer üret)
  const appServerKeyBuffer = appServerKey.buffer.slice(
    appServerKey.byteOffset,
    appServerKey.byteOffset + appServerKey.byteLength
  );
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: appServerKeyBuffer,
  });

  const key = subscription.getKey('p256dh');
  const auth = subscription.getKey('auth');

  if (!key || !auth) {
    throw new Error('Push subscription keys alınamadı');
  }

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: arrayBufferToBase64(key),
      auth: arrayBufferToBase64(auth),
    },
  };
}

export async function getExistingSubscription(): Promise<PushSubscriptionData | null> {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return null;

    const key = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');

    if (!key || !auth) return null;

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(key),
        auth: arrayBufferToBase64(auth),
      },
    };
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  // Açıkça ArrayBuffer yaratıyoruz (SharedArrayBuffer ihtimali yok)
  const arrayBuffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(arrayBuffer);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
