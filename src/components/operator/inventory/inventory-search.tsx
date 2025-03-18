"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export function InventorySearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(currentSearch);

  const handleSearch = () => {
    startTransition(() => {
      // Create new URLSearchParams
      const params = new URLSearchParams(searchParams);

      // Set or remove search parameter
      if (searchTerm) {
        params.set("search", searchTerm);
      } else {
        params.delete("search");
      }

      // Update URL with new search params
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const clearSearch = () => {
    setSearchTerm("");
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.delete("search");
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex w-full items-center space-x-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search inventory..."
          className="pl-8 pr-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button onClick={handleSearch} disabled={isPending}>
        Search
      </Button>
    </div>
  );
}
