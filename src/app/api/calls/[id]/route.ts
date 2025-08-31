import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import dbConnect from '@/lib/mongodb';
import { Call } from '@/models/Call';
import { CallSchema } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const call = await Call.findById(id).populate('agentId', 'name email');
    
    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Agents can only view their own calls
    if (session.user.role === 'agent' && call.agentId._id.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(call);
  } catch (error) {
    console.error('Error fetching call:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validation = CallSchema.partial().safeParse({
      ...body,
      date: body.date ? new Date(body.date) : undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    await dbConnect();

    const call = await Call.findById(id);
    
    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Agents can only edit their own calls
    if (session.user.role === 'agent' && call.agentId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedCall = await Call.findByIdAndUpdate(
      id,
      { ...validation.data },
      { new: true, runValidators: true }
    ).populate('agentId', 'name email');

    return NextResponse.json(updatedCall);
  } catch (error) {
    console.error('Error updating call:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only supervisors can delete calls
    if (session.user.role !== 'supervisor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const call = await Call.findByIdAndDelete(id);
    
    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Call deleted successfully' });
  } catch (error) {
    console.error('Error deleting call:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
