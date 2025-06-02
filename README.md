# WhatsApp Cloud API Front-End

A modern, full-featured web application for managing WhatsApp conversations, campaigns, and customer communications through the WhatsApp Cloud API.

## 🚀 Project Overview

This application provides a comprehensive front-end interface for businesses to manage their WhatsApp communications, including:

- **Real-time Chat Management**: Send and receive messages with customers
- **Bulk Messaging Campaigns**: Create and manage template-based bulk messaging
- **Conversation Management**: Assign, close, and track conversation status
- **Admin Dashboard**: Manage WhatsApp business numbers, templates, and user roles
- **Multi-role Support**: Admin, Team Leader, and Agent role-based access
- **AI Chatbot Integration**: Seamless chatbot handover capabilities

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library with latest features
- **TypeScript** - Type-safe development
- **Material UI v6** - Modern React component library
- **Tailwind CSS** - Utility-first CSS framework
- **TanStack Query** - Server state management
- **Zustand** - Client-side state management

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication & authorization
  - Edge Functions
  - File storage
- **WhatsApp Cloud API** - Message delivery platform

## 📋 Current Development Status

### ✅ Completed Tasks

#### Task 1: Frontend Core Setup & Authentication ✅ COMPLETE
- [x] Next.js 14 project initialization with App Router
- [x] Material UI v6 configuration with proper theming
- [x] Zustand state management setup
- [x] TanStack Query configuration for server state
- [x] Supabase client libraries integration (@supabase/ssr)
- [x] **Authentication flows (sign-in, sign-out, protected routes)**
- [x] **Reusable UI components library structure**
- [x] **Main layout component with header and sidebar**
- [x] **Role-based navigation links (Admin, Team Leader, Agent)**
- [x] **Login page UI with email/password fields**
- [x] **Supabase Auth integration with JWT role claims**
- [x] **Session management and redirects**
- [x] **User profile fetching and global state management**
- [x] **Logout functionality**
- [x] **Protected routes based on authentication status**
- [x] Project structure and component organization
- [x] TypeScript configuration with strict mode
- [x] Development environment setup

### 🔄 In Progress
- [ ] Chat interface development (Task 2)

### 📅 Upcoming Tasks
- [ ] Core Agent/User Backend & Frontend (Chat Send/Receive)
- [ ] Conversation Management Backend & Frontend
- [ ] Admin dashboard features
- [ ] Bulk messaging system
- [ ] Real-time features integration

## 🏗 Project Structure

