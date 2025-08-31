import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'agent' | 'supervisor';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  role: {
    type: String,
    enum: ['agent', 'supervisor'],
    required: [true, 'Role is required'],
    default: 'agent',
  },
}, {
  timestamps: true,
});

// Prevent re-compilation during development
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
