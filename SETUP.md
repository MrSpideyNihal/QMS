# Quick Setup Guide

## ⚠️ PowerShell Execution Policy Issue

If you encounter the error:
```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system.
```

### Solution:

**Option 1: Run PowerShell as Administrator**
1. Right-click on PowerShell
2. Select "Run as Administrator"
3. Run this command:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
4. Type `Y` and press Enter

**Option 2: Use Command Prompt Instead**
1. Open Command Prompt (cmd.exe)
2. Navigate to project directory:
```cmd
cd "C:\Users\nihal\Desktop\zendalona\QMS v2"
```
3. Run npm commands normally:
```cmd
npm install
npm run seed
npm run dev
```

## 📋 Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure MongoDB
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create database user
4. Whitelist IP: 0.0.0.0/0 (for development)
5. Get connection string

### 3. Update .env.local
Replace the placeholder values:
```env
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/restaurant-queue?retryWrites=true&w=majority
JWT_SECRET=change-this-to-a-random-secret-key
SOCKET_IO_SECRET=change-this-to-another-random-key
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### 4. Seed the Database
```bash
npm run seed
```

This creates:
- **Developer**: developer@qms.com / password123
- **Admin**: admin@qms.com / password123
- **Staff**: staff@qms.com / password123
- 10 tables with varying capacities
- Default system settings

### 5. Run Development Server
```bash
npm run dev
```

### 6. Access the Application
Open your browser and go to:
- **Main App**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Public Display**: http://localhost:3000/public

### 7. First Login
1. Go to http://localhost:3000/login
2. Use: developer@qms.com / password123
3. You'll be redirected to the dashboard

## 🎯 Quick Test Workflow

1. **Create a Token**
   - Click "Create New Token" or go to /tokens/new
   - Fill in customer details
   - Submit

2. **View Queue**
   - Go to /queue
   - See your token in the waiting list

3. **Manage Tables**
   - Go to /tables
   - Click on a table to change its status

4. **Assign Table**
   - In the queue page, click "Assign" on a waiting token
   - Or use auto-assignment: POST to /api/queue/auto-assign

5. **Complete Token**
   - When customer finishes, click "Complete"

6. **View Analytics**
   - Go to /analytics
   - See hourly traffic and statistics

7. **Public Display**
   - Go to /public
   - This is what customers see on a TV/tablet

## 🔧 Troubleshooting

### MongoDB Connection Error
- Check your connection string in .env.local
- Verify IP is whitelisted in MongoDB Atlas
- Ensure database user has correct permissions

### Socket.io Not Connecting
- Make sure server.js is being used (check package.json scripts)
- Verify NEXT_PUBLIC_SOCKET_URL is correct
- Check browser console for errors

### Port Already in Use
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run dev
```

## 📱 Testing on Mobile/Tablet

1. Find your local IP:
```bash
ipconfig
```

2. Update .env.local:
```env
NEXT_PUBLIC_API_URL=http://YOUR_IP:3000
NEXT_PUBLIC_SOCKET_URL=http://YOUR_IP:3000
```

3. Access from mobile:
```
http://YOUR_IP:3000/public
```

## 🚀 Ready to Deploy?

See README.md for full deployment instructions to Netlify.

Quick checklist:
- [ ] Dependencies installed
- [ ] MongoDB configured
- [ ] .env.local set up
- [ ] Database seeded
- [ ] Tested locally
- [ ] Ready to deploy!

---

**Need Help?** Check the README.md for detailed documentation.
