"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { PlayCircle, BookOpen, Info, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { name: "Live Lectures", icon: PlayCircle },
  { name: "Course Catalog", icon: BookOpen },
  { name: "About", icon: Info },
]

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const sidebarRef = useRef(null)

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
      className="w-72 min-h-screen border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="space-y-4 py-4">
        <div className="px-6 py-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">UCSD Classes</h2>
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
                    "w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-x-3",
                    "text-sm font-medium ring-offset-background",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive 
                      ? "bg-secondary text-secondary-foreground" 
                      : "text-muted-foreground hover:bg-secondary/80 hover:text-secondary-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-foreground" : "text-muted-foreground")} />
                  {tab.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
