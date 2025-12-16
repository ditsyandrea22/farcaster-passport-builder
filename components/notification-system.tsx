"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useFrame } from "@/providers/frame-provider"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  title: string
  body?: string
  icon?: string
  timestamp: number
  type?: "success" | "error" | "info" | "warning"
}

interface NotificationSystemProps {
  className?: string
  maxNotifications?: number
  autoHide?: boolean
  autoHideDelay?: number
}

export function NotificationSystem({ 
  className, 
  maxNotifications = 5,
  autoHide = true,
  autoHideDelay = 5000 
}: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isVisible, setIsVisible] = useState(true)
  const { showNotification, notifications: frameNotifications } = useFrame()

  // Listen for Frame notifications
  useEffect(() => {
    if (frameNotifications) {
      // This would be where you'd set up event listeners for Frame notifications
      console.log("Frame notifications available:", frameNotifications)
    }
  }, [frameNotifications])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    }

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, maxNotifications)
      return updated
    })

    // Auto-hide notification
    if (autoHide) {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, autoHideDelay)
    }

    // Also show Frame notification if available
    showNotification(notification)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case "success":
        return "✅"
      case "error":
        return "❌"
      case "warning":
        return "⚠️"
      case "info":
      default:
        return "ℹ️"
    }
  }

  const getNotificationColor = (type?: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800"
      case "error":
        return "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800"
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800"
      case "info":
      default:
        return "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800"
    }
  }

  // Expose addNotification function globally for easy access
  useEffect(() => {
    (window as any).addNotification = addNotification
    return () => {
      delete (window as any).addNotification
    }
  }, [])

  if (!isVisible || notifications.length === 0) {
    return null
  }

  return (
    <div className={cn("fixed top-4 right-4 z-50 space-y-2 max-w-sm", className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Notifications</h3>
        <div className="flex gap-1">
          <Badge variant="secondary" className="text-xs">
            {notifications.length}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllNotifications}
            className="h-6 w-6 p-0"
          >
            ✕
          </Button>
        </div>
      </div>

      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={cn(
            "p-3 backdrop-blur-md transition-all duration-300 hover:scale-105",
            getNotificationColor(notification.type)
          )}
        >
          <div className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0 mt-0.5">
              {notification.icon || getNotificationIcon(notification.type)}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold">{notification.title}</h4>
              {notification.body && (
                <p className="text-xs mt-1 opacity-90">{notification.body}</p>
              )}
              <p className="text-xs mt-1 opacity-60">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeNotification(notification.id)}
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              ✕
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}

// Hook for using notifications
export function useNotifications() {
  const addNotification = (notification: {
    title: string
    body?: string
    icon?: string
    type?: "success" | "error" | "info" | "warning"
  }) => {
    if (typeof window !== 'undefined' && (window as any).addNotification) {
      (window as any).addNotification(notification)
    }
  }

  const success = (title: string, body?: string) => {
    addNotification({ title, body, type: "success" })
  }

  const error = (title: string, body?: string) => {
    addNotification({ title, body, type: "error" })
  }

  const info = (title: string, body?: string) => {
    addNotification({ title, body, type: "info" })
  }

  const warning = (title: string, body?: string) => {
    addNotification({ title, body, type: "warning" })
  }

  return {
    addNotification,
    success,
    error,
    info,
    warning
  }
}