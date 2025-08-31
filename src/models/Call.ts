import mongoose, { Schema, Document } from 'mongoose';

export interface ICall extends Document {
  phoneNumber: string;
  date: Date;
  duration: number; // in seconds
  agentId: mongoose.Types.ObjectId;
  status: 'completed' | 'missed' | 'abandoned' | 'busy';
  reason: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CallSchema = new Schema<ICall>({
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  date: {
    type: Date,
    required: [true, 'Call date is required'],
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [0, 'Duration cannot be negative'],
  },
  agentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Agent is required'],
  },
  status: {
    type: String,
    enum: ['completed', 'missed', 'abandoned', 'busy'],
    required: [true, 'Status is required'],
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Add indexes for better query performance
CallSchema.index({ agentId: 1, date: -1 });
CallSchema.index({ status: 1 });
CallSchema.index({ date: -1 });

// Prevent re-compilation during development
export const Call = mongoose.models.Call || mongoose.model<ICall>('Call', CallSchema);
