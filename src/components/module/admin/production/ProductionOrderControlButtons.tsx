import { Status } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Pause, CheckCircle, HelpCircle, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

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
    <Card className="bg-muted/10 border-none">
      <CardContent className="pt-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <Play className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-medium text-lg">Production Control</h3>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                      <HelpCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Status Guide</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Production Status Guide</h4>
                      <ul className="text-sm space-y-2">
                        <li className="flex gap-2 items-start">
                          <div className="min-w-4 min-h-4 rounded-full bg-gray-200 mt-1"></div>
                          <div>
                            <span className="font-medium block">Pending</span>
                            <span className="text-xs text-muted-foreground">Production order is created but not active. Workers cannot see tasks.</span>
                          </div>
                        </li>
                        <li className="flex gap-2 items-start">
                          <div className="min-w-4 min-h-4 rounded-full bg-blue-500 mt-1"></div>
                          <div>
                            <span className="font-medium block">In Progress</span>
                            <span className="text-xs text-muted-foreground">Production is active. All tasks are visible to workers.</span>
                          </div>
                        </li>
                        <li className="flex gap-2 items-start">
                          <div className="min-w-4 min-h-4 rounded-full bg-green-500 mt-1"></div>
                          <div>
                            <span className="font-medium block">Completed</span>
                            <span className="text-xs text-muted-foreground">All production work is finished. No further changes allowed.</span>
                          </div>
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
        
        <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    onClick={onStart}
                    disabled={updating || !canStartProduction}
                    className="bg-green-600 hover:bg-green-700 h-14 px-6 gap-2 rounded-xl"
                  >
                    {updating && canStartProduction ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                    <span className="font-medium">Start Production</span>
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
                    className="border-amber-500 text-amber-500 hover:bg-amber-50 h-14 px-6 gap-2 rounded-xl"
                  >
                    {updating && canPauseProduction ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Pause className="h-5 w-5" />
                    )}
                    <span className="font-medium">Pause</span>
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
                    className={`h-14 px-6 gap-2 rounded-xl ${nextStatus === Status.COMPLETED ? "bg-blue-600 hover:bg-blue-700" : "opacity-50"}`}
                  >
                    {updating ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-5 w-5" />
                    )}
                    <span className="font-medium">Complete</span>
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
          <div className="mt-4 flex items-center gap-2 justify-center sm:justify-start bg-amber-50 text-amber-700 border border-amber-200 rounded-md p-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p className="text-sm font-medium">
              Cannot start production: No Bill of Materials (BOM) is defined for this product.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 