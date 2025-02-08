"use client"

import { useEffect, useState, useRef } from "react"
import { gsap } from "gsap"
import { cn } from "@/lib/utils"

interface WordRotateProps {
  words: string[]
  duration?: number
  className?: string
}

export function WordRotate({
  words,
  duration = 5000,
  className,
}: WordRotateProps) {
  const [index, setIndex] = useState(0)
  const elementRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      if (elementRef.current) {
        gsap.to(elementRef.current, {
          opacity: 0,
          y: 50,
          duration: 0.25,
          ease: "power2.out",
          onComplete: () => {
            setIndex((prevIndex) => (prevIndex + 1) % words.length)
            gsap.fromTo(elementRef.current!,
              { opacity: 0, y: -50 },
              { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }
            )
          }
        })
      }
    }, duration)

    return () => clearInterval(interval)
  }, [words, duration])

  return (
    <div className="overflow-hidden py-2">
      <h1 
        ref={elementRef} 
        className={cn(className)}
        dangerouslySetInnerHTML={{ __html: words[index] }}
      />
    </div>
  )
}