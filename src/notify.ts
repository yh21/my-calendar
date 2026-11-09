// 알림 전송 계층.
// Tauri(맥 앱) 안에서는 네이티브 알림 플러그인을, 일반 브라우저에서는 Notification API를 쓴다.
import {
  isPermissionGranted,
  requestPermission as tauriRequestPermission,
  sendNotification as tauriSendNotification,
} from '@tauri-apps/plugin-notification'

export type NotifyPermission = 'granted' | 'denied' | 'default' | 'unsupported'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

// Tauri는 권한 상태를 동기적으로 알려주지 않으므로 마지막으로 확인한 값을 캐시한다.
let tauriPermission: NotifyPermission = 'default'
if (isTauri) {
  isPermissionGranted()
    .then((ok) => {
      if (ok) tauriPermission = 'granted'
    })
    .catch(() => {})
}

export function getPermission(): NotifyPermission {
  if (isTauri) return tauriPermission
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

export async function requestPermission(): Promise<NotifyPermission> {
  if (isTauri) {
    const result = await tauriRequestPermission()
    tauriPermission = result === 'granted' ? 'granted' : result === 'denied' ? 'denied' : 'default'
    return tauriPermission
  }
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.requestPermission()
}

export function sendNotification(title: string, body: string): void {
  if (isTauri) {
    if (tauriPermission === 'granted') tauriSendNotification({ title, body })
    return
  }
  if (getPermission() !== 'granted') return
  new Notification(title, { body })
}
