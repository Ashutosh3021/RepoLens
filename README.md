# RepoLens

*Because reading other people's code is overrated, let an AI do it instead.*

A modern, dark-themed web application for AI-powered GitHub repository analysis. Built with Next.js 14, Tailwind CSS, and shadcn/ui. We're not saying you'll never have to read documentation again, but... actually, that's exactly what we're saying.

![RepoLens](https://img.shields.io/badge/RepoLens-AI%20Powered-00e5ff)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4)

---

## ✨ Features

- **AI Explanation**: Get instant, natural language explanations of any codebase (finally, someone who can explain what that 10,000 line file actually does)
- **Repository Scoring**: Multi-dimensional /10 scoring across 6 key areas - because nothing says "I have opinions" like a arbitrary number
- **Mermaid Diagrams**: Auto-generated architecture and workflow visualizations - pretty pictures for when words aren't enough
- **README Generator**: AI-powered README creation with live markdown preview - now with 100% less "I'll write it later" syndrome
- **Chat with Repository**: Ask questions and get contextual answers about the code - it's like having a developer who actually responds to your questions
- **Deployment Guides**: Step-by-step deployment instructions for multiple platforms - so you can finally deploy that side project that's been sitting in your drafts
- **MCP Server**: Model Context Protocol integration configuration - sounds fancy, works great
- **Security Audit**: Automated security analysis (coming eventually, we promise)
- **Full Profile Analysis**: Deep dive into GitHub profiles with 10-category scoring, visualizations, job role suggestions, and improvement roadmaps
- **Job Hunt Mode**: Personalized job hunting toolkit based on your profile analysis - LinkedIn search URLs, recruiter discovery, network tips, and editable cold DM templates

---

## 🎨 Design System

*"Dark mode is not a preference, it's a lifestyle."*

- **Background**: #0a0a0f (Deep dark - so dark your code editor will feel inadequate)
- **Primary Accent**: #00e5ff (Cyan - for that futuristic "I definitely know what I'm doing" vibe)
- **Secondary**: #7c3aed (Purple - because why choose between looking cool or productive when you can do neither?)
- **Typography**: 
  - Headings: Syne (for when you need to seem artistic)
  - Code/Labels: JetBrains Mono (for pretending you're a serious developer)
- **Features**: Glassmorphism cards, subtle grid background, glowing borders - basically CSS magic tricks

---

## 🚀 Getting Started

*Or as seasoned developers call it: "that thing I do before actually reading the documentation."*

### Prerequisites

- Node.js 18+ (yes, you need to update)
- npm or yarn (pick your poison)

### Installation

```bash
# Navigate to project directory
cd my-app

# Install dependencies
npm install

# Run development server
npm run dev
```

*Pro tip: If it doesn't work on the first try, that's completely normal.*

Open [http://localhost:3000](http://localhost:3000) - if you see errors, congratulations, you're a real developer now.

### Build for Production

```bash
# Build
npm run build

# Start
npm start
```

*Warning: The build process will reveal all the TypeScript errors you were conveniently ignoring in development.*

---

## 📁 Project Structure

```
my-app/
├── app/                      # Next.js App Router
│   ├── dashboard/           # Dashboard page with tabs
│   ├── profile/             # Full Profile Analysis page
│   ├── settings/            # Settings page
│   ├── globals.css          # Global styles & design system
│   ├── layout.tsx           # Root layout with fonts
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── dashboard-tabs/      # Dashboard tab components
│   ├── profile-analysis/    # Profile analysis components
│   ├── job-hunt/            # Job Hunt Mode components
│   ├── navbar.tsx           # Navigation bar
│   ├── code-block.tsx       # Syntax-highlighted code blocks
│   ├── chat-bubble.tsx      # Chat message bubbles
│   ├── score-dial.tsx       # Animated score dial
│   ├── mermaid-renderer.tsx # Mermaid diagram renderer
│   ├── repo-card.tsx        # Repository card component
│   ├── badge-strip.tsx      # Shields.io-style badges
│   └── provider-selector.tsx # AI provider selector
├── hooks/                    # Custom React hooks
│   ├── useProfileAnalysis.ts# Profile analysis state hook
│   └── useJobHunt.ts        # Job Hunt data generation hook
├── services/                 # The actual backend magic
│   ├── llm.ts              # AI provider service
│   ├── github.ts           # GitHub scraper
│   ├── analysis.ts         # Analysis engine
│   ├── readme.ts           # README generator
│   └── chat.ts             # Chat service
├── lib/
│   ├── types/              # TypeScript definitions
│   ├── db/                 # SQLite database
│   ├── redis/              # Upstash Redis cache
│   └── auth.ts             # NextAuth config
└── data/                   # SQLite database file (where your secrets live... encrypted, hopefully)
```

---

## 🏗️ Architecture

### Pages

1. **Landing Page** (`/`)
   - Hero with animated tagline
   - GitHub URL input with prefix (because typing "github.com/" is apparently too much work)
   - Feature cards grid (8 features, because one blog post wasn't enough)
   - How it works flow (6 steps - we're basically a tutorial now)
   - GitHub OAuth login button

2. **Dashboard** (`/dashboard`)
   - Sidebar with repo stats (stars, language, commits, contributors)
   - 7 tabs: Overview, Score, Diagrams, README, Chat, Deploy, MCP
   
3. **Profile Analysis** (`/profile`)
   - Full 10-category GitHub profile analysis
   - Profile hero summary with overall score and letter grade
   - Visualizations (languages, activity, project strengths)
   - Suggested job roles with match percentages
   - Personalized improvement roadmap
   - **Job Hunt Mode** button to launch personalized toolkit
   
4. **Settings** (`/settings`)
   - GitHub OAuth connection status
   - API key management for AI providers (your money, your keys)
   - Model selection per provider
   - Memory management (chat history - because AI has short memory too)
   - Theme toggle (dark only for now - light mode users, we're not sorry)

### Components

- **Navbar**: Fixed navigation with logo, OAuth status, settings link
- **RepoCard**: Repository information card
- **ScoreDial**: Animated radial dial showing /10 score - the number that will haunt your dreams
- **ScoreBar**: Linear progress bars for score breakdown
- **MermaidRenderer**: Renders architecture and workflow diagrams
- **ChatBubble**: Message bubbles with markdown support
- **ChatInput**: Input field with send button
- **CodeBlock**: Syntax-highlighted code with copy button (you're welcome, lazy developers)
- **BadgeStrip**: Shields.io-style badges for README
- **ProviderSelector**: AI provider dropdown with model selection

- **Profile Analysis Components**:
  - `ProfileAnalysis`: Main profile analysis page wrapper
  - `ProfileHeroSummary`: Hero section with overall score and profile details
  - `CategoryCard`: Expandable card for each analysis category
  - `ProfileVisualizations`: Charts and visualizations
  - `JobRolesSection`: Suggested job roles with match percentages
  - `RoadmapTable`: Actionable improvement roadmap
  - `ExportButton`: Export analysis results

- **Job Hunt Mode Components**:
  - `JobHuntDashboard`: Main job hunt dashboard with tabs
  - `SearchLinksSection`: Personalized LinkedIn job search URLs
  - `RecruiterDiscoverySection`: Recruiter and hiring manager discovery links
  - `NetworkSection`: Alumni and network leverage links
  - `TipsSection`: Profile visibility and algorithm optimization tips
  - `ColdDMSection`: Editable cold outreach message template

---

## 🔧 Technologies Used

- **Framework**: Next.js 14 (App Router) - because App Router is apparently the future
- **Language**: TypeScript - making JavaScript slightly less terrifying since 2012
- **Styling**: Tailwind CSS - for when you want to look productive but actually just want to argue about utility classes
- **UI Components**: shadcn/ui - borrowing code is a skill, not a flaw
- **Animation**: Framer Motion - making things move because static websites are so 2015
- **Diagrams**: Mermaid.js - flowcharts for people who can't draw
- **Markdown**: react-markdown, remark-gfm - making text look like code since forever
- **Icons**: Lucide React - these icons are actually pretty good, no sarcasm intended

---

## 📝 Key Features Implementation

### Glassmorphism Design
```css
.glass-card {
  background: rgba(15, 15, 25, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```
*It's basically just seeing through your code, literally.*

### Cyan Glow Effects
- Primary accent: `#00e5ff`
- Glow shadows with opacity
- Focus states with cyan rings

### Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Sidebar hidden on mobile
- Stacked tabs on small screens

---

## 🔌 Backend Integration Points

*For when you want to actually make this thing work in production.*

The application is built with mock data and ready for backend integration:

1. **Repository Analysis API**
   - Endpoint: `/api/analyze`
   - Accepts: GitHub repository URL
   - Returns: Analysis data, scores, diagrams
   - Warning: May require actual API keys, sorry

2. **AI Chat API**
   - Endpoint: `/api/chat`
   - Streaming responses supported (eventually)
   - Memory management for context

3. **Authentication**
   - GitHub OAuth integration
   - JWT token storage
   - Private repository access

4. **AI Providers**
   - Google Gemini (recommended, it's "free" until it isn't)
   - OpenAI (GPT-4)
   - Anthropic Claude
   - Groq (fast, cheap, what's the catch?)

---

## 🎯 Customization

### Adding New Features

1. Create component in `components/` or `components/dashboard-tabs/`
2. Add route/page in `app/` if needed
3. Update navigation in `components/navbar.tsx`
4. Add tab in dashboard if applicable

*Easy, right?*

### Modifying Colors

Edit `app/globals.css`:
```css
:root {
  --cyan: #00e5ff;
  --purple: #7c3aed;
  /* ... other colors - have fun with that */
}
```

### Changing Fonts

Update `app/globals.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Your+Font&display=swap');

:root {
  --font-syne: 'Your Font', sans-serif;
}
```

---

## 📄 File Overview

### Core Application Files

- `app/page.tsx` - Landing page with hero, features, how it works
- `app/dashboard/page.tsx` - Main dashboard with sidebar and tabs
- `app/settings/page.tsx` - Settings with API keys and preferences
- `app/layout.tsx` - Root layout with navigation
- `app/globals.css` - Design system and global styles

### Component Files

- `components/navbar.tsx` - Fixed navigation bar
- `components/code-block.tsx` - Code display with copy
- `components/chat-bubble.tsx` - Chat messages
- `components/score-dial.tsx` - Animated score display
- `components/mermaid-renderer.tsx` - Diagram rendering
- `components/repo-card.tsx` - Repository cards
- `components/badge-strip.tsx` - README badges
- `components/provider-selector.tsx` - AI provider dropdown

### Dashboard Tab Components

- `components/dashboard-tabs/overview-tab.tsx` - Repository overview
- `components/dashboard-tabs/score-tab.tsx` - Score breakdown
- `components/dashboard-tabs/diagrams-tab.tsx` - Mermaid diagrams
- `components/dashboard-tabs/readme-tab.tsx` - README editor/preview
- `components/dashboard-tabs/chat-tab.tsx` - AI chat interface
- `components/dashboard-tabs/deploy-tab.tsx` - Deployment guides
- `components/dashboard-tabs/mcp-tab.tsx` - MCP configuration

### Backend Services

- `services/llm.ts` - AI provider routing (gemini/openai/anthropic/groq)
- `services/github.ts` - GitHub API scraping
- `services/analysis.ts` - Repository analysis orchestration
- `services/readme.ts` - README generation
- `services/chat.ts` - Chat with context
- `services/github-push.ts` - GitHub push operations
- `lib/db/index.ts` - SQLite database
- `lib/redis/index.ts` - Upstash Redis caching

---

## 🚧 Known Limitations

- **Mock Data**: All data is currently mocked - your results may vary, just like your code quality
- **No Real AI**: Chat responses are hardcoded - at least it's consistent
- **No Backend**: No actual API integration - you're on your own, champ
- **Static Export**: Ready for static deployment - not ready for production, probably
- **Rate Limits**: GitHub API has rate limits - behave or wait

---

## 📚 Next Steps

1. **Backend Integration**
   - Set up API routes in `app/api/`
   - Implement GitHub API integration
   - Add AI provider SDKs

2. **Authentication**
   - Implement NextAuth.js
   - GitHub OAuth provider
   - Protected routes

3. **Database**
   - Add PostgreSQL or MongoDB (or don't, SQLite works fine)
   - Store chat history
   - Cache analysis results

4. **Real-time Features**
   - WebSocket for chat streaming (maybe)
   - Live analysis progress (probably not)
   - Real-time notifications (definitely not)

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
5. Wait for review (this part takes forever)

*Even better: just use it and tell your friends. That's basically the same as contributing, right?*

---

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes. We're not your lawyer, but it should be fine.

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - beautiful UI components that we definitely didn't copy-paste
- [Tailwind CSS](https://tailwindcss.com/) - utility-first styling for people who hate writing CSS
- [Next.js](https://nextjs.org/) - the React framework that promises everything and delivers... something
- [Framer Motion](https://www.framer.com/motion/) - animations that make you look like you tried
- [Mermaid](https://mermaid.js.org/) - diagrams for people who gave up on UML

---

## 🧪 Testing

```bash
# Test GitHub scraping
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/facebook/react"}'

# Test chat
curl -X POST http://localhost:3000/api/chat/facebook/react/send \
  -H "Content-Type: application/json" \
  -d '{"message": "What does this function do?"}'

# Watch it fail in production
npm run build && npm start
```

---

## 🔧 Environment Variables

See `.env.example` for required configuration. Here's the quick version:

```env
# Required (sort of)
GEMINI_API_KEY=your-gemini-key  # Recommended, "free" tier
GITHUB_CLIENT_ID=your-github-id  # For OAuth
GITHUB_CLIENT_SECRET=your-secret   # Keep this secret, obviously

# Optional but recommended
UPSTASH_REDIS_REST_URL=your-redis-url  # Caching, because slow is bad
NEXTAUTH_SECRET=generate-something-random  # Don't use "password123"

# The "I have too much money" tier
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GROQ_API_KEY=your-groq-key
```

---

*Built with ❤️ by the RepoLens Team*

**RepoLens: Now you too can pretend to understand code.**

---

*P.S. If you read this far, you're either really bored or really interested. Either way, we appreciate you. Now go analyze some repos.*

*P.P.S. The code probably has bugs. But so does production software, so we're basically the same, right?*
