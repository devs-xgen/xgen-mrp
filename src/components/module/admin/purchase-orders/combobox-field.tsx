// src/components/module/admin/purchase-orders/combobox-field.tsx
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useRouter } from "next/navigation"

interface ComboboxFieldProps {
  options: { id: string; name: string; code?: string }[]
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  emptyText: string
  createNewPath?: string
  className?: string
}

export function ComboboxField({
  options,
  value,
  onValueChange,
  placeholder,
  emptyText,
  createNewPath,
  className,
}: ComboboxFieldProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const router = useRouter()

  const filteredOptions = options.filter((option) => 
    option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.code?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value
            ? options.find((option) => option.id === value)?.name
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>
            <div className="py-6 text-center text-sm">
              <p>{emptyText}</p>
              {createNewPath && (
                <Button
                  variant="link"
                  className="mt-2 text-primary"
                  onClick={() => router.push(createNewPath)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create new entry
                </Button>
              )}
            </div>
          </CommandEmpty>
          <CommandGroup>
            {filteredOptions.map((option) => (
              <CommandItem
                key={option.id}
                value={option.id}
                onSelect={() => {
                  onValueChange(option.id)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.name}
                {option.code && (
                  <span className="ml-2 text-muted-foreground">
                    ({option.code})
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}