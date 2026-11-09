import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import './App.css'
import { REMINDER_PRESETS, reminderLabel, type CalendarEvent } from './types'
import { loadEvents, saveEvents } from './storage'
import { getPermission, requestPermission, sendNotification, type NotifyPermission } from './notify'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const CHECK_INTERVAL_MS = 15_000

function toInputDate(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

function describeLead(startMs: number, now: number): string {
  const mins = Math.max(0, Math.round((startMs - now) / 60000))
  if (mins < 60) return `${mins}분 후 시작`
  if (mins < 1440) return `${Math.round(mins / 60)}시간 후 시작`
  return `${Math.round(mins / 1440)}일 후 시작`
}

export default function App() {
  const [events, setEvents] = useState<CalendarEvent[]>(() => loadEvents())
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState(() => new Date())
  const [permission, setPermission] = useState<NotifyPermission>(() => getPermission())
  const [toasts, setToasts] = useState<{ id: string; text: string }[]>([])

  // 폼 상태
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => toInputDate(new Date()))
  const [time, setTime] = useState('09:00')
  const [reminders, setReminders] = useState<number[]>([60])
  const [custom, setCustom] = useState('')

  useEffect(() => saveEvents(events), [events])

  // 날짜 칸을 누르면 폼의 날짜도 같이 바뀐다
  useEffect(() => setDate(toInputDate(selected)), [selected])

  // 알림 스케줄러: 15초마다 "알릴 시각이 지났고 아직 안 보낸 알림"을 찾아 보낸다.
  const eventsRef = useRef(events)
  eventsRef.current = events
  // 같은 알림이 중복 발송되지 않도록 (개발 모드의 effect 이중 실행 등) 보낸 기록을 따로 가진다
  const firedRef = useRef(new Set<string>())
  useEffect(() => {
    const tick = () => {
      const now = Date.now()
      const fired: { id: string; text: string }[] = []
      const next = eventsRef.current.map((ev) => {
        const newlyNotified: number[] = []
        for (const m of ev.reminders) {
          if (ev.notified.includes(m)) continue
          const fireAt = ev.start - m * 60_000
          // 알릴 시각이 지났고, 일정이 이미 끝난 지 오래되지 않았다면 알림
          if (now >= fireAt && now < ev.start + 60 * 60_000) {
            newlyNotified.push(m)
            const key = `${ev.id}:${m}`
            if (firedRef.current.has(key)) continue
            firedRef.current.add(key)
            const body = `${ev.title} · ${format(ev.start, 'M월 d일 a h:mm', { locale: ko })} (${describeLead(ev.start, now)})`
            sendNotification(`⏰ ${reminderLabel(m)} 알림`, body)
            fired.push({ id: `${ev.id}-${m}-${now}`, text: `${reminderLabel(m)} · ${body}` })
          } else if (now >= ev.start + 60 * 60_000) {
            newlyNotified.push(m) // 너무 지난 알림은 조용히 처리 완료로 표시
          }
        }
        return newlyNotified.length ? { ...ev, notified: [...ev.notified, ...newlyNotified] } : ev
      })
      if (next.some((ev, i) => ev !== eventsRef.current[i])) setEvents(next)
      if (fired.length) setToasts((t) => [...t, ...fired])
    }
    tick()
    const id = setInterval(tick, CHECK_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(month),
        end: endOfWeek(endOfMonth(month)),
      }),
    [month],
  )

  const eventsOn = (d: Date) =>
    events.filter((e) => isSameDay(e.start, d)).sort((a, b) => a.start - b.start)

  const toggleReminder = (m: number) =>
    setReminders((r) => (r.includes(m) ? r.filter((x) => x !== m) : [...r, m].sort((a, b) => b - a)))

  const addCustom = () => {
    const n = Number(custom)
    if (!Number.isFinite(n) || n < 0 || n > 60 * 24 * 30) return
    const m = Math.round(n)
    if (!reminders.includes(m)) setReminders((r) => [...r, m].sort((a, b) => b - a))
    setCustom('')
  }

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date || !time) return
    const start = new Date(`${date}T${time}`).getTime()
    if (Number.isNaN(start)) return
    // 첫 일정 추가 때 알림 권한을 요청한다
    if (reminders.length && permission === 'default') setPermission(await requestPermission())
    const ev: CalendarEvent = {
      id: crypto.randomUUID(),
      title: title.trim(),
      start,
      reminders: [...reminders],
      // 이미 지나버린 알림 시각은 알림을 보내지 않도록 처리 완료로 표시
      notified: reminders.filter((m) => start - m * 60_000 < Date.now() && start < Date.now()),
    }
    setEvents((all) => [...all, ev])
    setTitle('')
    setSelected(new Date(start))
    setMonth(startOfMonth(new Date(start)))
  }

  const removeEvent = (id: string) => setEvents((all) => all.filter((e) => e.id !== id))

  const dayEvents = eventsOn(selected)

  return (
    <div className="app">
      <main className="calendar">
        <header className="cal-head">
          <button onClick={() => setMonth((m) => addMonths(m, -1))} aria-label="이전 달">‹</button>
          <h1>{format(month, 'yyyy년 M월', { locale: ko })}</h1>
          <button onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="다음 달">›</button>
          <button
            className="today"
            onClick={() => {
              setMonth(startOfMonth(new Date()))
              setSelected(new Date())
            }}
          >
            오늘
          </button>
        </header>
        <div className="grid weekdays">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={i === 0 ? 'sun' : i === 6 ? 'sat' : ''}>{w}</div>
          ))}
        </div>
        <div className="grid days">
          {days.map((d) => {
            const list = eventsOn(d)
            return (
              <button
                key={d.toISOString()}
                className={[
                  'day',
                  isSameMonth(d, month) ? '' : 'other',
                  isSameDay(d, new Date()) ? 'today' : '',
                  isSameDay(d, selected) ? 'selected' : '',
                ].join(' ')}
                onClick={() => setSelected(d)}
              >
                <span className="num">{format(d, 'd')}</span>
                {list.slice(0, 2).map((e) => (
                  <span key={e.id} className="chip">{e.title}</span>
                ))}
                {list.length > 2 && <span className="more">+{list.length - 2}</span>}
              </button>
            )
          })}
        </div>
      </main>

      <aside className="side">
        <h2>{format(selected, 'M월 d일 (E)', { locale: ko })}</h2>
        <ul className="events">
          {dayEvents.length === 0 && <li className="empty">일정이 없어요</li>}
          {dayEvents.map((e) => (
            <li key={e.id}>
              <div>
                <strong>{e.title}</strong>
                <span className="meta">
                  {format(e.start, 'a h:mm', { locale: ko })}
                  {e.reminders.length > 0 && ` · 🔔 ${e.reminders.map(reminderLabel).join(', ')}`}
                </span>
              </div>
              <button className="del" onClick={() => removeEvent(e.id)} aria-label="삭제">✕</button>
            </li>
          ))}
        </ul>

        <form onSubmit={addEvent} className="form">
          <h3>일정 추가</h3>
          <input placeholder="일정 제목" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div className="row">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </div>
          <div className="label">알림 (여러 개 선택 가능)</div>
          <div className="pills">
            {REMINDER_PRESETS.map((p) => (
              <button
                type="button"
                key={p.minutes}
                className={reminders.includes(p.minutes) ? 'pill on' : 'pill'}
                onClick={() => toggleReminder(p.minutes)}
              >
                {p.label}
              </button>
            ))}
            {reminders
              .filter((m) => !REMINDER_PRESETS.some((p) => p.minutes === m))
              .map((m) => (
                <button type="button" key={m} className="pill on" onClick={() => toggleReminder(m)}>
                  {reminderLabel(m)}
                </button>
              ))}
          </div>
          <div className="row">
            <input
              type="number"
              min={0}
              placeholder="직접 입력 (분 전)"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
            <button type="button" onClick={addCustom}>추가</button>
          </div>
          <button type="submit" className="primary">추가</button>
        </form>

        {permission !== 'granted' && (
          <p className="warn">
            {permission === 'denied'
              ? '알림이 차단돼 있어요. 시스템 설정에서 알림을 허용해 주세요. (그동안은 화면 안 배너로만 알려드려요)'
              : permission === 'unsupported'
                ? '이 환경은 시스템 알림을 지원하지 않아요. 화면 안 배너로 알려드려요.'
                : '일정을 추가하면 알림 권한을 물어볼 거예요.'}
          </p>
        )}
      </aside>

      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <span>⏰ {t.text}</span>
            <button onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}>닫기</button>
          </div>
        ))}
      </div>
    </div>
  )
}
