"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { addPurchaseOrderLine } from "@/lib/actions/purchaseorderline";
import { getSuppliers, getMaterials } from "@/lib/actions/materials";

interface Supplier {
  id: string;
  name: string;
}

interface Material {
  id: string;
  name: string;
}

interface PurchaseOrderLine {
  materialId: string;
  quantity: number;
  unitPrice: number;
}

export default function PurchaseOrderForm() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [orderLines, setOrderLines] = useState<PurchaseOrderLine[]>([]);

  useEffect(() => {
    async function fetchData() {
      const [supplierData, materialData] = await Promise.all([
        getSuppliers(),
        getMaterials(),
      ]);
      setSuppliers(supplierData);
      setMaterials(materialData.map((item) => ({
        id: item.unitOfMeasure.id,
        name: item.unitOfMeasure.name,
      })));
    }
    fetchData();
  }, []);

  const addOrderLine = () => {
    setOrderLines([...orderLines, { materialId: "", quantity: 1, unitPrice: 0 }]);
  };

  const updateOrderLine = (index: number, key: keyof PurchaseOrderLine, value: any) => {
    const newOrderLines = [...orderLines];
    newOrderLines[index][key] = value;
    setOrderLines(newOrderLines);
  };

  const handleSubmit = async () => {
    await addPurchaseOrderLine({
      supplierId: selectedSupplier,
      orderLines,
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Create Purchase Order</h2>
      <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
        {suppliers.map((supplier) => (
          <SelectItem key={supplier.id} value={supplier.id}>
            {supplier.name}
          </SelectItem>
        ))}
      </Select>
      
      {orderLines.map((line, index) => (
        <div key={index} className="flex space-x-2">
          <Select value={line.materialId} onValueChange={(val) => updateOrderLine(index, "materialId", val)}>
            {materials.map((material) => (
              <SelectItem key={material.id} value={material.id}>{material.name}</SelectItem>
            ))}
          </Select>
          <Input type="number" value={line.quantity} onChange={(e) => updateOrderLine(index, "quantity", Number(e.target.value))} />
          <Input type="number" value={line.unitPrice} onChange={(e) => updateOrderLine(index, "unitPrice", Number(e.target.value))} />
        </div>
      ))}
      
      <Button onClick={addOrderLine}>Add Material</Button>
      <Button onClick={handleSubmit} className="bg-blue-500 text-white">Submit Order</Button>
    </div>
  );
}
