"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [form, setForm] = useState({
    status: "ACTIVE",
    defectsFound: "",
    actionTaken: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/inspector/update-status", {
      method: "POST",
      body: JSON.stringify({
        qualityCheckId: params.id,
        ...form,
        modifiedBy: "InspectorName", // Ideally from session
      }),
    });

    if (res.ok) {
      router.push("/inspector/task");
    } else {
      alert("Failed to update task.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Update Task #{params.id}</h1>
      <form onSubmit={handleSubmit} className="grid gap-4 max-w-lg">
        <label className="block">
          <span>Status</span>
          <select name="status" value={form.status} onChange={handleChange} className="w-full p-2 border rounded">
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </label>
        <label className="block">
          <span>Defects Found</span>
          <input
            name="defectsFound"
            value={form.defectsFound}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </label>
        <label className="block">
          <span>Action Taken</span>
          <input
            name="actionTaken"
            value={form.actionTaken}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </label>
        <label className="block">
          <span>Notes</span>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </label>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Update
        </button>
      </form>
    </div>
  );
}