"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { gsap } from "gsap"
import ClassCard from "./ClassCard"

// This is a mock function. Replace it with actual Airtable API call.
async function fetchClasses(page: number, limit: number) {
  // Simulating API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  const startIndex = (page - 1) * limit
  return Array.from({ length: limit }, (_, i) => ({
    id: startIndex + i + 1,
    name: `Class ${startIndex + i + 1}`,
    instructor: `Instructor ${startIndex + i + 1}`,
    time: "10:00 AM - 11:30 AM",
    days: "Mon, Wed, Fri",
  }))
}

export default function ClassList() {
  const [classes, setClasses] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const observer = useRef()
  const listRef = useRef(null)

  const lastClassElementRef = useCallback(
    (node) => {
      if (loading) return
      if (observer.current) observer.current.disconnect()
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1)
        }
      })
      if (node) observer.current.observe(node)
    },
    [loading, hasMore],
  )

  useEffect(() => {
    setLoading(true)
    fetchClasses(page, 20).then((newClasses) => {
      setClasses((prevClasses) => [...prevClasses, ...newClasses])
      setLoading(false)
      setHasMore(newClasses.length > 0)
    })
  }, [page])

  useEffect(() => {
    if (!loading && listRef.current) {
      gsap.from(listRef.current.children, {
        opacity: 0,
        y: 20,
        stagger: 0.05,
        duration: 0.5,
        ease: "power3.out",
      })
    }
  }, [loading])

  return (
    <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {classes.map((classItem, index) => (
        <div key={classItem.id} ref={index === classes.length - 1 ? lastClassElementRef : null}>
          <ClassCard classItem={classItem} />
        </div>
      ))}
      {loading && <div className="col-span-full text-center text-2xl text-gray-600">Loading more classes...</div>}
    </div>
  )
}

