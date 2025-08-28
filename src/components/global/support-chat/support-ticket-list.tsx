"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  AlertTriangle 
} from "lucide-react";

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
  messages: any[];
}

interface SupportTicketListProps {
  tickets: SupportTicket[];
  searchTerm: string;
  selectedTicket: SupportTicket | null;
  onTicketSelect: (ticket: SupportTicket) => void;
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

export function SupportTicketList({
  tickets,
  searchTerm,
  selectedTicket,
  onTicketSelect,
  onTicketUpdate,
  isDeveloper,
}: SupportTicketListProps) {
  const getUserDisplayName = (user: any) => {
    if (user.profile?.firstName && user.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    return user.email.split("@")[0];
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
        onTicketUpdate(updatedTicket);
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
    }
  };

  // Filter tickets based on search term
  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getUserDisplayName(ticket.user).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {filteredTickets.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No support tickets found</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredTickets.map((ticket) => {
              const StatusIcon = statusIcons[ticket.status];
              const isSelected = selectedTicket?.id === ticket.id;
              
              return (
                <div
                  key={ticket.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                  }`}
                  onClick={() => onTicketSelect(ticket)}
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
                        <span>{getUserDisplayName(ticket.user)}</span>
                        <span>•</span>
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
                    
                    {isDeveloper && (
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
  );
}
