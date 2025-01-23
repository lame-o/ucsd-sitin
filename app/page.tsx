'use client'

import { useState, useEffect } from "react"
import LectureList from "@/components/LectureList"
import Sidebar from "@/components/Sidebar"
import { fetchRecords } from "@/utils/airtable"
import Image from 'next/image'

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
            <div className="space-y-8 max-w-6xl">
              <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                <div>
                  <h1 className="text-4xl font-bold text-white">About UCSD Sit-In</h1>
                  <p className="text-gray-400 mt-2">Built by a fellow Triton in Warren 🐻 for literally educational purposes</p>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur rounded-lg p-10 space-y-10">
                <div className="space-y-4">
                  <p className="text-gray-300 text-lg leading-relaxed">
                    Hey there! 👋 As a UCSD student, I know how frustrating it can be when you miss a lecture or want to explore 
                    different classes. That's why I built UCSD-SitIn, to make it super easy to find and attend available lectures 
                    across campus. Whether you're trying to catch up on missed content, explore potential majors, or just learn 
                    something new, this tool helps you find the right lecture at the right time.
                  </p>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                    <span className="text-blue-400">📍</span> Quick Facts
                  </h2>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <li className="bg-gray-700/50 rounded-lg p-4 text-gray-300">
                      <span className="font-semibold text-blue-400">Winter 2024:</span> All data is current for this quarter
                    </li>
                    <li className="bg-gray-700/50 rounded-lg p-4 text-gray-300">
                      <span className="font-semibold text-blue-400">Lectures Only:</span> No discussions or labs included
                    </li>
                    <li className="bg-gray-700/50 rounded-lg p-4 text-gray-300">
                      <span className="font-semibold text-blue-400">Real-time Updates:</span> Live tracking of ongoing lectures
                    </li>
                    <li className="bg-gray-700/50 rounded-lg p-4 text-gray-300">
                      <span className="font-semibold text-blue-400">Seat Info:</span> Some classes show 0 seats due to WebReg typos
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                    <span className="text-blue-400">🎯</span> How to Use It
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex gap-6 items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-blue-400 mb-2">Live Lectures Tab</h3>
                          <ul className="list-disc list-inside space-y-2 text-gray-300">
                            <li>Shows currently ongoing lectures across campus</li>
                            <li>Filter by subject (e.g., CSE, MATH, PHIL)</li>
                            <li>Sort by time remaining or recently started</li>
                            <li>See room locations and remaining lecture time</li>
                          </ul>
                        </div>
                        <Image
                          src="/bearl.webp"
                          alt="Warren Bear"
                          width={125}
                          height={125}
                          className="rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-400 mb-2">Course Catalog Tab</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-300">
                        <li>Browse all available lectures for the quarter</li>
                        <li>Plan ahead for classes you want to check out</li>
                        <li>Find course details and room information</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                    <span className="text-blue-400">✨</span> Sit-In Etiquette
                  </h2>
                  <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-6 text-gray-300">
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Be respectful and quiet when entering/leaving mid-lecture</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Don't take seats from enrolled students, especially in smaller classes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Follow any instructions or preferences set by the professor</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Consider emailing the professor beforehand for regular sit-ins</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 text-sm">
                  <p className="text-gray-400 bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                    <span className="font-semibold text-blue-400">Note:</span> This tool is built by a student, for students, 
                    with education in mind. Always be respectful of class policies and professor preferences. Happy learning! 📚
                  </p>
                </div>
              </div>
            </div>
          ) : activeTab === "Technical" ? (
            <div className="space-y-8 max-w-6xl">
              <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                <div>
                  <h1 className="text-4xl font-bold text-white">Technical Details</h1>
                  <p className="text-gray-400 mt-2">How UCSD-SitIn Works</p>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur rounded-lg p-10 space-y-10">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                    <span className="text-blue-400">🌊</span> Where This Came From
                  </h2>
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <p className="text-gray-300 mb-4">
                      Hey! I'm <a href="https://github.com/lame-o" className="text-blue-400 hover:underline">@lame-o</a> and this app is built on top of my other project 
                      called <a href="https://github.com/lame-o/schedule-surfer" className="text-blue-400 hover:underline">Schedule Surfer</a>. I wrote it as a Node.js / Playwright scraper that pulls 
                      data from UCSD's schedule of classes and structures it in a way that's actually usable. The base config is set to pull all data (which is a lot) so use filters when needed.
                    </p>
                    <p className="text-gray-300 mb-4">
                      I've got the data flowing into this <a href="https://airtable.com/app16yB8bHox0EeCj/shrLJUoHNtlYwYf5X" className="text-blue-400 hover:underline">Airtable base</a> with 
                      some custom views and filters. Check the repo branches if you want to see how I'm querying different stuff.
                    </p>
                    <p className="text-gray-300">
                      UCSD-SitIn is basically a real-time interface for that data - it watches for active lectures and updates live. 
                      I built this config because I got tired of manually checking when Hip Hop was happening and I wanted to sit in lol
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                    <span className="text-blue-400">🚀</span> Future Ideas
                  </h2>
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <ul className="space-y-3 text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Add some map stuff so you can actually find the building and rooms</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Maybe add professor ratings</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                    <span className="text-blue-400">🛠️</span> Tech Stack
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700/50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-400 mb-3">Frontend Stuff</h3>
                      <ul className="space-y-2 text-gray-300">
                        <li>Next.js 13</li>
                        <li>TailwindCSS</li>
                        <li>HeadlessUI / Shadcn</li>
                        <li>TypeScript</li>
                      </ul>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-400 mb-3">Backend Stuff</h3>
                      <ul className="space-y-2 text-gray-300">
                        <li>Node.js</li>
                        <li>Airtable API</li>
                        <li>Schedule Surfer</li>
                        <li>WebSocket</li>
                      </ul>
                    </div>
                  </div>
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
