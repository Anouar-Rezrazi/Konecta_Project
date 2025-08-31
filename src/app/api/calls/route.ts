import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import dbConnect from '@/lib/mongodb';
import { Call } from '@/models/Call';
import { CallSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const agent = searchParams.get('agent');
    const status = searchParams.get('status');
    const reason = searchParams.get('reason');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build filter
    const filter: Record<string, unknown> = {};
    
    // If user is agent, only show their calls
    if (session.user.role === 'agent') {
      filter.agentId = session.user.id;
    } else if (agent) {
      filter.agentId = agent;
    }

    if (status) {
      filter.status = status;
    }

    if (reason) {
      filter.reason = reason;
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      filter.date = dateFilter;
    }

    const calls = await Call.find(filter)
      .populate('agentId', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Call.countDocuments(filter);

    return NextResponse.json({
      calls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching calls:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validation = CallSchema.safeParse({
      ...body,
      date: new Date(body.date),
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    await dbConnect();

    // If user is agent, they can only create calls for themselves
    const agentId = session.user.role === 'agent' 
      ? session.user.id 
      : validation.data.agentId;

    const call = new Call({
      ...validation.data,
      agentId,
    });

    await call.save();
    await call.populate('agentId', 'name email');

    return NextResponse.json(call, { status: 201 });
  } catch (error) {
    console.error('Error creating call:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
