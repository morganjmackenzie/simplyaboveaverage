"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SimpleDropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function SimpleDropdown({ trigger, children, className }: SimpleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={cn(
            "absolute left-0 top-full mt-1 z-50 min-w-[200px] rounded-md border bg-background p-2 shadow-md",
            className,
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function SimpleDropdownTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Button variant="outline" size="sm" className={cn("flex items-center gap-1 h-8", className)}>
      {children}
      <ChevronDown className="h-4 w-4" />
    </Button>
  )
}