```
whatsapp-cloud-api-frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (authenticated)/    # Protected route group
│   │   │   ├── dashboard/      # Dashboard page
│   │   │   └── layout.tsx      # Authenticated layout
│   │   ├── login/              # Login page
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout with providers
│   │   └── page.tsx            # Home page (redirects)
│   ├── components/             # Reusable components
│   │   ├── auth/               # Authentication components
│   │   │   └── protected-route.tsx
│   │   ├── layout/             # Layout components
│   │   │   ├── app-header.tsx
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── app-layout.tsx
│   │   │   └── index.ts
│   │   ├── providers/          # Context providers
│   │   │   ├── auth-provider.tsx
│   │   │   ├── query-client-provider.tsx
│   │   │   └── theme-provider.tsx
│   │   └── ui/                 # UI components
│   │       ├── button/         # Button component
│   │       ├── loading/        # Loading components
│   │       └── index.ts        # Component exports
│   └── lib/                    # Utilities and configurations
│       ├── supabase/           # Supabase client setup
│       │   ├── client.ts       # Browser client
│       │   └── server.ts       # Server client
│       ├── types/              # TypeScript type definitions
│       │   └── auth.ts         # Authentication types
│       └── zustand/            # State stores
│           ├── auth-store.ts   # Authentication store
│           └── example-store.ts
├── middleware.ts               # Next.js middleware for auth
├── package.json               # Dependencies and scripts
├── next.config.mjs           # Next.js configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Supabase project (for backend integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd whatsapp-cloud-api-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

## 🔐 Authentication System

### Features Implemented
- **Email/Password Authentication**: Secure login via Supabase Auth
- **Role-Based Access Control**: Admin, Team Leader, and Agent roles
- **Protected Routes**: Automatic redirects for unauthorized access
- **Session Management**: Persistent login state with automatic refresh
- **User Profile Integration**: Fetches user data from profile table
- **Middleware Protection**: Server-side route protection

### User Roles & Access
- **Admin**: Full access to all features including user management, templates, campaigns
- **Team Leader**: Access to team conversations and limited admin features
- **Agent**: Access to assigned conversations and basic chat features

## 🎨 UI Components & Design System

### Material UI Integration
- Custom theme configuration with consistent color palette
- Responsive design using MUI's breakpoint system
- Integration with Next.js App Router for optimal performance
- CssBaseline for consistent cross-browser styling

### Component Library Structure
- **Button Components**: Custom variants (primary, secondary, outlined, text)
- **Loading Components**: Reusable loading spinners with customization
- **Layout Components**: Header, sidebar, and main layout with responsive design
- **Authentication Components**: Protected routes and auth flows

### Tailwind CSS
- Configured to work alongside Material UI
- Custom utility classes for layout and spacing
- Mobile-first responsive design approach
- Preflight disabled to avoid conflicts with MUI

## 🔧 State Management

### Server State (TanStack Query)
- Handles all API calls and server data
- Automatic caching and background updates
- Optimistic updates for better UX
- Error handling and retry mechanisms

### Client State (Zustand)
- **Authentication Store**: User session, profile data, and auth state
- TypeScript-first approach with proper type definitions
- Middleware support for enhanced functionality
- Subscription-based updates for reactive UI

## 🗃 Database Integration

### Supabase Setup
- **Client-side**: Browser-based operations with `@supabase/ssr`
- **Server-side**: Server components and API routes support
- **Real-time**: WebSocket connections for live updates
- **Authentication**: Built-in auth with JWT tokens and role claims
- **RLS**: Row Level Security for data protection

## 🛡 Security Features

### Authentication Security
- JWT tokens with role-based claims
- Secure cookie handling via Supabase SSR
- Server-side session validation
- Automatic token refresh

### Route Protection
- Middleware-level route protection
- Component-level protected routes
- Role-based access control
- Automatic redirects for unauthorized access

## 🧪 Development Guidelines

### Code Style
- TypeScript for all code with strict configuration
- Functional components with typed props
- ESLint configuration for code quality
- Consistent naming conventions (camelCase, kebab-case for files)

### Component Organization
- Group components by feature or type
- Export components as named exports
- Use descriptive file and component names
- Separate client and server components appropriately

### Performance Best Practices
- Server Components by default, Client Components when needed
- Dynamic imports for large components
- Image optimization with next/image
- Proper use of React suspense boundaries

## 🤝 Contributing

1. Follow the established code style and conventions
2. Write TypeScript for all new code
3. Test components thoroughly
4. Update documentation as needed
5. Follow the task-based development approach outlined in `task.md`

## 📖 Documentation

- **PRD**: `prd.md` - Product Requirements Document
- **Database**: `detaildatabase.md` - Database schema and specifications
- **Tasks**: `task.md` - Development task breakdown and progress
- **Rules**: Custom instructions for development standards

## 🐛 Known Issues

- Punycode deprecation warning (Node.js) - Does not affect functionality

## 📝 Changelog

### Version 0.2.0 (Current)
- ✅ **Complete authentication system implementation**
- ✅ **Role-based navigation and access control**
- ✅ **Protected routes with middleware**
- ✅ **User session management**
- ✅ **Responsive layout with header and sidebar**
- ✅ **Reusable UI component library**
- ✅ **Login/logout functionality**

### Version 0.1.0
- Initial Next.js 14 setup with App Router
- Material UI v6 integration with custom theming
- TanStack Query and Zustand state management setup
- Supabase client configuration
- Basic project structure and development environment

---

## 🔮 Roadmap

### Phase 1: Core Authentication ✅ COMPLETE
- ✅ User authentication flows
- ✅ Role-based access control
- ✅ Protected routing system

### Phase 2: Chat System (Next)
- Real-time messaging interface
- Conversation management
- Media handling

### Phase 3: Admin Features
- Dashboard with analytics
- User and template management
- Bulk messaging system

### Phase 4: Advanced Features
- AI chatbot integration
- Advanced reporting
- Performance optimization

---

*Last updated: December 2024 - Task 1 Complete ✅* 