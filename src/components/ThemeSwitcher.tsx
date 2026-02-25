
"use client"

import * as React from "react"
import { Palette } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeSwitcher() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Select Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("theme-orange-and-black")}>
          Orange &amp; Black
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("theme-yellow-and-blue")}>
          Yellow &amp; Blue
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("theme-gold-and-black")}>
          Gold &amp; Black
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("theme-pastel")}>
          Pastel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
