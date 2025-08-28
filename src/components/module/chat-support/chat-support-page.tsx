"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  MessageCircle, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  User,
  Shield,
  AlertTriangle
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

interface ChatSupportPageProps {
  isAdminView?: boolean;
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

export function ChatSupportPage({ isAdminView = false }: ChatSupportPageProps) {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  // New ticket form state
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as const,
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/support/tickets");
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = (user: any) => {
    if (user.profile?.firstName && user.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    return user.email.split("@")[0];
  };

  const createTicket = async () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTicket),
      });

      if (response.ok) {
        const ticket = await response.json();
        setTickets([ticket, ...tickets]);
        setNewTicket({ title: "", description: "", priority: "MEDIUM" });
        setShowCreateForm(false);
        toast.success("Support ticket created successfully");
      } else {
        toast.error("Failed to create ticket");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create ticket");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    setSending(true);
    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: newMessage }),
      });

      if (response.ok) {
        const message = await response.json();
        const updatedTicket = {
          ...selectedTicket,
          messages: [...selectedTicket.messages, message],
        };
        setSelectedTicket(updatedTicket);
        setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
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

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const updatedTicket = await response.json();
        setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
        if (selectedTicket?.id === updatedTicket.id) {
          setSelectedTicket(updatedTicket);
        }
        toast.success("Ticket updated successfully");
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error("Failed to update ticket");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading support tickets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {isAdminView ? "Support Management" : "Customer Support"}
            </h1>
            <p className="text-gray-600 mt-2">
              {isAdminView 
                ? "Manage all customer support tickets and conversations" 
                : "Get help and support for your questions"
              }
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Create Ticket Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Support Ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                placeholder="Brief description of your issue"
              />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="Detailed description of your issue"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={newTicket.priority}
                onValueChange={(value: any) => setNewTicket({ ...newTicket, priority: value })}
              >
                <SelectTrigger>
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
            <div className="flex gap-2">
              <Button onClick={createTicket}>Create Ticket</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>
                {isAdminView ? "All Tickets" : "Your Tickets"} ({tickets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No support tickets found</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {tickets.map((ticket) => {
                    const StatusIcon = statusIcons[ticket.status];
                    const isSelected = selectedTicket?.id === ticket.id;
                    
                    return (
                      <div
                        key={ticket.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm">{ticket.title}</h3>
                              {ticket.priority === "URGENT" && (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <p className="text-gray-600 text-xs mb-2 line-clamp-2">{ticket.description}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {isAdminView && (
                                <>
                                  <span>{getUserDisplayName(ticket.user)}</span>
                                  <span>•</span>
                                </>
                              )}
                              <span>{ticket.messages.length} messages</span>
                              <span>•</span>
                              <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2">
                            <Badge className={priorityColors[ticket.priority]} variant="secondary">
                              {ticket.priority}
                            </Badge>
                            <Badge className={statusColors[ticket.status]} variant="secondary">
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {ticket.status.replace("_", " ")}
                            </Badge>
                          </div>
                          
                          {isAdminView && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTicketStatus(ticket.id, "IN_PROGRESS");
                                }}
                                disabled={ticket.status === "IN_PROGRESS"}
                                className="text-xs px-2 py-1 h-6"
                              >
                                Take
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTicketStatus(ticket.id, "RESOLVED");
                                }}
                                disabled={ticket.status === "RESOLVED" || ticket.status === "CLOSED"}
                                className="text-xs px-2 py-1 h-6"
                              >
                                Resolve
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{selectedTicket.title}</CardTitle>
                    <p className="text-gray-600 mt-1">
                      {isAdminView && (
                        <>Created by {getUserDisplayName(selectedTicket.user)} ({selectedTicket.user.role}) on </>
                      )}
                      {new Date(selectedTicket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={priorityColors[selectedTicket.priority]}>
                      {selectedTicket.priority}
                    </Badge>
                    <Badge className={statusColors[selectedTicket.status]}>
                      {selectedTicket.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-gray-700 p-3 border rounded">{selectedTicket.description}</p>
                </div>

                {/* Messages */}
                <div>
                  <h4 className="font-semibold mb-4">Conversation ({selectedTicket.messages.length})</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto mb-4 p-4">
                    {selectedTicket.messages.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No messages yet</p>
                    ) : (
                      selectedTicket.messages.map((message) => {
                        const isCurrentUser = message.user.email === session?.user?.email;
                        const isFromCurrentUser = isCurrentUser;
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                                isFromCurrentUser
                                  ? message.isAdmin
                                    ? "bg-green-500 text-white rounded-br-md"
                                    : "bg-blue-500 text-white rounded-br-md"
                                  : message.isAdmin
                                  ? "bg-white border-2 border-green-200 text-gray-800 rounded-bl-md shadow-sm"
                                  : "bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm"
                              }`}
                            >
                              {/* Message header - only show for non-current user messages */}
                              {!isFromCurrentUser && (
                                <div className="flex items-center gap-2 mb-2">
                                  {message.isAdmin ? (
                                    <Shield className="w-4 h-4 text-blue-500" />
                                  ) : (
                                    <User className="w-4 h-4 text-gray-500" />
                                  )}
                                  <span className="font-medium text-sm">
                                    {getUserDisplayName(message.user)}
                                  </span>
                                  {message.isAdmin && (
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                      Support
                                    </Badge>
                                  )}
                                </div>
                              )}
                              
                              {/* Message content */}
                              <p className={`text-sm leading-relaxed ${isFromCurrentUser ? 'text-white' : 'text-gray-700'}`}>
                                {message.message}
                              </p>
                              
                              {/* Timestamp */}
                              <div className={`text-xs mt-2 ${
                                isFromCurrentUser 
                                  ? 'text-blue-100 text-right' 
                                  : 'text-gray-500'
                              }`}>
                                {new Date(message.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Message Input */}
                <div className="space-y-4 border-t pt-4">
                  <Label htmlFor="new-message">
                    {isAdminView ? "Support Response" : "Your Message"}
                  </Label>
                  <div className="flex gap-2">
                    <Textarea
                      id="new-message"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={isAdminView ? "Type your response here..." : "Type your message here..."}
                      rows={3}
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim() || sending}
                      className="self-end"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Select a ticket to view the conversation</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
