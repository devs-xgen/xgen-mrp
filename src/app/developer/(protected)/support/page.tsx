"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupportTicketList } from "@/components/global/support-chat/support-ticket-list";
import { SupportTicketDetail } from "@/components/global/support-chat/support-ticket-detail";
import { SupportStats } from "@/components/global/support-chat/support-stats";
import { SupportFilters } from "@/components/global/support-chat/support-filters";
import { AlertTriangle } from "lucide-react";

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

export default function DeveloperSupportPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Check if user is developer
  const isDeveloper = session?.user?.role === "DEVELOPER";

  useEffect(() => {
    if (isDeveloper) {
      fetchTickets();
    }
  }, [statusFilter, priorityFilter, isDeveloper]);

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);

      const response = await fetch(`/api/support/tickets?${params.toString()}`);
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

  const handleTicketUpdate = (updatedTicket: SupportTicket) => {
    setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    if (selectedTicket?.id === updatedTicket.id) {
      setSelectedTicket(updatedTicket);
    }
  };

  const handleTicketSelect = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
  };

  if (!isDeveloper) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p className="text-red-600">Access denied. Developer privileges required.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold">Developer Support Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage all customer support tickets and conversations</p>
      </div>

      {/* Statistics */}
      <SupportStats tickets={tickets} />

      {/* Filters */}
      <SupportFilters
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        searchTerm={searchTerm}
        onStatusFilterChange={setStatusFilter}
        onPriorityFilterChange={setPriorityFilter}
        onSearchChange={setSearchTerm}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1">
          <SupportTicketList
            tickets={tickets}
            searchTerm={searchTerm}
            selectedTicket={selectedTicket}
            onTicketSelect={handleTicketSelect}
            onTicketUpdate={handleTicketUpdate}
            isDeveloper={true}
          />
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <SupportTicketDetail
              ticket={selectedTicket}
              onTicketUpdate={handleTicketUpdate}
              isDeveloper={true}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <p className="text-gray-600">Select a ticket to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
