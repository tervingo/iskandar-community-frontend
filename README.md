# Iskandar Community Frontend

React TypeScript frontend for the Iskandar private community web application.

## Features

- **Blog System**: Create, read, and comment on blog posts
- **Real-time Chat**: Group chat with Socket.IO integration
- **File Repository**: Upload, download, and manage files
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- React 18 with TypeScript
- Vite for build tooling
- React Router for routing
- Zustand for state management
- Axios for API calls
- Socket.IO Client for real-time chat
- CSS3 for styling

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:3000 in your browser

## Environment Variables

Create a `.env` file with:
```
VITE_API_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
```

## Project Structure

```
src/
├── components/
│   ├── Blog/           # Blog-related components
│   ├── Chat/           # Chat components
│   ├── Files/          # File repository components
│   └── Layout/         # Layout and navigation components
├── services/           # API and Socket.IO services
├── stores/             # Zustand state stores
├── types/              # TypeScript type definitions
├── App.tsx             # Main app component with routing
└── main.tsx            # App entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

This app is designed to be deployed to Netlify with automatic builds from the repository.