"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { InspectorsTask } from "@/types/inspector/task";

export function EnhancedTaskCard({ task }: { task: InspectorsTask }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [completedQty, setCompletedQty] = useState(task.completedQuantity || 0);
  const [workersToday, setWorkersToday] = useState(0);
  const [daysWorked, setDaysWorked] = useState(1);
  const [comment, setComment] = useState("");

  // UI only: handlers for increment/decrement
  const incrementQty = () => setCompletedQty(q => Math.min(q + 1, task.quantity || 0));
  const decrementQty = () => setCompletedQty(q => Math.max(q - 1, 0));
  const incrementWorkers = () => setWorkersToday(w => w + 1);
  const decrementWorkers = () => setWorkersToday(w => Math.max(w - 1, 0));
  const incrementDays = () => setDaysWorked(d => d + 1);
  const decrementDays = () => setDaysWorked(d => Math.max(d - 1, 1));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{task.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div>Status: {task.status}</div>
              <div>Quantity: {task.quantity}</div>
              <div>Completed: {completedQty}</div>
            </div>
            <Button onClick={() => setModalOpen(true)}>Edit Progress</Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Progress for {task.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Quantity Progress */}
            <div>
              <label className="font-medium">Completed Quantity</label>
              <div className="flex items-center gap-2 mt-1">
                <Button type="button" size="sm" onClick={decrementQty} disabled={completedQty <= 0}>-</Button>
                <span className="w-8 text-center">{completedQty}</span>
                <Button type="button" size="sm" onClick={incrementQty} disabled={completedQty >= (task.quantity || 0)}>+</Button>
                <span className="ml-2 text-muted-foreground">/ {task.quantity || 0}</span>
              </div>
            </div>

            {/* Workers Finished Today */}
            <div>
              <label className="font-medium">Workers Finished Today</label>
              <div className="flex items-center gap-2 mt-1">
                <Button type="button" size="sm" onClick={decrementWorkers} disabled={workersToday <= 0}>-</Button>
                <span className="w-8 text-center">{workersToday}</span>
                <Button type="button" size="sm" onClick={incrementWorkers}>+</Button>
              </div>
            </div>

            {/* Days Worked */}
            <div>
              <label className="font-medium">Days Worked</label>
              <div className="flex items-center gap-2 mt-1">
                <Button type="button" size="sm" onClick={decrementDays} disabled={daysWorked <= 1}>-</Button>
                <span className="w-8 text-center">{daysWorked}</span>
                <Button type="button" size="sm" onClick={incrementDays}>+</Button>
              </div>
            </div>

            {/* Comments/Notes */}
            {/* <div>
              <label className="font-medium">Add Comment / Notes</label>
              <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add your notes here..."
                className="min-h-[80px]"
              />
            </div> */}

            <div>
              <label className="font-medium block mb-2 text-sm text-gray-700">💬 Comments or Notes</label>
              <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Write any updates, blockers, or progress notes here..."
                className="min-h-[120px] rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-2 italic">Feel free to share any insights, challenges, or accomplishments during today’s task.</p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setModalOpen(false)}>Save (UI Only)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
