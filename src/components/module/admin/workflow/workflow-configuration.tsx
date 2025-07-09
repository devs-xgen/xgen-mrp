"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Info,
  Clock,
  Shield,
  Zap
} from 'lucide-react';

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  ruleType: 'DEPENDENCY' | 'VALIDATION' | 'NOTIFICATION' | 'AUTOMATION';
  isActive: boolean;
  priority: number;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  metadata: any;
}

interface WorkflowCondition {
  type: 'WORK_CENTER_COMPLETION' | 'INSPECTION_COMPLETION' | 'TIME_BASED' | 'ROLE_BASED' | 'CUSTOM';
  operator: 'EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'NOT_EQUALS';
  value: any;
  field: string;
  description: string;
}

interface WorkflowAction {
  type: 'BLOCK_TRANSITION' | 'ALLOW_TRANSITION' | 'SEND_NOTIFICATION' | 'CREATE_TASK' | 'LOG_EVENT';
  target: string;
  parameters: any;
  description: string;
}

interface WorkflowConfiguration {
  id: string;
  name: string;
  description: string;
  isGlobal: boolean;
  workCenterRules: WorkflowRule[];
  inspectionRules: WorkflowRule[];
  deliveryRules: WorkflowRule[];
  notificationRules: WorkflowRule[];
  overrideRules: WorkflowRule[];
  isActive: boolean;
  version: string;
  effectiveDate: Date;
  expiryDate?: Date;
}

