const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Admin user already exists with email: admin@example.com');
      console.log('If you want to create a new admin, use a different email.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create admin user
    // The User model will automatically hash the password via pre-save hook
    const admin = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123', // Default password - should be changed after first login
      role: 'admin',
      department: 'Administration',
      isActive: true
    });

    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('⚠️  Please change the password after first login!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
createAdminUser();

