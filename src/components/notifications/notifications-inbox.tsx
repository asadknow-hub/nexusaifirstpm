'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Check, CheckCheck, Trash2, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Notification {
  id: string
  title: string
  message_html: string
  message_stripped: string | null
  entity_name: string
  sender: string | null
  read_at: string | null
  archived_at: string | null
  created_at: string
  triggered_by?: {
    display_name: string
  }
}

export default function NotificationsInbox() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  async function fetchNotifications() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) return

    let query = supabase
      .from('notifications')
      .select(`
        *,
        triggered_by:profiles (display_name)
      `)
      .eq('receiver_id', profile.id)
      .order('created_at', { ascending: false })

    if (filter === 'unread') {
      query = query.is('read_at', null)
    } else if (filter === 'archived') {
      query = query.not('archived_at', 'is', null)
    } else {
      query = query.is('archived_at', null)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
    } else {
      setNotifications(data || [])
    }
    setLoading(false)
  }

  async function markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking as read:', error)
    } else {
      fetchNotifications()
    }
  }

  async function markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) return

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('receiver_id', profile.id)
      .is('read_at', null)

    if (error) {
      console.error('Error marking all as read:', error)
    } else {
      fetchNotifications()
    }
  }

  async function archiveNotification(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) {
      console.error('Error archiving:', error)
    } else {
      fetchNotifications()
    }
  }

  async function deleteNotification(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      console.error('Error deleting:', error)
    } else {
      fetchNotifications()
    }
  }

  function getTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 w-full bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.read_at).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notifications
          </h2>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="mt-1">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 border-b">
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Unread
        </Button>
        <Button
          variant={filter === 'archived' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('archived')}
        >
          Archived
        </Button>
      </div>

      {/* Notifications list */}
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-sm">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border transition-all ${
                !notification.read_at ? 'bg-blue-50/50 border-blue-200' : 'bg-card'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{notification.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {notification.entity_name}
                    </Badge>
                    {!notification.read_at && (
                      <Badge variant="default" className="text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                  <div
                    className="text-sm text-muted-foreground mb-2"
                    dangerouslySetInnerHTML={{ __html: notification.message_html }}
                  />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{getTimeAgo(notification.created_at)}</span>
                    {notification.triggered_by?.display_name && (
                      <>
                        <span>•</span>
                        <span>by {notification.triggered_by.display_name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!notification.read_at && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => markAsRead(notification.id)}
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  {!notification.archived_at && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => archiveNotification(notification.id)}
                      title="Archive"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteNotification(notification.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
