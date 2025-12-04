const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
}

// Define schemas (simplified for seeding)
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    role: String,
});

const tableSchema = new mongoose.Schema({
    tableNumber: Number,
    capacity: Number,
    status: String,
    isJoinable: Boolean,
});

const settingsSchema = new mongoose.Schema({
    gracePeriodMinutes: Number,
    autoRefresh: Boolean,
    operatingHours: Object,
    avgSeatTimeMinutes: Number,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Table = mongoose.models.Table || mongoose.model('Table', tableSchema);
const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

async function seed() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await Table.deleteMany({});
        await Settings.deleteMany({});

        // Create default users
        console.log('👤 Creating default users...');
        const hashedPassword = await bcrypt.hash('password123', 10);

        await User.create([
            {
                email: 'developer@qms.com',
                password: hashedPassword,
                role: 'developer',
            },
            {
                email: 'admin@qms.com',
                password: hashedPassword,
                role: 'admin',
            },
            {
                email: 'staff@qms.com',
                password: hashedPassword,
                role: 'staff',
            },
        ]);
        console.log('✅ Created 3 users (developer, admin, staff)');
        console.log('   Email: developer@qms.com | Password: password123');
        console.log('   Email: admin@qms.com | Password: password123');
        console.log('   Email: staff@qms.com | Password: password123');

        // Create tables
        console.log('🪑 Creating tables...');
        const tables = [];
        for (let i = 1; i <= 10; i++) {
            tables.push({
                tableNumber: i,
                capacity: i <= 4 ? 2 : i <= 7 ? 4 : 6,
                status: 'free',
                isJoinable: true,
            });
        }
        await Table.insertMany(tables);
        console.log('✅ Created 10 tables');

        // Create settings
        console.log('⚙️  Creating default settings...');
        await Settings.create({
            gracePeriodMinutes: 15,
            autoRefresh: true,
            operatingHours: {
                open: '09:00',
                close: '22:00',
            },
            avgSeatTimeMinutes: 45,
        });
        console.log('✅ Created default settings');

        console.log('\n🎉 Seeding completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('   1. Run: npm run dev');
        console.log('   2. Visit: http://localhost:3000');
        console.log('   3. Login with any of the accounts above');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

seed();
