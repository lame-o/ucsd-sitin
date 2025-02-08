"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { Library, Info, Cog, ChevronLeft, BotMessageSquare, Tv } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from 'next/image';

const tabs = [
  { name: "Live Lectures", icon: Tv },
  { name: "Course Catalog", icon: Library },
  { name: "AI Assistant", icon: BotMessageSquare },
  { name: "About", icon: Info },
  { name: "Technical", icon: Cog },
]

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const sidebarRef = useRef(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    gsap.from(sidebarRef.current, {
      x: -50,
      opacity: 0,
      duration: 0.5,
      ease: "power3.out",
    })
  }, [])

  return (
    <aside 
      ref={sidebarRef} 
      className={cn(
        "relative min-h-screen border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-72 lg:w-56"
      )}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "absolute -right-3 top-6 z-50",
          "h-6 w-6 rounded-full border bg-background shadow-md",
          "flex items-center justify-center",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "transition-transform duration-300",
          isCollapsed && "rotate-180"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="space-y-4 py-4">
        <div className={cn("px-6 py-2", isCollapsed && "px-4")}>
          <div className="flex items-center gap-2">
            <Image
              src="/trident.webp"
              alt="Trident"
              width={24}
              height={24}
              className="text-primary"
            />
            {!isCollapsed && (
              <h2 className="text-lg font-semibold tracking-tight">UCSD-SitIn</h2>
            )}
          </div>
        </div>
        <div className="px-3">
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.name
              return (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={cn(
                    "w-full text-left rounded-lg transition-colors flex items-center gap-x-3",
                    "text-sm font-medium ring-offset-background",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50",
                    "hover:bg-accent hover:text-accent-foreground",
                    isCollapsed ? "px-3 py-2 justify-center" : "px-4 py-2",
                    isActive 
                      ? "bg-secondary text-secondary-foreground" 
                      : "text-muted-foreground hover:bg-secondary/80 hover:text-secondary-foreground"
                  )}
                  title={isCollapsed ? tab.name : undefined}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-foreground" : "text-muted-foreground")} />
                  {!isCollapsed && tab.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