export default function WorkflowConfiguration() {
  const [config, setConfig] = useState<WorkflowConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null);

  // Load configuration on component mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would call the API
      // const response = await fetch('/api/workflow/configuration');
      // const config = await response.json();
      
      // Mock data for now
      const mockConfig: WorkflowConfiguration = {
        id: 'default-config',
        name: 'Standard Production Workflow',
        description: 'Default sequential workflow: Work Centers → Inspection → Delivery',
        isGlobal: true,
        workCenterRules: [
          {
            id: 'wc-1',
            name: 'Sequential Work Center Completion',
            description: 'All work center operations must be completed before inspections',
            ruleType: 'DEPENDENCY',
            isActive: true,
            priority: 1,
            conditions: [
              {
                type: 'WORK_CENTER_COMPLETION',
                operator: 'EQUALS',
                value: '100',
                field: 'completionPercentage',
                description: 'Work centers must be 100% complete'
              }
            ],
            actions: [
              {
                type: 'ALLOW_TRANSITION',
                target: 'INSPECTION_PHASE',
                parameters: { enableInspections: true },
                description: 'Enable inspection phase'
              }
            ],
            metadata: { enforceStrict: true, allowOverride: true }
          }
        ],
        inspectionRules: [
          {
            id: 'insp-1',
            name: 'Inspection Dependency Validation',
            description: 'Block inspections until work centers complete',
            ruleType: 'VALIDATION',
            isActive: true,
            priority: 1,
            conditions: [
              {
                type: 'WORK_CENTER_COMPLETION',
                operator: 'LESS_THAN',
                value: '100',
                field: 'completionPercentage',
                description: 'Work centers incomplete'
              }
            ],
            actions: [
              {
                type: 'BLOCK_TRANSITION',
                target: 'INSPECTION_START',
                parameters: { errorMessage: 'Work centers must be complete first' },
                description: 'Block inspection start'
              }
            ],
            metadata: { blockingCondition: true }
          }
        ],
        deliveryRules: [
          {
            id: 'del-1',
            name: 'Delivery Dependency Validation',
            description: 'Block delivery until inspections complete',
            ruleType: 'VALIDATION',
            isActive: true,
            priority: 1,
            conditions: [
              {
                type: 'INSPECTION_COMPLETION',
                operator: 'LESS_THAN',
                value: '100',
                field: 'completionPercentage',
                description: 'Inspections incomplete'
              }
            ],
            actions: [
              {
                type: 'BLOCK_TRANSITION',
                target: 'DELIVERY_START',
                parameters: { errorMessage: 'Inspections must be complete first' },
                description: 'Block delivery start'
              }
            ],
            metadata: { allowEmergencyOverride: true }
          }
        ],
        notificationRules: [],
        overrideRules: [],
        isActive: true,
        version: '1.0.0',
        effectiveDate: new Date()
      };
      
      setConfig(mockConfig);
    } catch (error) {
      console.error('Error loading configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!config) return;
    
    try {
      setIsSaving(true);
      // Validate configuration
      const validation = validateConfiguration(config);
      setValidationErrors(validation.errors);
      setValidationWarnings(validation.warnings);
      
      if (validation.errors.length > 0) {
        return;
      }
      
      // In a real implementation, this would call the API
      // await fetch('/api/workflow/configuration', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(config)
      // });
      
      console.log('Configuration saved:', config);
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const validateConfiguration = (config: WorkflowConfiguration) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!config.name?.trim()) {
      errors.push('Configuration name is required');
    }
    
    // Validate rules
    const allRules = [
      ...config.workCenterRules,
      ...config.inspectionRules, 
      ...config.deliveryRules
    ];
    
    allRules.forEach((rule, index) => {
      if (!rule.name?.trim()) {
        errors.push(`Rule ${index + 1}: Name is required`);
      }
      if (rule.conditions.length === 0) {
        errors.push(`Rule ${rule.name}: At least one condition is required`);
      }
      if (rule.actions.length === 0) {
        errors.push(`Rule ${rule.name}: At least one action is required`);
      }
    });
    
    return { errors, warnings };
  };

  const addRule = (ruleType: 'workCenter' | 'inspection' | 'delivery') => {
    setEditingRule({
      id: '',
      name: '',
      description: '',
      ruleType: ruleType === 'workCenter' ? 'DEPENDENCY' : 'VALIDATION',
      isActive: true,
      priority: 1,
      conditions: [],
      actions: [],
      metadata: {}
    });
    setIsRuleDialogOpen(true);
  };

  const editRule = (rule: WorkflowRule) => {
    setEditingRule({ ...rule });
    setIsRuleDialogOpen(true);
  };

  const saveRule = () => {
    if (!editingRule || !config) return;
    
    const newRule = {
      ...editingRule,
      id: editingRule.id || `rule-${Date.now()}`
    };
    
    const updatedConfig = { ...config };
    
    // Determine which rule array to update
    let targetArray: WorkflowRule[];
    if (newRule.ruleType === 'DEPENDENCY') {
      targetArray = updatedConfig.workCenterRules;
    } else if (newRule.ruleType === 'VALIDATION') {
      if (newRule.name.toLowerCase().includes('inspection')) {
        targetArray = updatedConfig.inspectionRules;
      } else {
        targetArray = updatedConfig.deliveryRules;
      }
    } else {
      targetArray = updatedConfig.notificationRules;
    }
    
    // Update or add rule
    const existingIndex = targetArray.findIndex(r => r.id === newRule.id);
    if (existingIndex >= 0) {
      targetArray[existingIndex] = newRule;
    } else {
      targetArray.push(newRule);
    }
    
    setConfig(updatedConfig);
    setIsRuleDialogOpen(false);
    setEditingRule(null);
  };

  const deleteRule = (ruleId: string, ruleType: 'workCenter' | 'inspection' | 'delivery') => {
    if (!config) return;
    
    const updatedConfig = { ...config };
    
    if (ruleType === 'workCenter') {
      updatedConfig.workCenterRules = updatedConfig.workCenterRules.filter(r => r.id !== ruleId);
    } else if (ruleType === 'inspection') {
      updatedConfig.inspectionRules = updatedConfig.inspectionRules.filter(r => r.id !== ruleId);
    } else if (ruleType === 'delivery') {
      updatedConfig.deliveryRules = updatedConfig.deliveryRules.filter(r => r.id !== ruleId);
    }
    
    setConfig(updatedConfig);
  };

  const toggleRule = (ruleId: string, ruleType: 'workCenter' | 'inspection' | 'delivery') => {
    if (!config) return;
    
    const updatedConfig = { ...config };
    let targetArray: WorkflowRule[];
    
    if (ruleType === 'workCenter') {
      targetArray = updatedConfig.workCenterRules;
    } else if (ruleType === 'inspection') {
      targetArray = updatedConfig.inspectionRules;
    } else {
      targetArray = updatedConfig.deliveryRules;
    }
    
    const rule = targetArray.find(r => r.id === ruleId);
    if (rule) {
      rule.isActive = !rule.isActive;
      setConfig(updatedConfig);
    }
  };

  const getRuleTypeIcon = (ruleType: string) => {
    switch (ruleType) {
      case 'DEPENDENCY': return <Clock className="h-4 w-4" />;
      case 'VALIDATION': return <Shield className="h-4 w-4" />;
      case 'NOTIFICATION': return <Info className="h-4 w-4" />;
      case 'AUTOMATION': return <Zap className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getRuleTypeColor = (ruleType: string) => {
    switch (ruleType) {
      case 'DEPENDENCY': return 'bg-blue-100 text-blue-800';
      case 'VALIDATION': return 'bg-red-100 text-red-800';
      case 'NOTIFICATION': return 'bg-green-100 text-green-800';
      case 'AUTOMATION': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading workflow configuration...</span>
      </div>
    );
  }

  if (!config) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load workflow configuration. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Configuration</h1>
          <p className="text-muted-foreground">
            Customize workflow rules and dependencies for production orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadConfiguration} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={saveConfiguration} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      {/* Validation Alerts */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold">Configuration Errors:</div>
            <ul className="list-disc list-inside mt-2">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validationWarnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold">Configuration Warnings:</div>
            <ul className="list-disc list-inside mt-2">
              {validationWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workCenter">Work Centers</TabsTrigger>
          <TabsTrigger value="inspection">Inspections</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Overview</CardTitle>
              <CardDescription>
                Current workflow configuration status and summary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {config.workCenterRules.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Work Center Rules</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {config.inspectionRules.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Inspection Rules</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {config.deliveryRules.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Delivery Rules</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {config.notificationRules.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Notification Rules</div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Configuration Name:</span>
                  <span className="font-semibold">{config.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Version:</span>
                  <Badge variant="outline">{config.version}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={config.isActive ? 'default' : 'secondary'}>
                    {config.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Effective Date:</span>
                  <span>{new Date(config.effectiveDate).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Center Rules Tab */}
        <TabsContent value="workCenter" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Work Center Rules</CardTitle>
                  <CardDescription>
                    Rules governing work center operations and transitions
                  </CardDescription>
                </div>
                <Button onClick={() => addRule('workCenter')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {config.workCenterRules.map((rule) => (
                  <div key={rule.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getRuleTypeColor(rule.ruleType)}>
                          {getRuleTypeIcon(rule.ruleType)}
                          <span className="ml-1">{rule.ruleType}</span>
                        </Badge>
                        <h3 className="font-semibold">{rule.name}</h3>
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => toggleRule(rule.id, 'workCenter')}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => editRule(rule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deleteRule(rule.id, 'workCenter')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                    <div className="text-xs space-y-1">
                      <div>Priority: {rule.priority}</div>
                      <div>Conditions: {rule.conditions.length}</div>
                      <div>Actions: {rule.actions.length}</div>
                    </div>
                  </div>
                ))}
                {config.workCenterRules.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No work center rules configured. Click "Add Rule" to create one.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Similar tabs for inspection and delivery would follow the same pattern */}
        <TabsContent value="inspection" className="space-y-4">
          {/* Inspection rules content - similar structure to work center */}
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          {/* Delivery rules content - similar structure to work center */}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Settings</CardTitle>
              <CardDescription>
                Global settings for workflow configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="config-name">Configuration Name</Label>
                  <Input
                    id="config-name"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="config-version">Version</Label>
                  <Input
                    id="config-version"
                    value={config.version}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="config-description">Description</Label>
                <Textarea
                  id="config-description"
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="config-active"
                  checked={config.isActive}
                  onCheckedChange={(checked) => setConfig({ ...config, isActive: checked })}
                />
                <Label htmlFor="config-active">Configuration Active</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="config-global"
                  checked={config.isGlobal}
                  onCheckedChange={(checked) => setConfig({ ...config, isGlobal: checked })}
                />
                <Label htmlFor="config-global">Apply Globally</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rule Edit Dialog */}
      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRule?.id ? 'Edit Rule' : 'Create New Rule'}
            </DialogTitle>
            <DialogDescription>
              Configure rule conditions and actions for workflow validation
            </DialogDescription>
          </DialogHeader>
          {editingRule && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input
                    id="rule-name"
                    value={editingRule.name}
                    onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule-type">Rule Type</Label>
                  <Select
                    value={editingRule.ruleType}
                    onValueChange={(value) => setEditingRule({ 
                      ...editingRule, 
                      ruleType: value as any 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEPENDENCY">Dependency</SelectItem>
                      <SelectItem value="VALIDATION">Validation</SelectItem>
                      <SelectItem value="NOTIFICATION">Notification</SelectItem>
                      <SelectItem value="AUTOMATION">Automation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rule-description">Description</Label>
                <Textarea
                  id="rule-description"
                  value={editingRule.description}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  rows={2}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveRule}>
                  Save Rule
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 