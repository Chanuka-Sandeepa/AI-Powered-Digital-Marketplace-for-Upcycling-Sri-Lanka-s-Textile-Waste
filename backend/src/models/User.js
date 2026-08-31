import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const companySchema = new mongoose.Schema(
  {
    companyName: { type: String, default: '' },
    businessType: { type: String, default: '' },
    registrationNumber: { type: String, default: '' },
    taxId: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    country: { type: String, default: 'Sri Lanka' },
    postalCode: { type: String, default: '' },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    // Four roles per the project's role matrix: seller and buyer are
    // self-registerable; admin and super_admin are not (see registration
    // controller) - they're created by an existing super_admin or a seed
    // script, never through the public signup form.
    role: { type: String, enum: ['buyer', 'seller', 'admin', 'super_admin'], default: 'buyer' },
    // Lets admin/super_admin suspend an account without deleting it -
    // suspended users can't log in (checked in the login controller) but
    // their data (listings, history) is preserved.
    accountStatus: { type: String, enum: ['active', 'suspended'], default: 'active' },
    phone: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 1000 },
    avatar: { type: String, default: '' },
    company: { type: companySchema, default: () => ({}) },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    accountStatus: this.accountStatus,
    phone: this.phone,
    bio: this.bio,
    avatar: this.avatar,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
