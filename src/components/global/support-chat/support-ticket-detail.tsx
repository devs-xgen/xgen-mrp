"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Send,
  User,
  Shield
} from "lucide-react";
import { toast } from "sonner";

interface SupportMessage {
  id: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
  user: {
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
    };
  };
}

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  user: {
    email: string;
    role: string;
    profile?: {
      firstName: string;
      lastName: string;
    };
  };
  messages: SupportMessage[];
}

interface SupportTicketDetailProps {
  ticket: SupportTicket;
  onTicketUpdate: (ticket: SupportTicket) => void;
  isDeveloper: boolean;
}

const statusColors = {
  OPEN: "bg-red-100 text-red-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
};

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

const statusIcons = {
  OPEN: AlertCircle,
  IN_PROGRESS: Clock,
  RESOLVED: CheckCircle,
  CLOSED: XCircle,
};

export function SupportTicketDetail({ ticket, onTicketUpdate, isDeveloper }: SupportTicketDetailProps) {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const StatusIcon = statusIcons[ticket.status];

  const getUserDisplayName = (user: any) => {
    if (user.profile?.firstName && user.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    return user.email.split("@")[0];
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const response = await fetch(`/api/support/tickets/${ticket.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: newMessage }),
      });

      if (response.ok) {
        const message = await response.json();
        const updatedTicket = {
          ...ticket,
          messages: [...ticket.messages, message],
        };
        onTicketUpdate(updatedTicket);
        setNewMessage("");
        toast.success("Message sent successfully");
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const updateTicketStatus = async (status: string, priority?: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, priority }),
      });

      if (response.ok) {
        const updatedTicket = await response.json();
        onTicketUpdate(updatedTicket);
        toast.success("Ticket updated successfully");
      } else {
        toast.error("Failed to update ticket");
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error("Failed to update ticket");
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{ticket.title}</CardTitle>
            <p className="text-gray-600 mt-1">
              Created by {getUserDisplayName(ticket.user)} ({ticket.user.role}) on{" "}
              {new Date(ticket.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className={priorityColors[ticket.priority]}>
              {ticket.priority}
            </Badge>
            <Badge className={statusColors[ticket.status]}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {ticket.status.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Admin Controls */}
        {isDeveloper && (
          <div className="flex gap-2 p-4 bg-blue-50 rounded-lg">
            <Select
              value={ticket.status}
              onValueChange={(value) => updateTicketStatus(value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={ticket.priority}
              onValueChange={(value) => updateTicketStatus(ticket.status, value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Description */}
        <div>
          <h4 className="font-semibold mb-2">Description</h4>
          <p className="text-gray-700 bg-gray-50 p-3 rounded">{ticket.description}</p>
        </div>

        {/* Messages */}
        <div>
          <h4 className="font-semibold mb-4">Conversation ({ticket.messages.length})</h4>
          <div className="space-y-4 max-h-64 overflow-y-auto mb-4">
            {ticket.messages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No messages yet</p>
            ) : (
              ticket.messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.isAdmin 
                      ? "bg-blue-50 border-l-4 border-blue-500 ml-4" 
                      : "bg-gray-50 mr-4"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {message.isAdmin ? (
                        <Shield className="w-4 h-4 text-blue-500" />
                      ) : (
                        <User className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="font-medium text-sm">
                        {getUserDisplayName(message.user)}
                      </span>
                      {message.isAdmin && (
                        <Badge variant="secondary" className="text-xs">
                          Developer
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(message.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{message.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* New Message */}
        <div className="space-y-4 border-t pt-4">
          <Label htmlFor="new-message">
            {isDeveloper ? "Developer Response" : "Your Message"}
          </Label>
          <Textarea
            id="new-message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isDeveloper ? "Type your response here..." : "Type your message here..."}
            rows={3}
            disabled={sending}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || sending}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
