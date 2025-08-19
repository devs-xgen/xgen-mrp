"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, Clock, Factory, Package, X } from "lucide-react";
import { toast } from "sonner";

interface FulfillmentNotification {
  id: string;
  type: "ALLOCATION" | "FULFILLMENT" | "COMPLETION" | "DELAY";
  title: string;
  message: string;
  orderNumber: string;
  productName: string;
  timestamp: Date;
  isRead: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH";
}

interface FulfillmentNotificationsProps {
  orderId?: string; // If provided, show notifications for specific order
  limit?: number;
}

export function FulfillmentNotifications({
  orderId,
  limit = 10,
}: FulfillmentNotificationsProps) {
  const [notifications, setNotifications] = useState<FulfillmentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration - in real implementation, this would come from API/WebSocket
  useEffect(() => {
    // Simulate loading notifications
    const mockNotifications: FulfillmentNotification[] = [
      {
        id: "1",
        type: "ALLOCATION",
        title: "Stock Allocated",
        message: "10 units of T-Shirt Blue M allocated from inventory",
        orderNumber: "CO-2024-001",
        productName: "T-Shirt Blue M",
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        isRead: false,
        priority: "MEDIUM",
      },
      {
        id: "2",
        type: "FULFILLMENT",
        title: "Production Completed",
        message: "15 units of Custom Jacket L completed by production",
        orderNumber: "CO-2024-002",
        productName: "Custom Jacket L",
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        isRead: false,
        priority: "HIGH",
      },
      {
        id: "3",
        type: "COMPLETION",
        title: "Order Fulfilled",
        message: "Order CO-2024-003 has been completely fulfilled",
        orderNumber: "CO-2024-003",
        productName: "Multi-item order",
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        isRead: true,
        priority: "HIGH",
      },
      {
        id: "4",
        type: "DELAY",
        title: "Fulfillment Delayed",
        message: "Production delay for Hoodie XL - material shortage",
        orderNumber: "CO-2024-004",
        productName: "Hoodie XL",
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        isRead: false,
        priority: "HIGH",
      },
    ];

    setNotifications(mockNotifications.slice(0, limit));
    setUnreadCount(mockNotifications.filter(n => !n.isRead).length);
    setIsLoading(false);
  }, [limit, orderId]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getNotificationIcon = (type: FulfillmentNotification["type"]) => {
    const icons = {
      ALLOCATION: <Package className="h-4 w-4 text-blue-600" />,
      FULFILLMENT: <Factory className="h-4 w-4 text-green-600" />,
      COMPLETION: <CheckCircle className="h-4 w-4 text-green-600" />,
      DELAY: <Clock className="h-4 w-4 text-red-600" />,
    };
    return icons[type];
  };

  const getPriorityBadge = (priority: FulfillmentNotification["priority"]) => {
    const variants = {
      LOW: { variant: "secondary" as const, className: "bg-gray-100 text-gray-800" },
      MEDIUM: { variant: "default" as const, className: "bg-blue-100 text-blue-800" },
      HIGH: { variant: "destructive" as const, className: "bg-red-100 text-red-800" },
    };
    return (
      <Badge variant={variants[priority].variant} className={`text-xs ${variants[priority].className}`}>
        {priority}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Fulfillment Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Fulfillment Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                You're all caught up! Fulfillment updates will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-colors ${
                  notification.isRead 
                    ? "bg-gray-50 border-gray-200" 
                    : "bg-white border-blue-200 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        {getPriorityBadge(notification.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Order: {notification.orderNumber}</span>
                        <span>•</span>
                        <span>{formatTimestamp(notification.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="h-8 w-8 p-0"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissNotification(notification.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for real-time notifications (would integrate with WebSocket in production)
export function useFulfillmentNotifications(orderId?: string) {
  const [notifications, setNotifications] = useState<FulfillmentNotification[]>([]);
  
  // In production, this would set up WebSocket connection or polling
  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      // Check for new fulfillment updates
      // This is where you'd call your API or listen to WebSocket events
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [orderId]);

  const addNotification = (notification: Omit<FulfillmentNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: FulfillmentNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      isRead: false,
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
    
    // Show toast notification
    toast.success(notification.title, {
      description: notification.message,
    });
  };

  return { notifications, addNotification };
}
