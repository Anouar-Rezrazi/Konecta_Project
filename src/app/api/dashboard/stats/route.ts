import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import dbConnect from '@/lib/mongodb';
import { Call } from '@/models/Call';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Build base filter
    const baseFilter: Record<string, unknown> = {
      date: {
        $gte: startOfDay(startDate),
        $lte: endOfDay(endDate),
      },
    };

    // If user is agent, only show their calls
    if (session.user.role === 'agent') {
      baseFilter.agentId = new mongoose.Types.ObjectId(session.user.id);
      console.log('Agent filter applied:', { agentId: session.user.id, baseFilter });
    }

    // Get basic statistics
    const [
      totalCalls,
      completedCalls,
      missedCalls,
      abandonedCalls,
      busyCalls,
      avgDuration,
    ] = await Promise.all([
      Call.countDocuments(baseFilter),
      Call.countDocuments({ ...baseFilter, status: 'completed' }),
      Call.countDocuments({ ...baseFilter, status: 'missed' }),
      Call.countDocuments({ ...baseFilter, status: 'abandoned' }),
      Call.countDocuments({ ...baseFilter, status: 'busy' }),
      Call.aggregate([
        { $match: { ...baseFilter, status: 'completed' } },
        {
          $group: {
            _id: null,
            avgDuration: { $avg: '$duration' },
          },
        },
      ]),
    ]);

    // Get daily statistics for charts
    const dailyStats = await Call.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$date',
              },
            },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Transform daily stats for charts
    const chartData: Record<string, Record<string, unknown>> = {};
    dailyStats.forEach((stat) => {
      const date = stat._id.date;
      if (!chartData[date]) {
        chartData[date] = {
          date,
          completed: 0,
          missed: 0,
          abandoned: 0,
          busy: 0,
          total: 0,
        };
      }
      chartData[date][stat._id.status] = stat.count;
      chartData[date].total += stat.count;
    });
    
    console.log('Chart data for agent:', { 
      role: session.user.role, 
      chartDataCount: Object.keys(chartData).length,
      chartData: Object.values(chartData),
      totalCalls 
    });

    // Get top agents (if supervisor)
    let topAgents = [];
    if (session.user.role === 'supervisor') {
      topAgents = await Call.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$agentId',
            totalCalls: { $sum: 1 },
            completedCalls: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
              },
            },
            avgDuration: {
              $avg: {
                $cond: [{ $eq: ['$status', 'completed'] }, '$duration', null],
              },
            },
          },
        },
        { $sort: { totalCalls: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'agent',
            pipeline: [{ $project: { name: 1, email: 1 } }],
          },
        },
        { $unwind: '$agent' },
      ]);
    }

    return NextResponse.json({
      overview: {
        totalCalls,
        completedCalls,
        missedCalls,
        abandonedCalls,
        busyCalls,
        avgDuration: avgDuration[0]?.avgDuration || 0,
        completionRate: totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0,
      },
      chartData: Object.values(chartData),
      topAgents,
      debug: {
        role: session.user.role,
        agentId: session.user.id,
        dailyStatsCount: dailyStats.length,
        chartDataKeys: Object.keys(chartData)
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
