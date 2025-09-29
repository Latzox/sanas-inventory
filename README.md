# Inventory Management System

A modern web application built with Next.js and Supabase for managing inventory with user authentication and real-time stock tracking.

## Features

- **User Authentication**: Secure login and registration system powered by Supabase Auth
- **Inventory Management**: Add, view, and manage products with stock tracking
- **Weight-based Tracking**: Track products by weight with precise measurements
- **Real-time Updates**: Live inventory updates across all connected clients
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS
- **Secure Dashboard**: Protected user dashboard with account management

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) with App Router
- **Database & Auth**: [Supabase](https://supabase.com)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Language**: TypeScript
- **Deployment**: Optimized for [Vercel](https://vercel.com)

## Prerequisites

Before running this application, ensure you have:

- Node.js 18+ installed
- A Supabase project set up
- Environment variables configured (see Configuration section)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd sanas-inventory
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (see Configuration section)
4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Configuration

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Protected dashboard page
│   ├── inventory/         # Inventory management page
│   ├── login/            # User login page
│   └── register/         # User registration page
├── components/           # React components
│   ├── InventoryManager.tsx
│   ├── ProductList.tsx
│   └── ...
├── lib/                 # Utility libraries
│   └── supabase/       # Supabase client configuration
└── types/              # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint for code quality

## Database Schema

The application uses the following main tables:

- **users** - User profiles (managed by Supabase Auth)
- **products** - Product inventory with weight tracking
- **stock_updates** - Historical stock changes

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The application can be deployed to any platform that supports Node.js:

1. Build the application: `npm run build`
2. Set environment variables on your platform
3. Start the application: `npm start`