# 🎓 UCSD Sit-In

[![Next.js](https://img.shields.io/badge/Next.js-13.5-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel)](https://vercel.com)

> 🚀 A real-time lecture availability tracker for UCSD students. Find empty seats, discover interesting classes, and make the most of your academic journey!

## ✨ Features

- 🔍 **Live Lecture Tracking**: Real-time updates of ongoing lectures across campus
- 📚 **Course Catalog**: Comprehensive view of all available courses
- ⚡ **Smart Filtering**: Quick subject and time-based filtering
- 🎯 **Precise Timing**: Accurate PST time tracking for lecture schedules
- 🏢 **Location Info**: Building and room details at your fingertips
- 👩‍🏫 **Professor Details**: Know who's teaching before you sit in
- 🎨 **Modern UI**: Clean, responsive design that works on all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 13 with App Router
- **Styling**: TailwindCSS + Shadcn/UI
- **Database**: Airtable
- **Deployment**: Vercel
- **Language**: TypeScript
- **State Management**: React Hooks

## 🚀 Getting Started

1. **Clone and Install**
   ```bash
   git clone https://github.com/your-username/ucsd-sitin.git
   cd ucsd-sitin
   npm install
   ```

2. **Set Up Environment**
   ```bash
   cp .env.example .env.local
   # Add your Airtable API keys and other environment variables
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Visit [http://localhost:3000](http://localhost:3000) 🎉

## 🔑 Environment Variables

```env
NEXT_PUBLIC_AIRTABLE_API_KEY=your_api_key
NEXT_PUBLIC_AIRTABLE_BASE_ID_Courses=your_base_id
NEXT_PUBLIC_AIRTABLE_BASE_ID_Sections=your_base_id
NEXT_PUBLIC_AIRTABLE_TABLE_NAME_Courses=your_table_name
NEXT_PUBLIC_AIRTABLE_TABLE_NAME_Sections=your_table_name
```

## 🤝 Contributing

We love contributions! Whether it's bug fixes, new features, or documentation improvements:

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
