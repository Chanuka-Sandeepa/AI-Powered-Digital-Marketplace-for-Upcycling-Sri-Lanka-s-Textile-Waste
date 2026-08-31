// One-time script to create the very first super_admin account. Run once
// after setting up the database - super_admin accounts can never be
// created through the public registration form (see authController.js),
// so this is the only way to bootstrap the first one. After that, a
// super_admin can promote other users to admin/super_admin through the
// admin user-management panel.
//
// Usage (from the backend folder):
//   node src/scripts/seedSuperAdmin.js "Full Name" "email@example.com" "password123"
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function seed() {
  const [name, email, password] = process.argv.slice(2);

  if (!name || !email || !password) {
    console.error('Usage: node src/scripts/seedSuperAdmin.js "Full Name" "email@example.com" "password123"');
    process.exit(1);
  }
  if (password.length < 6) {
    console.error('Password must be at least 6 characters.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    existing.role = 'super_admin';
    existing.accountStatus = 'active';
    await existing.save();
    console.log(`Existing user ${email} promoted to super_admin.`);
  } else {
    await User.create({ name, email, password, role: 'super_admin' });
    console.log(`Created new super_admin account: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
