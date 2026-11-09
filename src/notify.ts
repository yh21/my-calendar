// 알림 전송 계층. 지금은 브라우저 Notification API를 쓰고,
// 나중에 Tauri로 감쌀 때 이 파일만 네이티브 플러그인으로 바꾸면 된다.

export type NotifyPermission = 'granted' | 'denied' | 'default' | 'unsupported'

export function getPermission(): NotifyPermission {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

export async function requestPermission(): Promise<NotifyPermission> {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.requestPermission()
}

export function sendNotification(title: string, body: string): void {
  if (getPermission() !== 'granted') return
  new Notification(title, { body })
}
