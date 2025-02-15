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

interface CustomerComboboxProps {
  customers: { id: string; name: string; email?: string }[]
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  emptyText: string
  createNewPath?: string
  className?: string
}

export function CustomerCombobox({  
  customers, // Set default value to an empty array  
  value,  
  onValueChange,  
  placeholder,  
  emptyText,  
  createNewPath,  
  className,  
}: CustomerComboboxProps) {  
  const [open, setOpen] = React.useState(false)  
  const [searchQuery, setSearchQuery] = React.useState("")  
  const router = useRouter()  

  const filteredCustomers = customers.filter((customer) =>   
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||  
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())  
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
            ? customers.find((customer) => customer.id === value)?.name
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
                  Create new customer
                </Button>
              )}
            </div>
          </CommandEmpty>
          <CommandGroup>
            {filteredCustomers.map((customer) => (
              <CommandItem
                key={customer.id}
                value={customer.id}
                onSelect={() => {
                  onValueChange(customer.id)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === customer.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {customer.name}
                {customer.email && (
                  <span className="ml-2 text-muted-foreground">
                    ({customer.email})
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
