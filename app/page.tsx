'use client'

import { useState, useEffect } from "react"
import LectureList from "@/components/LectureList"
import Sidebar from "@/components/Sidebar"
import { fetchRecords } from "@/utils/airtable"
import Image from 'next/image'
import Loader from '@/components/Loader'
import Chat from '@/components/Chat'
import { ChatProvider } from "./contexts/ChatContext"

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
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    const fetchClassesData = async () => {
      setLoading(true)
      const { records, error } = await fetchRecords()
      
      if (error) {
        console.error(error)
      } else {
        setClasses(records as ClassItem[])
      }
      
      setLoading(false)
    }

    fetchClassesData()
  }, [])

  const handleComponentReady = () => {
    if (isInitialLoad) {
      setIsInitialLoad(false)
    }
  }

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleTabChange = async () => {
      setIsInitialLoad(true)

      timeoutId = setTimeout(() => {
        setIsInitialLoad(false)
        setTimeout(() => {
        }, 300)
      }, 800)
    }

    handleTabChange()

    return () => {
      clearTimeout(timeoutId)
    }
  }, [activeTab])

  const handleTabClick = (tab: string) => {
    setIsInitialLoad(true)
    setActiveTab(tab)
  }

  return (
    <ChatProvider>
      <main className="flex min-h-screen bg-gray-900">
        <Sidebar activeTab={activeTab} setActiveTab={handleTabClick} />
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {(loading || isInitialLoad) && activeTab !== 'About' && activeTab !== 'Technical' && activeTab !== 'AI Assistant' ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader />
                <div className="text-gray-400 mt-4">Getting Ready!</div>
              </div>
            ) : (
              <>
                {activeTab === "About" ? (
                  <div className="max-w-5xl mx-auto space-y-8">
                    <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                      <div>
                        <h1 className="text-4xl font-bold text-white">About UCSD-SitIn</h1>
                        <p className="text-gray-400 mt-2">Built by a Triton 🐻 for educational purposes</p>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur rounded-lg p-10 space-y-10">
                      <div className="space-y-4">
                        <p className="text-gray-300 text-lg leading-relaxed">
                        <span className="bg-gradient-to-r from-yellow-400 to-blue-400 text-transparent bg-clip-text text-xl font-extrabold italic">THERE ARE A LOT OF COOL CLASSES AND SUBJECTS TO EXPLORE AT UCSD! TAKE ADVANTAGE!</span><br /><br />
                          As a UCSD student, I always wanted a way to explore
                          different classes and sit-in on subjects I never got the chance to with my major.<br /><br />
                          That&apos;s why I built UCSD-SitIn, to make it super easy to find and attend available lectures 
                          across campus. Whether you&apos;re trying to catch up on missed content, explore potential majors, or just learn 
                          something new, this tool helps you find the right lecture at the right time.<br /><br />
                        </p>
                      </div>

                      <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                          <span className="text-blue-400">📍</span> Quick Facts
                        </h2>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <li className="bg-gray-700/50 rounded-lg p-4 text-gray-300">
                            <span className="font-semibold text-blue-400">Winter 2025:</span> All data is current for this quarter
                          </li>
                          <li className="bg-gray-700/50 rounded-lg p-4 text-gray-300">
                            <span className="font-semibold text-blue-400">Lectures Only:</span> No discussions or labs included (see technical)
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
                              <li>Browse and search through all available lectures</li>
                              <li>View detailed course descriptions and prerequisites</li>
                              <li>Filter by subject, days, and time slots</li>
                            </ul>
                          </div>
                          <div className="bg-gray-700/50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-blue-400 mb-2">AI Course Assistant</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-300">
                              <li>Chat with our AI to get course recommendations</li>
                              <li>Ask questions about course content and prerequisites</li>
                              <li>Get help finding similar or related courses</li>
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
                              <span>Don&apos;t take seats from enrolled students, especially in smaller classes</span>
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
                ) : activeTab === "Live Lectures" ? (
                  <LectureList classes={classes} mode="live" onReady={handleComponentReady} />
                ) : activeTab === "Course Catalog" ? (
                  <LectureList classes={classes} mode="catalog" onReady={handleComponentReady} />
                ) : activeTab === "Technical" ? (
                  <div className="max-w-5xl mx-auto space-y-8">
                    <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                      <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-bold text-white">Technical Details</h1>
                        <a href="https://github.com/lame-o/ucsd-sitin" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-400 transition-colors">
                          <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                        </a>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur rounded-lg p-10 space-y-10">
                      <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                          <span className="text-blue-400">👇</span> Info
                        </h2>
                        <div className="bg-gray-700/50 rounded-lg p-6">
                          <p className="text-gray-300 mb-4">
                            This app is built on top of my other project 
                            called <a href="https://github.com/lame-o/schedule-surfer" className="text-blue-400 hover:underline">ScheduleSurfer</a>. I wrote it as a Node.js / Playwright scraper that pulls 
                            data from UCSD&apos;s schedule of classes and structures it in a way that&apos;s actually usable. The base config is set to pull all data (which is a lot) so use filters when needed.
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
                              <span>Integrate with ucsd map to help find building and rooms</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400">•</span>
                              <span>I might recreate Seascape (RIP) to connect professor & class ratings</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeTab === "AI Assistant" ? (
                  <Chat />
                ) : null}
              </>
            )}
          </div>
        </div>
      </main>
    </ChatProvider>
  )
}
