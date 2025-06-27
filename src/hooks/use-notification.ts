"use client"

import { NotificationData } from "@/types/inspector/inspector"
import { useState, useCallback } from "react"


export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])

  const showNotification = useCallback((notification: Omit<NotificationData, "id" | "timestamp">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const timestamp = new Date().toISOString()
    const newNotification: NotificationData = {
      ...notification,
      id,
      timestamp,
      duration: notification.duration || 5000,
    }

    setNotifications((prev) => [...prev, newNotification])

    // Auto-hide after duration
    setTimeout(() => {
      hideNotification(id)
    }, newNotification.duration)

    return id
  }, [])

  const hideNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Specific notification types
  const showSuccess = useCallback(
    (title: string, message: string, duration?: number) => {
      return showNotification({ title, message, type: "success", duration })
    },
    [showNotification],
  )

  const showError = useCallback(
    (title: string, message: string, duration?: number) => {
      return showNotification({ title, message, type: "error", duration })
    },
    [showNotification],
  )

  const showWarning = useCallback(
    (title: string, message: string, duration?: number) => {
      return showNotification({ title, message, type: "warning", duration })
    },
    [showNotification],
  )

  const showInfo = useCallback(
    (title: string, message: string, duration?: number) => {
      return showNotification({ title, message, type: "info", duration })
    },
    [showNotification],
  )

  return {
    notifications,
    showNotification,
    hideNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}
