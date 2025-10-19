"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Bell, Plus, Trash2, Edit, Loader2 } from "lucide-react";
import {
  AlertRuleData,
  AlertRuleInput,
  AVAILABLE_METRICS,
  ALERT_CHANNELS,
} from "@/lib/actions/superadmin/alerts";

interface AlertRulesManagerProps {
  rules: AlertRuleData[];
  onRefresh: () => Promise<void>;
}

export function AlertRulesManager({ rules, onRefresh }: AlertRulesManagerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRuleData | null>(null);
  const [formData, setFormData] = useState<AlertRuleInput>({
    name: "",
    description: "",
    condition: {
      metric: "errorRate",
      operator: ">",
      threshold: 5,
      duration: 300,
    },
    enabled: true,
    channels: [],
    recipients: [],
  });
  const [recipientsText, setRecipientsText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingRule(null);
    setFormData({
      name: "",
      description: "",
      condition: {
        metric: "errorRate",
        operator: ">",
        threshold: 5,
        duration: 300,
      },
      enabled: true,
      channels: [],
      recipients: [],
    });
    setRecipientsText("");
    setShowDialog(true);
  };

  const handleEdit = (rule: AlertRuleData) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      condition: rule.condition,
      enabled: rule.enabled,
      channels: rule.channels,
      recipients: rule.recipients,
    });
    setRecipientsText(rule.recipients.join(", "));
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Please enter a rule name");
      return;
    }

    if (formData.channels.length === 0) {
      alert("Please select at least one alert channel");
      return;
    }

    const recipients = recipientsText
      .split(",")
      .map(r => r.trim())
      .filter(r => r.length > 0);

    if (recipients.length === 0) {
      alert("Please enter at least one recipient");
      return;
    }

    setIsSaving(true);
    try {
      const { createAlertRule, updateAlertRule } = await import("@/lib/actions/superadmin/alerts");

      const input: AlertRuleInput = {
        ...formData,
        recipients,
      };

      if (editingRule) {
        const result = await updateAlertRule(editingRule.id, input);
        if (!result.success) {
          throw new Error(result.error);
        }
      } else {
        const result = await createAlertRule(input);
        if (!result.success) {
          throw new Error(result.error);
        }
      }

      setShowDialog(false);
      await onRefresh();
    } catch (error) {
      console.error("Error saving alert rule:", error);
      alert(error instanceof Error ? error.message : "Failed to save alert rule");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this alert rule?")) {
      return;
    }

    setDeletingId(ruleId);
    try {
      const { deleteAlertRule } = await import("@/lib/actions/superadmin/alerts");
      const result = await deleteAlertRule(ruleId);

      if (!result.success) {
        throw new Error(result.error);
      }

      await onRefresh();
    } catch (error) {
      console.error("Error deleting alert rule:", error);
      alert("Failed to delete alert rule");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (ruleId: string, enabled: boolean) => {
    try {
      const { toggleAlertRule } = await import("@/lib/actions/superadmin/alerts");
      const result = await toggleAlertRule(ruleId, enabled);

      if (!result.success) {
        throw new Error(result.error);
      }

      await onRefresh();
    } catch (error) {
      console.error("Error toggling alert rule:", error);
      alert("Failed to toggle alert rule");
    }
  };

  const toggleChannel = (channel: string) => {
    if (formData.channels.includes(channel)) {
      setFormData({
        ...formData,
        channels: formData.channels.filter(c => c !== channel),
      });
    } else {
      setFormData({
        ...formData,
        channels: [...formData.channels, channel],
      });
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Alert Rules</h3>
          </div>
          <Button onClick={handleCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        </div>

        {rules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No Alert Rules Configured</p>
            <p className="text-sm mt-1">Create rules to get notified of system issues</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map(rule => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        {rule.description && (
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Badge variant="outline">{rule.condition.metric}</Badge>
                        <span>{rule.condition.operator}</span>
                        <span className="font-medium">{rule.condition.threshold}</span>
                        <span className="text-muted-foreground">
                          ({rule.condition.duration}s)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {rule.channels.map(channel => (
                          <Badge key={channel} variant="secondary" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={checked => handleToggle(rule.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(rule)}
                          size="sm"
                          variant="outline"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(rule.id)}
                          size="sm"
                          variant="outline"
                          disabled={deletingId === rule.id}
                        >
                          {deletingId === rule.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      {showDialog && (
        <Dialog open onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRule ? "Edit Alert Rule" : "Create Alert Rule"}</DialogTitle>
              <DialogDescription>
                Configure when and how you want to be alerted
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Rule Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., High Error Rate Alert"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="metric">Metric *</Label>
                  <Select
                    value={formData.condition.metric}
                    onValueChange={value =>
                      setFormData({
                        ...formData,
                        condition: { ...formData.condition, metric: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_METRICS.map(metric => (
                        <SelectItem key={metric.value} value={metric.value}>
                          {metric.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operator">Operator *</Label>
                  <Select
                    value={formData.condition.operator}
                    onValueChange={value =>
                      setFormData({
                        ...formData,
                        condition: { ...formData.condition, operator: value as any },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=">">Greater Than (&gt;)</SelectItem>
                      <SelectItem value="<">Less Than (&lt;)</SelectItem>
                      <SelectItem value=">=">Greater Than or Equal (&gt;=)</SelectItem>
                      <SelectItem value="<=">Less Than or Equal (&lt;=)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="threshold">Threshold *</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={formData.condition.threshold}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        condition: { ...formData.condition, threshold: Number(e.target.value) },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (seconds) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.condition.duration}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        condition: { ...formData.condition, duration: Number(e.target.value) },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Alert Channels *</Label>
                <div className="flex flex-wrap gap-3">
                  {ALERT_CHANNELS.map(channel => (
                    <div key={channel.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={channel.value}
                        checked={formData.channels.includes(channel.value)}
                        onChange={() => toggleChannel(channel.value)}
                        className="rounded"
                      />
                      <label htmlFor={channel.value} className="text-sm">
                        {channel.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipients">Recipients * (comma-separated)</Label>
                <Textarea
                  id="recipients"
                  value={recipientsText}
                  onChange={e => setRecipientsText(e.target.value)}
                  placeholder="email@example.com, another@example.com, webhook-url, phone-number"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Enter email addresses, Slack webhook URLs, or phone numbers depending on selected channels
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={enabled => setFormData({ ...formData, enabled })}
                />
                <Label htmlFor="enabled">Enable this rule</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{editingRule ? "Update" : "Create"} Rule</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
