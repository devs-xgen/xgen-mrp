"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  CheckCircle2,
  Settings,
  CheckSquare,
  Truck,
  Zap,
  Clock,
  Eye,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getUserNotifications, markNotificationAsRead } from "@/lib/actions/notifications";
import type { WorkflowNotification } from "@/lib/actions/notifications";
import { useRouter } from "next/navigation";

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<WorkflowNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Load notifications when component mounts or popover opens
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const [allNotifications, unreadNotifications] = await Promise.all([
        getUserNotifications(10, false),
        getUserNotifications(50, true),
      ]);
      
      setNotifications(allNotifications);
      setUnreadCount(unreadNotifications.length);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notification: WorkflowNotification) => {
    try {
      // Mark as read if unread
      if (!notification.isRead) {
        await markNotificationAsRead(notification.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id 
              ? { ...n, isRead: true }
              : n
          )
        );
      }

      // Navigate to relevant page
      if (notification.metadata?.actionUrl) {
        router.push(notification.metadata.actionUrl);
        setOpen(false);
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      await Promise.all(
        unreadNotifications.map(n => markNotificationAsRead(n.id))
      );
      
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'WORK_CENTERS_COMPLETED':
        return <Settings className="h-4 w-4 text-blue-600" />;
      case 'INSPECTIONS_COMPLETED':
        return <CheckSquare className="h-4 w-4 text-green-600" />;
      case 'DELIVERY_READY':
        return <Truck className="h-4 w-4 text-purple-600" />;
      case 'PRODUCTION_STARTED':
        return <Zap className="h-4 w-4 text-orange-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'destructive';
      case 'MEDIUM':
        return 'default';
      case 'LOW':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Workflow Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-1 p-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-accent/50 ${
                        !notification.isRead ? 'bg-accent/20 border border-primary/20' : 'hover:bg-accent/30'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium leading-tight">
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1">
                              <Badge 
                                variant={getPriorityColor(notification.priority) as any}
                                className="text-xs"
                              >
                                {notification.priority}
                              </Badge>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-primary rounded-full" />
                              )}
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(notification.createdAt)}
                            </span>
                            
                            {notification.metadata?.actionRequired && (
                              <div className="flex items-center gap-1 text-xs text-primary">
                                <Eye className="h-3 w-3" />
                                Action needed
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            {notifications.length > 0 && (
              <div className="border-t px-4 py-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    router.push('/notifications');
                    setOpen(false);
                  }}
                >
                  View All Notifications
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}; 