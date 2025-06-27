"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from "lucide-react"
import { NotificationData } from "@/types/inspector/inspector"


interface NotificationContainerProps {
  notifications: NotificationData[]
  onHideNotification: (id: string) => void
}

export function NotificationContainer({ notifications, onHideNotification }: NotificationContainerProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case "info":
        return <Info className="w-5 h-5 text-blue-600" />
      default:
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200"
      case "error":
        return "bg-red-50 border-red-200"
      case "warning":
        return "bg-yellow-50 border-yellow-200"
      case "info":
        return "bg-blue-50 border-blue-200"
      default:
        return "bg-blue-50 border-blue-200"
    }
  }

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`${getBackgroundColor(notification.type)} shadow-lg animate-in slide-in-from-right duration-300`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {getIcon(notification.type)}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm">{notification.title}</h4>
                <p className="text-gray-700 text-sm mt-1">{notification.message}</p>
                {notification.timestamp && (
                  <p className="text-xs text-gray-500 mt-1">{new Date(notification.timestamp).toLocaleTimeString()}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-500 hover:text-gray-700"
                onClick={() => notification.id && onHideNotification(notification.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
