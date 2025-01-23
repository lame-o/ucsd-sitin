'use client'

import { useState, useEffect } from "react"
import LectureList from "@/components/LectureList"
import Sidebar from "@/components/Sidebar"
import { fetchRecords } from "@/utils/airtable"

interface ClassItem {
  id: string
  courseId: string
  courseCode: string
  courseName: string
  professor: string
  building: string
  room: string
  capacity: number
  time: string
  days: string
  meetingType: string
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("Live Lectures")
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isChangingTab, setIsChangingTab] = useState(false)
  const [isComponentReady, setIsComponentReady] = useState(false)

  useEffect(() => {
    const fetchClassesData = async () => {
      setLoading(true)
      const { records, error } = await fetchRecords()
      
      if (error) {
        setError(error)
      } else {
        setClasses(records as ClassItem[])
      }
      
      setLoading(false)
    }

    fetchClassesData()
  }, [])

  // Handle tab changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleTabChange = async () => {
      setIsChangingTab(true)
      setIsComponentReady(false)

      // Add a longer delay for tab changes
      timeoutId = setTimeout(() => {
        setIsComponentReady(true)
        // Keep loading for a bit after component is ready to ensure smooth transition
        setTimeout(() => {
          setIsChangingTab(false)
        }, 300)
      }, 800)
    }

    handleTabChange()

    return () => {
      clearTimeout(timeoutId)
    }
  }, [activeTab])

  const handleTabClick = (tab: string) => {
    setIsChangingTab(true)
    setIsComponentReady(false)
    setActiveTab(tab)
  }

  return (
    <main className="flex min-h-screen bg-gray-900">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabClick} />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-400">Loading lectures...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900/50 text-red-400 p-4 rounded-lg">
              Error: {error}
            </div>
          ) : isChangingTab || !isComponentReady ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>
            </div>
          ) : activeTab === "About" ? (
            <div className="space-y-8 max-w-3xl">
              <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                <div>
                  <h1 className="text-4xl font-bold text-blue-400">About UCSD Sit-In</h1>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-8 space-y-6">
                <p className="text-gray-300 text-lg leading-relaxed">
                  UCSD Sit-In is a tool designed to help students find and attend available lectures at UC San Diego. 
                  Whether you&apos;re looking to explore new subjects, catch up on missed content, or simply learn something new, 
                  this platform makes it easy to discover open lectures across campus.
                </p>

                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-100">How It Works</h2>
                  <ul className="list-disc list-inside space-y-3 text-gray-300">
                    <li>View live lectures happening right now</li>
                    <li>See upcoming lectures starting soon</li>
                    <li>Browse the complete course catalog</li>
                    <li>Find classroom locations and available seats</li>
                    <li>Track remaining time for ongoing lectures</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-100">Guidelines</h2>
                  <ul className="list-disc list-inside space-y-3 text-gray-300">
                    <li>Be respectful of the professor and other students</li>
                    <li>Enter and exit quietly if joining mid-lecture</li>
                    <li>Don&apos;t disrupt the class or take seats from enrolled students</li>
                    <li>Follow any additional instructions from the professor</li>
                  </ul>
                </div>

                <div className="mt-8 text-sm text-gray-400">
                  <p>
                    Note: This tool is intended for educational purposes. Always respect class policies and professor preferences regarding sit-ins.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <LectureList 
              classes={classes} 
              mode={activeTab === "Course Catalog" ? "catalog" : "live"}
              onReady={() => setIsComponentReady(true)}
            />
          )}
        </div>
      </div>
    </main>
  )
}
