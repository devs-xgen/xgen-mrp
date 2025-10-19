"use client";

import { useState } from "react";
import {
  ReportConfig,
  ReportField,
  ENTITY_METADATA,
  EntityField,
} from "@/lib/actions/superadmin/analytics/reports";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ArrowUp, ArrowDown } from "lucide-react";

interface FieldSelectorProps {
  config: ReportConfig;
  onConfigChange: (config: ReportConfig) => void;
}

export function FieldSelector({ config, onConfigChange }: FieldSelectorProps) {
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [selectedField, setSelectedField] = useState<string>("");

  const availableEntities = Object.keys(ENTITY_METADATA);

  const handleAddField = () => {
    if (!selectedEntity || !selectedField) {
      alert("Please select both entity and field");
      return;
    }

    // Check if entity already exists, if not add it
    const newEntities = config.entities.includes(selectedEntity)
      ? config.entities
      : [...config.entities, selectedEntity];

    // Add field
    const newField: ReportField = {
      entity: selectedEntity,
      field: selectedField,
      alias: `${selectedEntity}.${selectedField}`,
    };

    // Check if field already exists
    const fieldExists = config.fields.some(
      f => f.entity === newField.entity && f.field === newField.field
    );

    if (fieldExists) {
      alert("This field is already selected");
      return;
    }

    // Add join if this is a new entity (not the primary entity)
    let newJoins = [...config.joins];
    if (config.entities.length > 0 && !config.entities.includes(selectedEntity)) {
      // Auto-detect join relationship
      const primaryEntity = config.entities[0];
      const joinPath = detectJoinPath(primaryEntity, selectedEntity);

      if (joinPath) {
        newJoins.push(joinPath);
      }
    }

    onConfigChange({
      ...config,
      entities: newEntities,
      fields: [...config.fields, newField],
      joins: newJoins,
    });

    // Reset selection
    setSelectedField("");
  };

  const handleRemoveField = (index: number) => {
    const newFields = config.fields.filter((_, i) => i !== index);
    const removedField = config.fields[index];

    // Check if this was the last field from this entity
    const entityStillUsed = newFields.some(f => f.entity === removedField.entity);

    const newConfig: ReportConfig = {
      ...config,
      fields: newFields,
    };

    // If entity is no longer used, remove it and its joins
    if (!entityStillUsed) {
      newConfig.entities = config.entities.filter(e => e !== removedField.entity);
      newConfig.joins = config.joins.filter(j => {
        const [fromEntity] = j.from.split(".");
        const [toEntity] = j.to.split(".");
        return toEntity !== removedField.entity;
      });
    }

    onConfigChange(newConfig);
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    const newFields = [...config.fields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newFields.length) return;

    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];

    onConfigChange({
      ...config,
      fields: newFields,
    });
  };

  const getAvailableFields = (): EntityField[] => {
    if (!selectedEntity) return [];
    return ENTITY_METADATA[selectedEntity] || [];
  };

  return (
    <div className="space-y-4">
      {/* Field Selector */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-sm font-medium mb-1.5 block">Entity</label>
          <Select value={selectedEntity} onValueChange={setSelectedEntity}>
            <SelectTrigger>
              <SelectValue placeholder="Select entity" />
            </SelectTrigger>
            <SelectContent>
              {availableEntities.map(entity => (
                <SelectItem key={entity} value={entity}>
                  {entity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium mb-1.5 block">Field</label>
          <Select
            value={selectedField}
            onValueChange={setSelectedField}
            disabled={!selectedEntity}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {getAvailableFields().map(field => (
                <SelectItem key={field.name} value={field.name}>
                  {field.label} ({field.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleAddField}
          size="sm"
          disabled={!selectedEntity || !selectedField}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>

      {/* Selected Fields List */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Selected Fields ({config.fields.length})
        </label>
        {config.fields.length === 0 ? (
          <div className="text-sm text-muted-foreground border border-dashed rounded-md p-4 text-center">
            No fields selected. Add fields to build your report.
          </div>
        ) : (
          <div className="space-y-2">
            {config.fields.map((field, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 border rounded-md bg-muted/50"
              >
                <div className="flex-1">
                  <Badge variant="outline" className="mr-2">
                    {field.entity}
                  </Badge>
                  <span className="text-sm">{field.field}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => handleMoveField(index, "up")}
                    size="sm"
                    variant="ghost"
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleMoveField(index, "down")}
                    size="sm"
                    variant="ghost"
                    disabled={index === config.fields.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleRemoveField(index)}
                    size="sm"
                    variant="ghost"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to auto-detect join paths between entities
function detectJoinPath(fromEntity: string, toEntity: string) {
  // Common join patterns in the MRP system
  const joinPatterns: Record<string, Record<string, { from: string; to: string }>> = {
    ProductionOrder: {
      Product: { from: "ProductionOrder.productId", to: "Product.id" },
      Customer: { from: "ProductionOrder.customerId", to: "Customer.id" },
      WorkCenter: { from: "ProductionOrder.workCenterId", to: "WorkCenter.id" },
    },
    CustomerOrder: {
      Customer: { from: "CustomerOrder.customerId", to: "Customer.id" },
    },
    Product: {
      Material: { from: "Product.id", to: "Material.productId" },
    },
    QualityCheck: {
      ProductionOrder: { from: "QualityCheck.productionOrderId", to: "ProductionOrder.id" },
      User: { from: "QualityCheck.inspectorId", to: "User.id" },
    },
    BillingStatement: {
      Customer: { from: "BillingStatement.customerId", to: "Customer.id" },
      ProductionOrder: { from: "BillingStatement.productionOrderId", to: "ProductionOrder.id" },
    },
  };

  return joinPatterns[fromEntity]?.[toEntity] || null;
}
