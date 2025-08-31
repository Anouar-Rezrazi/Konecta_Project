# Call Center Management System

A comprehensive web application built with Next.js to manage call center operations, track calls, and provide insightful analytics.

## 🚀 Features

### Core Features
- **Authentication & Authorization**: Secure login with role-based access (Agent, Supervisor)
- **Call Management**: Complete CRUD operations for call records
- **Dashboard Analytics**: Visual statistics with charts and graphs
- **User Management**: Supervisor can manage agent accounts
- **Advanced Filtering**: Search and filter calls by date, agent, status
- **Responsive Design**: Mobile-friendly interface

### Security Features
- Password hashing with bcrypt
- JWT-based authentication
- Role-based authorization
- Input validation on client and server

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: TailwindCSS
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js
- **Charts**: Recharts
- **Validation**: Zod
- **Icons**: Heroicons
- **TypeScript**: Full type safety

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas account
- npm or yarn package manager

## 🔧 Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/call-center-db
   
   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-change-this-in-production
   
   # JWT Secret
   JWT_SECRET=your-jwt-secret-change-this-in-production
   ```

3. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Seed the database with sample data**:
   Visit `http://localhost:3000/api/seed` in your browser to populate the database with demo data.

6. **Open your browser** and navigate to `http://localhost:3000`

## 👥 Demo Accounts

After seeding the database, you can use these demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Supervisor | supervisor@demo.com | password123 |
| Agent | agent@demo.com | password123 |
| Agent | agent2@demo.com | password123 |

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── calls/             # Call management pages
│   ├── dashboard/         # Dashboard page
│   ├── login/             # Authentication page
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── ui/               # Basic UI components
│   ├── forms/            # Form components
│   ├── charts/           # Chart components
│   └── Layout.tsx        # Main layout component
├── lib/                   # Utility functions
│   ├── auth.ts           # Authentication utilities
│   ├── mongodb.ts        # Database connection
│   ├── utils.ts          # General utilities
│   └── validation.ts     # Zod schemas
├── models/               # Mongoose schemas
│   ├── User.ts           # User model
│   └── Call.ts           # Call model
└── types/                # TypeScript type definitions
    └── next-auth.d.ts    # NextAuth type extensions
```

## 🎯 Usage Guide

### For Agents
1. **Login** with your agent credentials
2. **View Dashboard** to see your call statistics
3. **Manage Calls**: Add, edit, and view your call records
4. **Filter & Search**: Find specific calls using various filters

### For Supervisors
1. **Login** with supervisor credentials
2. **Monitor Team Performance** on the dashboard
3. **Manage All Calls**: View, edit, and delete any call record
4. **User Management**: Add, edit, and manage agent accounts
5. **Generate Reports**: View team statistics and performance metrics

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth.js authentication

### Calls
- `GET /api/calls` - Get calls with filtering and pagination
- `POST /api/calls` - Create a new call
- `GET /api/calls/[id]` - Get specific call
- `PUT /api/calls/[id]` - Update call
- `DELETE /api/calls/[id]` - Delete call (supervisors only)

### Users
- `GET /api/users` - Get users (supervisors only)
- `POST /api/users` - Create user (supervisors only)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Utilities
- `POST /api/seed` - Seed database with sample data

## 🚀 Deployment

### Environment Variables for Production
Update your `.env.local` for production:

```env
MONGODB_URI=your-production-mongodb-uri
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret
JWT_SECRET=your-production-jwt-secret
```

### Deploy to Vercel
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

## 🔒 Security Considerations

- All passwords are hashed using bcrypt with 12 salt rounds
- JWT tokens expire after 24 hours
- Role-based access control prevents unauthorized actions
- Input validation on both client and server sides
- Environment variables for sensitive configuration

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   - Ensure MongoDB is running
   - Check the MONGODB_URI in your `.env.local`

2. **NextAuth Session Issues**:
   - Verify NEXTAUTH_SECRET is set
   - Clear browser cookies and try again

3. **Build Errors**:
   - Run `npm install` to ensure all dependencies are installed
   - Check for TypeScript errors with `npm run build`

---

Built with ❤️ 
By Anouar.
