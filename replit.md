# Code Translator Application

## Overview

This is a full-stack web application for translating code between different programming languages using AI. The application is built with a modern tech stack featuring Express.js backend, React frontend, and PostgreSQL database integration. It provides an intelligent code translation service that allows users to convert code from one programming language to another while maintaining functionality and structure.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state and local React state
- **Code Editor**: Monaco Editor for syntax-highlighted code editing
- **Build Tool**: Vite for fast development and optimized builds
- **Theme System**: Custom theme provider supporting light/dark modes

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON communication
- **Development Server**: Hot-reload development setup with Vite integration

### Database Architecture
- **Database**: PostgreSQL (configured via Drizzle)
- **ORM**: Drizzle ORM for type-safe database operations
- **Connection**: Neon Database serverless connection
- **Schema Management**: Migration-based schema management

## Key Components

### Code Translation Engine
- **AI Integration**: OpenAI GPT-4o for intelligent code translation
- **Language Support**: Multiple programming languages (Python, JavaScript, TypeScript, Java, C++, C#, Go, etc.)
- **Translation Features**: 
  - Confidence scoring for translation quality
  - Processing time tracking
  - Source/target language selection with visual indicators

### Workspace Management
- **Multi-workspace Support**: Users can organize translations into different workspaces
- **Active Workspace Tracking**: Single active workspace per user session
- **Workspace Operations**: Create, read, update, delete workspace functionality

### Editor System
- **Dual-pane Editor**: Side-by-side source and target code editors
- **Syntax Highlighting**: Language-specific syntax highlighting via Monaco Editor
- **Code Formatting**: Built-in code formatting capabilities
- **Real-time Statistics**: Live code statistics (lines, characters)

### Translation History
- **Recent Translations**: Quick access to recently performed translations
- **Workspace-specific History**: Translation history organized by workspace
- **Translation Metadata**: Confidence scores, processing times, timestamps

## Data Flow

1. **User Input**: User selects source/target languages and enters code in the Monaco editor
2. **Translation Request**: Frontend sends translation request to `/api/translate` endpoint
3. **AI Processing**: Backend processes the request using OpenAI API
4. **Response Handling**: Translation result is returned with confidence score and metadata
5. **Storage**: Translation is stored in the database with workspace association
6. **History Update**: Recent translations list is automatically updated
7. **Display**: Translated code is displayed in the target editor with formatting

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe ORM for database operations
- **openai**: Official OpenAI API client
- **@tanstack/react-query**: Server state management
- **monaco-editor**: Code editor component

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives for components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Utility for managing component variants
- **lucide-react**: Icon library

### Development Dependencies
- **tsx**: TypeScript execution for Node.js
- **vite**: Frontend build tool and dev server
- **esbuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

### Development Environment
- **Dev Server**: Concurrent frontend (Vite) and backend (Express) servers
- **Hot Reload**: Automatic reloading for both frontend and backend changes
- **Error Handling**: Runtime error overlay for development debugging

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Static Serving**: Express serves built frontend assets in production
- **Environment**: NODE_ENV-based configuration switching

### Database Management
- **Migrations**: Drizzle migrations stored in `/migrations` directory
- **Schema**: Centralized schema definition in `shared/schema.ts`
- **Push Strategy**: `drizzle-kit push` for schema deployment

## Changelog
```
Changelog:
- July 04, 2025. Initial setup
- July 04, 2025. Major UI/UX enhancement completed - transformed into modern, attractive design with glass-morphism effects, gradient animations, enhanced sidebar, and advanced visual elements. User confirmed satisfaction with improvements.
- July 06, 2025. Comprehensive Python-to-multi-language translator enhancement - Added extensive syntax support for translating Python to 10+ languages (JavaScript, Java, C++, C, TypeScript, Go, Ruby, PHP, Swift, C#) with rule-based pattern matching, proper variable type inference, control structures, loops, boolean operators, and complete boilerplate code generation.
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
Design preference: Modern, attractive, and advanced UI with animations and visual enhancements.
```