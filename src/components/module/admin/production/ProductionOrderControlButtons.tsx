import { Status } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Pause, CheckCircle, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import React from 'react';

interface ProductionOrderControlButtonsProps {
  order: any;
  updating: boolean;
  onStart: () => void;
  onPause: () => void;
  onComplete: () => void;
}

export const ProductionOrderControlButtons: React.FC<ProductionOrderControlButtonsProps> = ({
  order,
  updating,
  onStart,
  onPause,
  onComplete,
}) => {
  const hasBOM = order.bom && order.bom.entries && order.bom.entries.length > 0;
  const canStartProduction = order.status === Status.PENDING && hasBOM;
  const canPauseProduction = order.status === Status.IN_PROGRESS;
  const nextStatus = order.status === Status.PENDING ? Status.IN_PROGRESS : order.status === Status.IN_PROGRESS ? Status.COMPLETED : null;

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-muted-foreground">Production Control</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Production Status Guide</h4>
                    <ul className="text-sm space-y-1">
                      <li className="flex gap-2">
                        <span className="font-medium">Pending</span>: Production order is created but not active. Workers cannot see tasks.
                      </li>
                      <li className="flex gap-2">
                        <span className="font-medium">In Progress</span>: Production is active. All tasks are visible to workers.
                      </li>
                      <li className="flex gap-2">
                        <span className="font-medium">Completed</span>: All production work is finished. No further changes allowed.
                      </li>
                    </ul>
                  </div>
                </PopoverContent>
              </Popover>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click for production status guide</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex gap-4 justify-center">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  onClick={onStart}
                  disabled={updating || !canStartProduction}
                  className="bg-green-600 hover:bg-green-700 h-14 w-14 rounded-full"
                  size="icon"
                >
                  {updating && canStartProduction ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="w-64 p-3">
              <div className="space-y-2">
                <p className="font-medium">Start Production</p>
                <p className="text-sm">Activates the production order and makes all tasks visible to workers.</p>
                {!hasBOM && (
                  <p className="text-xs text-amber-600">Cannot start: No Bill of Materials (BOM) is defined for this product.</p>
                )}
                {!(!hasBOM) && !canStartProduction && (
                  <p className="text-xs text-amber-600">This order cannot be started in its current state.</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  onClick={onPause}
                  disabled={updating || !canPauseProduction}
                  variant="outline"
                  className="border-amber-500 text-amber-500 hover:bg-amber-50 h-14 w-14 rounded-full"
                  size="icon"
                >
                  {updating && canPauseProduction ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Pause className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="w-64 p-3">
              <div className="space-y-2">
                <p className="font-medium">Pause Production</p>
                <p className="text-sm">Temporarily pauses the production order and hides tasks from workers.</p>
                {!canPauseProduction && (
                  <p className="text-xs text-amber-600">This order cannot be paused in its current state.</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  variant="default"
                  onClick={onComplete}
                  disabled={updating || nextStatus !== Status.COMPLETED}
                  className={`h-14 w-14 rounded-full ${nextStatus === Status.COMPLETED ? "bg-blue-600 hover:bg-blue-700" : "opacity-50"}`}
                  size="icon"
                >
                  {updating ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <CheckCircle className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="w-64 p-3">
              <div className="space-y-2">
                <p className="font-medium">Complete Production</p>
                <p className="text-sm">Marks the production order as completed and finalizes all tasks.</p>
                {nextStatus !== Status.COMPLETED && (
                  <p className="text-xs text-amber-600">Production must be in progress before it can be completed.</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {/* Show warning if no BOM/material requirements */}
      {!hasBOM && (
        <div className="mt-3 text-center text-sm text-amber-600 font-semibold">
          Cannot start production: No Bill of Materials (BOM) is defined for this product.
        </div>
      )}
    </div>
  );
}; 