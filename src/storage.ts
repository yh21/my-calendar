import type { CalendarEvent } from './types'

const KEY = 'my-calendar:events:v1'

export function loadEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as CalendarEvent[]) : []
  } catch {
    return []
  }
}

export function saveEvents(events: CalendarEvent[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(events))
  } catch {
    // 저장 실패는 무시 (시크릿 모드 등)
  }
}
