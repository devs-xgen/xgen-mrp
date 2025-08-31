"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EditableCustomerOrderPage({ params }) {
  const router = useRouter();
  const { id } = params;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      try {
        const res = await fetch(`/api/customer-orders/${id}`);
        if (!res.ok) throw new Error("Failed to load order");
        const data = await res.json();
        setOrder(data);
      } catch (error) {
        alert("Error loading order data.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setOrder((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setOrder((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleOrderLineChange = (lineId, field, value) => {
    setOrder((prev) => ({
      ...prev,
      orderLines: prev.orderLines.map((line) =>
        line.id === lineId ? { ...line, [field]: value } : line
      ),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/customer-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      if (!res.ok) throw new Error("Failed to save order");
      alert("Order saved successfully!");
      router.push(`/admin/customer-orders/${id}`);
    } catch {
      alert("Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!order) return <p>Order not found.</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow space-y-6">
      <h1 className="text-3xl font-bold mb-4">Edit Order: {order.orderNumber}</h1>

      <div>
        <h2 className="font-semibold mb-2">Customer</h2>
        <input
          type="text"
          name="customer.name"
          value={order.customer?.name || ""}
          onChange={handleInputChange}
          className="w-full p-2 border rounded mb-3"
          placeholder="Customer Name"
        />
        <input
          type="email"
          name="customer.email"
          value={order.customer?.email || ""}
          onChange={handleInputChange}
          className="w-full p-2 border rounded mb-3"
          placeholder="Email"
        />
      </div>

      <div>
        <h2 className="font-semibold mb-2">Order Details</h2>
        <input
          type="date"
          name="orderDate"
          value={order.orderDate?.slice(0, 10) || ""}
          onChange={handleInputChange}
          className="w-full p-2 border rounded mb-3"
        />
        <input
          type="date"
          name="requiredDate"
          value={order.requiredDate?.slice(0, 10) || ""}
          onChange={handleInputChange}
          className="w-full p-2 border rounded mb-3"
        />
        <textarea
          name="notes"
          value={order.notes || ""}
          onChange={handleInputChange}
          rows={4}
          className="w-full p-2 border rounded"
          placeholder="Notes"
        />
      </div>

      <div>
        <h2 className="font-semibold mb-2">Order Lines</h2>
        {order.orderLines?.map((line) => (
          <div key={line.id} className="border p-4 rounded mb-4">
            <p className="font-medium">{line.product?.name}</p>
            <input
              type="number"
              value={line.quantity}
              onChange={(e) =>
                handleOrderLineChange(line.id, "quantity", parseInt(e.target.value) || 0)
              }
              className="w-full p-2 border rounded mb-2"
              placeholder="Quantity"
            />
            <input
              type="number"
              step="0.01"
              value={line.unitPrice}
              onChange={(e) =>
                handleOrderLineChange(line.id, "unitPrice", parseFloat(e.target.value) || 0)
              }
              className="w-full p-2 border rounded"
              placeholder="Unit Price"
            />
          </div>
        ))}
      </div>

      <button
        disabled={saving}
        onClick={handleSave}
        className={`px-6 py-3 rounded text-white ${
          saving ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
