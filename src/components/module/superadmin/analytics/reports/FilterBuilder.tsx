"use client";

import { useState } from "react";
import {
  ReportConfig,
  ReportFilter,
  FilterOperator,
  ENTITY_METADATA,
  FieldType,
} from "@/lib/actions/superadmin/analytics/reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

interface FilterBuilderProps {
  config: ReportConfig;
  onConfigChange: (config: ReportConfig) => void;
}

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: "Equals",
  not: "Not Equals",
  contains: "Contains",
  startsWith: "Starts With",
  endsWith: "Ends With",
  in: "In (comma separated)",
  notIn: "Not In (comma separated)",
  lt: "Less Than",
  lte: "Less Than or Equal",
  gt: "Greater Than",
  gte: "Greater Than or Equal",
  between: "Between",
};

const STRING_OPERATORS: FilterOperator[] = [
  "equals",
  "not",
  "contains",
  "startsWith",
  "endsWith",
  "in",
  "notIn",
];

const NUMBER_OPERATORS: FilterOperator[] = [
  "equals",
  "not",
  "lt",
  "lte",
  "gt",
  "gte",
  "between",
  "in",
];

const DATE_OPERATORS: FilterOperator[] = [
  "equals",
  "not",
  "lt",
  "lte",
  "gt",
  "gte",
  "between",
];

const BOOLEAN_OPERATORS: FilterOperator[] = ["equals"];

const ENUM_OPERATORS: FilterOperator[] = ["equals", "not", "in", "notIn"];

export function FilterBuilder({ config, onConfigChange }: FilterBuilderProps) {
  const [selectedField, setSelectedField] = useState<string>("");
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator>("equals");
  const [filterValue, setFilterValue] = useState<string>("");

  const getAvailableFields = () => {
    const fields: Array<{ label: string; value: string; type: FieldType; enumValues?: string[] }> = [];

    for (const entity of config.entities) {
      const entityFields = ENTITY_METADATA[entity] || [];
      for (const field of entityFields) {
        fields.push({
          label: `${entity}.${field.label}`,
          value: `${entity}.${field.name}`,
          type: field.type,
          enumValues: field.enumValues,
        });
      }
    }

    return fields;
  };

  const getOperatorsForField = (): FilterOperator[] => {
    if (!selectedField) return [];

    const field = getAvailableFields().find(f => f.value === selectedField);
    if (!field) return [];

    switch (field.type) {
      case "string":
        return STRING_OPERATORS;
      case "number":
        return NUMBER_OPERATORS;
      case "date":
        return DATE_OPERATORS;
      case "boolean":
        return BOOLEAN_OPERATORS;
      case "enum":
        return ENUM_OPERATORS;
      default:
        return ["equals"];
    }
  };

  const getFieldType = (): FieldType | null => {
    if (!selectedField) return null;
    const field = getAvailableFields().find(f => f.value === selectedField);
    return field?.type || null;
  };

  const getEnumValues = (): string[] | undefined => {
    if (!selectedField) return undefined;
    const field = getAvailableFields().find(f => f.value === selectedField);
    return field?.enumValues;
  };

  const handleAddFilter = () => {
    if (!selectedField || !filterValue) {
      alert("Please select a field and enter a value");
      return;
    }

    const fieldType = getFieldType();
    let processedValue: any = filterValue;

    // Process value based on type and operator
    if (selectedOperator === "in" || selectedOperator === "notIn") {
      processedValue = filterValue.split(",").map(v => v.trim());
    } else if (selectedOperator === "between") {
      const values = filterValue.split(",").map(v => v.trim());
      if (values.length !== 2) {
        alert("Between operator requires two values separated by comma");
        return;
      }
      processedValue = fieldType === "number" ? values.map(Number) : values;
    } else if (fieldType === "number") {
      processedValue = Number(filterValue);
    } else if (fieldType === "boolean") {
      processedValue = filterValue.toLowerCase() === "true";
    } else if (fieldType === "date") {
      processedValue = new Date(filterValue).toISOString();
    }

    const newFilter: ReportFilter = {
      field: selectedField,
      operator: selectedOperator,
      value: processedValue,
    };

    onConfigChange({
      ...config,
      filters: [...config.filters, newFilter],
    });

    // Reset
    setFilterValue("");
  };

  const handleRemoveFilter = (index: number) => {
    onConfigChange({
      ...config,
      filters: config.filters.filter((_, i) => i !== index),
    });
  };

  const renderValueInput = () => {
    const fieldType = getFieldType();
    const enumValues = getEnumValues();

    if (!fieldType) {
      return (
        <Input
          placeholder="Select a field first"
          disabled
        />
      );
    }

    // Enum field with dropdown
    if (fieldType === "enum" && enumValues && selectedOperator === "equals") {
      return (
        <Select value={filterValue} onValueChange={setFilterValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            {enumValues.map(value => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Boolean field
    if (fieldType === "boolean") {
      return (
        <Select value={filterValue} onValueChange={setFilterValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    // Date field
    if (fieldType === "date") {
      return (
        <Input
          type={selectedOperator === "between" ? "text" : "date"}
          value={filterValue}
          onChange={e => setFilterValue(e.target.value)}
          placeholder={selectedOperator === "between" ? "2025-01-01, 2025-12-31" : "Select date"}
        />
      );
    }

    // Number or string field
    const placeholder =
      selectedOperator === "in" || selectedOperator === "notIn"
        ? "value1, value2, value3"
        : selectedOperator === "between"
        ? "min, max"
        : "Enter value";

    return (
      <Input
        type={fieldType === "number" && selectedOperator !== "in" && selectedOperator !== "between" ? "number" : "text"}
        value={filterValue}
        onChange={e => setFilterValue(e.target.value)}
        placeholder={placeholder}
      />
    );
  };

  const availableFields = getAvailableFields();
  const operators = getOperatorsForField();

  return (
    <div className="space-y-4">
      {config.entities.length === 0 ? (
        <div className="text-sm text-muted-foreground border border-dashed rounded-md p-4 text-center">
          Please select fields first before adding filters.
        </div>
      ) : (
        <>
          {/* Filter Builder */}
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-4">
              <label className="text-sm font-medium mb-1.5 block">Field</label>
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map(field => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-3">
              <label className="text-sm font-medium mb-1.5 block">Operator</label>
              <Select
                value={selectedOperator}
                onValueChange={value => setSelectedOperator(value as FilterOperator)}
                disabled={!selectedField}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map(op => (
                    <SelectItem key={op} value={op}>
                      {OPERATOR_LABELS[op]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-4">
              <label className="text-sm font-medium mb-1.5 block">Value</label>
              {renderValueInput()}
            </div>

            <div className="col-span-1">
              <Button
                onClick={handleAddFilter}
                size="sm"
                disabled={!selectedField || !filterValue}
                className="w-full"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Active Filters ({config.filters.length})
            </label>
            {config.filters.length === 0 ? (
              <div className="text-sm text-muted-foreground border border-dashed rounded-md p-3 text-center">
                No filters applied. Report will include all records.
              </div>
            ) : (
              <div className="space-y-2">
                {config.filters.map((filter, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 border rounded-md bg-muted/50"
                  >
                    <div className="flex-1 text-sm">
                      <Badge variant="outline" className="mr-2">
                        {filter.field}
                      </Badge>
                      <span className="text-muted-foreground mr-2">
                        {OPERATOR_LABELS[filter.operator]}
                      </span>
                      <span className="font-medium">
                        {Array.isArray(filter.value)
                          ? filter.value.join(", ")
                          : String(filter.value)}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleRemoveFilter(index)}
                      size="sm"
                      variant="ghost"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
