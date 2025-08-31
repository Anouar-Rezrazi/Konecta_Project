import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { Call } from '@/models/Call';
import { hashPassword } from '@/lib/auth';

async function seed() {
  await dbConnect();

  // Clear existing data
  await User.deleteMany({});
  await Call.deleteMany({});

  console.log('Creating users...');

  // Create demo users with Moroccan names
  const supervisor = new User({
    email: 'supervisor@demo.com',
    password: await hashPassword('password123'),
    name: 'Ahmed Bennani',
    role: 'supervisor',
  });
  await supervisor.save();

  const agent1 = new User({
    email: 'agent@demo.com',
    password: await hashPassword('password123'),
    name: 'Fatima El Alaoui',
    role: 'agent',
  });
  await agent1.save();

  const agent2 = new User({
    email: 'agent2@demo.com',
    password: await hashPassword('password123'),
    name: 'Youssef Tazi',
    role: 'agent',
  });
  await agent2.save();

  console.log('Creating sample calls...');

  // Create sample calls with Moroccan phone numbers
  const agents = [agent1._id, agent2._id];
  const statuses = ['completed', 'missed', 'abandoned', 'busy'];
  const reasons = [
    'Customer inquiry',
    'Technical support',
    'Sales call',
    'Follow-up',
    'Complaint resolution',
    'Service activation',
    'Billing inquiry',
    'Product information',
  ];

  // Function to generate Moroccan phone numbers
  const generateMoroccanPhone = () => {
    // Moroccan mobile numbers: +212 6XX-XX-XX-XX or +212 7XX-XX-XX-XX
    // Fixed line: +212 5XX-XX-XX-XX
    const prefixes = ['6', '7', '5']; // 6 and 7 for mobile, 5 for fixed line
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return `+212 ${prefix}${number.substring(0, 2)}-${number.substring(2, 4)}-${number.substring(4, 6)}-${number.substring(6, 8)}`;
  };

  const calls = [];
  for (let i = 0; i < 50; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Random date in last 30 days
    
    calls.push({
      phoneNumber: generateMoroccanPhone(),
      date,
      duration: Math.floor(Math.random() * 1800) + 30, // 30 seconds to 30 minutes
      agentId: agents[Math.floor(Math.random() * agents.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      notes: Math.random() > 0.7 ? 'Additional notes about the call' : undefined,
    });
  }

  await Call.insertMany(calls);

  console.log('Seed data created successfully!');
  console.log('Demo accounts:');
  console.log('Supervisor: supervisor@demo.com / password123');
  console.log('Agent 1: agent@demo.com / password123');
  console.log('Agent 2: agent2@demo.com / password123');
}

export { seed };
