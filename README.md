# 🎓 UCSD Sit-In

[![Next.js](https://img.shields.io/badge/Next.js-13.5-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel)](https://ucsd-sitin.vercel.app/)

> 🚀 A real-time lecture availability tracker for UCSD students. Find empty seats, discover interesting classes, and make the most of your academic journey!

## 🌐 Live Site

Visit [UCSD Sit-In](https://ucsd-sitin.vercel.app/) to start exploring lectures in real-time!

## ✨ Features

- 🔍 **Live Lecture Tracking**: See which lectures are happening right now across campus
- 📊 **Seat Availability**: Check if there's space to sit in on a lecture
- ⚡ **Quick Filters**: Find lectures by subject or time frame
- 🎯 **Upcoming Classes**: See what's starting soon
- 📚 **Course Details**: Get instant access to course descriptions and prerequisites
- 👩‍🏫 **Professor Info**: Know who's teaching each class
- 🏢 **Location Details**: Find your way with building and room information
- 🎨 **Modern Interface**: Clean, responsive design that works on all devices

## 💡 How to Use

1. **Live Lectures**
   - View all currently ongoing lectures
   - Filter by subject or sort by time remaining
   - Click on any course for detailed information

2. **Starting Soon**
   - Check lectures starting in the next 30 minutes, 1 hour, or 2 hours
   - Plan ahead and find your next interesting class

3. **Course Catalog**
   - Browse the complete course listing
   - Filter by subject and day of the week
   - Get detailed course descriptions and prerequisites

## 🔄 Updates

The site automatically refreshes to show the latest information:
- Live lecture status updates every minute
- Course information is always current
- No manual refresh needed

## 🛠️ How It Works

This application combines several modern technologies to provide real-time lecture information:

- **Frontend**: Built with Next.js 13 and TypeScript for a fast, type-safe experience
- **Styling**: Uses TailwindCSS and Shadcn/UI for a clean, modern interface
- **Data Storage**: Leverages Airtable as a flexible database for course information
- **Deployment**: Hosted on Vercel for reliable, global access

### 🗃️ Data Flow

1. **Course Information**
   - Course details, prerequisites, and descriptions are stored in Airtable
   - Data is fetched and cached for optimal performance
   - Updates automatically reflect when changes are made in Airtable

2. **Real-time Updates**
   - The app checks for active lectures every minute
   - Compares current time against lecture schedules
   - Automatically refreshes the display without user intervention

3. **Smart Filtering**
   - Client-side filtering for instant response
   - Maintains performance even with large datasets
   - Preserves state between refreshes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
Built with ❤️ for UCSD Students
