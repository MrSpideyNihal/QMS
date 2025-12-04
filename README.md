# Restaurant Queue Management System

A complete, production-ready queue management system built with Next.js 14, MongoDB, Socket.io, and JWT authentication. Features real-time updates, role-based access control, and comprehensive queue management capabilities.

## 🚀 Features

- **Real-time Updates**: Live queue and table status updates via Socket.io
- **Role-Based Access Control**: Developer, Admin, and Staff roles with specific permissions
- **Token Management**: Create walk-in and reservation tokens with estimated wait times
- **Smart Table Assignment**: Automatic and manual table assignment with optimization
- **Reservation Timeouts**: Auto-cancel late arrivals with configurable grace period
- **Shared Seating**: Optional table sharing with customer consent
- **Analytics Dashboard**: Hourly traffic analysis with peak hour detection
- **Public Display**: Kiosk-friendly queue board for customers
- **Override Logging**: Track all manual interventions and system actions
- **Responsive Design**: Mobile-first, works on tablets and Android TV

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (free tier works)
- npm or yarn package manager

## 🛠️ Installation

### 1. Clone or Extract the Project

```bash
cd "QMS v2"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/restaurant-queue?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SOCKET_IO_SECRET=your-socket-io-secret-key
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

Replace the `MONGODB_URI` with your actual MongoDB Atlas connection string.

### 5. Seed the Database

```bash
npm run seed
```

This will create:
- 3 default users (developer, admin, staff)
- 10 tables with varying capacities
- Default system settings

**Default Login Credentials:**
- Developer: `developer@qms.com` / `password123`
- Admin: `admin@qms.com` / `password123`
- Staff: `staff@qms.com` / `password123`

### 6. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🌐 Deployment to Netlify

### Option 1: Netlify CLI

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Build the project:
```bash
npm run build
```

3. Deploy:
```bash
netlify deploy --prod
```

4. Set environment variables in Netlify dashboard:
   - Go to Site settings > Build & deploy > Environment
   - Add all variables from `.env.local`
   - Update `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` to your Netlify URL

### Option 2: Netlify Dashboard

1. Build the project:
```bash
npm run build
```

2. Go to [Netlify](https://app.netlify.com)
3. Drag and drop the `.next` folder
4. Configure environment variables in Site settings
5. Redeploy

### Important Netlify Configuration

The `netlify.toml` file is already configured with:
- API route redirects to serverless functions
- CORS headers for Socket.io
- Build settings

**Note**: Socket.io real-time features work best on platforms with WebSocket support. For Netlify, you may need to use polling as a fallback or consider deploying to Vercel/Railway for better WebSocket support.

## 📱 Usage

### Staff Workflow

1. **Login** with staff credentials
2. **Create Token** for walk-in or reservation
3. **View Queue** to see waiting customers
4. **Manage Tables** to update table status
5. **Assign Tables** manually or let auto-assignment handle it
6. **Complete Tokens** when customers finish

### Admin Workflow

All staff features plus:
- **Analytics**: View hourly traffic and peak hours
- **Settings**: Configure grace period and operating hours
- **Logs**: Review all override actions
- **User Management**: Create new staff accounts

### Developer Workflow

All admin features plus:
- **Developer Tools**: Access raw database operations
- **System Configuration**: Advanced settings

### Public Display

- Access `/public` for customer-facing queue board
- Auto-refreshes every 30 seconds
- Shows queue position and estimated wait times
- Optimized for tablets and Android TV

## 🏗️ Project Structure

```
QMS v2/
├── app/
│   ├── api/              # API routes (serverless functions)
│   │   ├── auth/         # Authentication endpoints
│   │   ├── tokens/       # Token management
│   │   ├── tables/       # Table management
│   │   ├── settings/     # System settings
│   │   ├── analytics/    # Analytics data
│   │   └── logs/         # Override logs
│   ├── dashboard/        # Main dashboard
│   ├── queue/            # Queue management
│   ├── tables/           # Table management
│   ├── tokens/           # Token creation
│   ├── public/           # Public display
│   ├── login/            # Login page
│   └── register/         # Registration page
├── components/           # Reusable React components
├── lib/
│   ├── models/           # Mongoose models
│   ├── db.ts             # Database connection
│   ├── auth.ts           # JWT utilities
│   ├── queueUtils.ts     # Queue management logic
│   ├── socket.ts         # Socket.io server
│   └── useSocket.ts      # Socket.io client hook
├── scripts/
│   └── seed.js           # Database seeding script
├── middleware.ts         # Route protection
├── netlify.toml          # Netlify configuration
└── package.json          # Dependencies
```

## 🔐 Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens stored in HTTP-only cookies
- Role-based middleware protection
- Input validation on all API routes
- MongoDB injection prevention via Mongoose

## 🧪 Testing

Run unit tests:
```bash
npm test
```

## 📊 Database Schema

### Users
- email, password (hashed), role

### Tables
- tableNumber, capacity, status, currentToken, isJoinable

### Tokens
- tokenNumber, customerName, phoneNumber, partySize, type, status, queuePosition, estimatedWaitTime, shareConsent

### Settings
- gracePeriodMinutes, autoRefresh, operatingHours, avgSeatTimeMinutes

### Analytics
- date, hour, tokenCount, peakHour, avgWaitTime, shareConsentCount

### OverrideLogs
- action, performedBy, tokenId, tableId, reason, timestamp

## 🔧 Configuration

### System Settings (Admin only)

- **Grace Period**: Minutes to wait before auto-canceling late reservations (default: 15)
- **Auto Refresh**: Enable/disable automatic queue refresh (default: true)
- **Operating Hours**: Restaurant open/close times
- **Avg Seat Time**: Average time customers spend seated (default: 45 minutes)

### Auto-Assignment

The system automatically assigns tables every 30 seconds based on:
1. Exact capacity match
2. Smallest table that fits
3. Joinable tables (combining multiple tables)
4. Shared seating (if customer consents)

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify connection string in `.env.local`
- Check IP whitelist in MongoDB Atlas
- Ensure database user has correct permissions

### Socket.io Not Connecting
- Check CORS settings in `netlify.toml`
- Verify `NEXT_PUBLIC_SOCKET_URL` is correct
- Try using polling transport as fallback

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (18+ required)

## 📝 License

MIT License - feel free to use this project for your restaurant!

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review MongoDB Atlas logs
3. Check browser console for errors
4. Verify environment variables are set correctly

## 🎯 Roadmap

- [ ] SMS notifications for token status
- [ ] QR code generation for tokens
- [ ] Multi-language support
- [ ] Advanced analytics with charts
- [ ] Mobile app (React Native)
- [ ] Integration with POS systems

---

Built with ❤️ using Next.js 14, MongoDB, and Socket.io
