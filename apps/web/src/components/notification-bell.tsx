"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { BellIcon, CheckIcon, RefreshCwIcon } from "lucide-react"

import { parseJson, ApiClientError } from "@/lib/api/shared"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useMe } from "@/components/layout/use-me"

interface NotificationItem {
  id: string; type: string; title: string; message: string
  level: string; link: string | null; isRead: boolean; createdAt: string
}

export function NotificationBell() {
  const { me } = useMe()
  const userId = me?.id
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications?userId=${userId}&limit=10`)
      if (!res.ok) return
      const json = await parseJson<{ data: NotificationItem[]; unreadCount: number }>(res)
      setNotifications(json.data)
      setUnreadCount(json.unreadCount ?? 0)
    } catch {} finally { setLoading(false) }
  }, [userId])

  useEffect(() => {
    fetchNotifications()
    // Poll every 30s
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const markAllRead = async () => {
    if (!userId) return
    try {
      // mark-all: передаём реальный userId в теле; id в пути игнорируется роутом.
      await fetch(`/api/notifications/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true, userId }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {}
  }

  const levelColor = (level: string): string => {
    switch (level) {
      case 'error': return 'border-red-500'
      case 'warning': return 'border-yellow-500'
      case 'success': return 'border-green-500'
      default: return 'border-blue-500'
    }
  }

  const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'только что'
    if (mins < 60) return `${mins} мин назад`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} ч назад`
    return `${Math.floor(hours / 24)} дн назад`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => { setOpen(!open); if (!open) fetchNotifications() }}
      >
        <BellIcon className="size-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-[10px] rounded-full"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-3 border-b">
            <span className="font-medium text-sm">Уведомления</span>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
                <CheckIcon className="size-3 mr-1" /> Прочитать все
              </Button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading && notifications.length === 0 && (
              <div className="flex justify-center py-8"><RefreshCwIcon className="size-4 animate-spin text-muted-foreground" /></div>
            )}

            {!loading && notifications.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Нет уведомлений</p>
            )}

            {notifications.map(n => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-3 border-l-2 ${n.isRead ? 'border-transparent' : levelColor(n.level)} hover:bg-muted/50 cursor-pointer transition-colors ${!n.isRead ? 'bg-muted/20' : ''}`}
                onClick={() => {
                  if (!n.isRead) markAsRead(n.id)
                  if (n.link) window.open(n.link, '_self')
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{n.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{n.message}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.createdAt)} · {n.type}</div>
                </div>
                {!n.isRead && <div className="size-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
