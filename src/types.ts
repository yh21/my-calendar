export interface CalendarEvent {
  id: string
  title: string
  /** 시작 시각 (epoch ms) */
  start: number
  /** 시작 몇 분 전에 알릴지 (예: 60 = 1시간 전) */
  reminders: number[]
  /** 이미 알림을 보낸 reminder(분) 목록 */
  notified: number[]
}

export const REMINDER_PRESETS: { minutes: number; label: string }[] = [
  { minutes: 10, label: '10분 전' },
  { minutes: 30, label: '30분 전' },
  { minutes: 60, label: '1시간 전' },
  { minutes: 180, label: '3시간 전' },
  { minutes: 1440, label: '24시간 전' },
]

export function reminderLabel(minutes: number): string {
  if (minutes === 0) return '시작 시각'
  if (minutes % 1440 === 0) return `${minutes / 1440 === 1 ? '24시간' : `${minutes / 1440}일`} 전`
  if (minutes % 60 === 0) return `${minutes / 60}시간 전`
  return `${minutes}분 전`
}
