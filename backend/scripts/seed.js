require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Score = require('../models/Score');
const Charity = require('../models/Charity');
const Draw = require('../models/Draw');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/golf-charity';

const CHARITIES = [
  {
    name: 'Hearts in Motion',
    shortDescription: 'Funding life-saving cardiac research across the UK.',
    description: 'Hearts in Motion is dedicated to funding cutting-edge cardiac research and providing support to families affected by heart disease. Our programmes reach over 50,000 patients annually and have contributed to breakthrough treatments used in NHS hospitals nationwide.',
    category: 'health',
    isFeatured: true,
    subscriberCount: 142,
    totalReceived: 8420,
    events: [
      { title: 'Charity Golf Day 2026', description: 'Annual fundraising golf day at Gleneagles', date: new Date('2026-06-14'), location: 'Gleneagles, Scotland' }
    ]
  },
  {
    name: 'Green Futures',
    shortDescription: 'Protecting natural habitats and fighting climate change.',
    description: 'Green Futures plants trees, restores wetlands, and campaigns for stronger environmental policy. We have planted over 2 million trees across Britain and partner with schools to deliver environmental education programmes to 200,000 children each year.',
    category: 'environment',
    isFeatured: true,
    subscriberCount: 98,
    totalReceived: 5640,
    events: [
      { title: 'National Tree Planting Day', description: 'Community tree planting across 50 locations', date: new Date('2026-04-22'), location: 'Nationwide' }
    ]
  },
  {
    name: 'Scholar Bridge',
    shortDescription: 'Providing educational access to underprivileged young people.',
    description: 'Scholar Bridge believes that every child deserves access to quality education regardless of background. We fund university scholarships, provide mentoring programmes, and equip schools in deprived areas with modern learning technology.',
    category: 'education',
    isFeatured: false,
    subscriberCount: 76,
    totalReceived: 3900
  },
  {
    name: 'Sport for All',
    shortDescription: 'Making sport accessible to disabled and disadvantaged communities.',
    description: 'Sport for All removes barriers to participation in sport for disabled people and those from lower-income backgrounds. We fund adapted equipment, training facilities, and coaching programmes across 40 UK regions.',
    category: 'sports',
    isFeatured: false,
    subscriberCount: 55,
    totalReceived: 2800
  },
  {
    name: 'Community Roots',
    shortDescription: 'Building stronger local communities through shared spaces.',
    description: 'Community Roots transforms empty lots and neglected spaces into vibrant community hubs — gardens, sports courts, social clubs, and meeting rooms that bring neighbours together and reduce isolation.',
    category: 'community',
    isFeatured: false,
    subscriberCount: 40,
    totalReceived: 1960
  },
  {
    name: 'Second Chances',
    shortDescription: 'Rehabilitation and reintegration support for ex-offenders.',
    description: 'Second Chances provides skills training, employment support, and housing assistance to people leaving the criminal justice system. Our programmes have a 68% reduction in reoffending rate among participants.',
    category: 'community',
    isFeatured: false,
    subscriberCount: 28,
    totalReceived: 1320
  }
];

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Score.deleteMany({}),
      Charity.deleteMany({}),
      Draw.deleteMany({})
    ]);
    console.log('🧹 Cleared existing data');

    // Create charities
    const createdCharities = await Charity.insertMany(CHARITIES);
    console.log(`✅ Created ${createdCharities.length} charities`);

    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'GolfGive',
      email: 'admin@golfgive',
      password: 'admin1234',
      role: 'admin',
      subscription: { status: 'active', plan: 'yearly' }
    });
    console.log('✅ Admin user created: admin@golfgive.com / admin1234');

    // Create demo player
    const player = await User.create({
      firstName: 'Jamie',
      lastName: 'Fairway',
      email: 'player@demo.com',
      password: 'demo1234',
      role: 'user',
      subscription: {
        status: 'active',
        plan: 'monthly',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      charity: { selected: createdCharities[0]._id, contributionPercentage: 15 },
      winnings: { total: 250, pendingPayout: 250 }
    });

    // Create scores for demo player
    await Score.create({
      user: player._id,
      scores: [
        { value: 32, date: new Date('2026-03-22'), course: 'St Andrews Old Course' },
        { value: 28, date: new Date('2026-03-15'), course: 'Carnoustie' },
        { value: 35, date: new Date('2026-03-08'), course: 'Royal Birkdale' },
        { value: 22, date: new Date('2026-02-28'), course: 'Muirfield' },
        { value: 31, date: new Date('2026-02-20'), course: 'Turnberry' }
      ]
    });

    // Create 8 more subscriber users
    const subscribers = [];
    const scoreRanges = [
      [32, 28, 35, 22, 31], [18, 25, 30, 14, 22], [40, 38, 42, 36, 39],
      [15, 12, 20, 18, 10], [29, 33, 27, 31, 28], [22, 19, 24, 21, 17],
      [35, 38, 32, 36, 40], [11, 15, 13, 18, 12]
    ];
    const names = [
      ['Alex','Murray'],['Sam','Beckett'],['Emma','Thornton'],['Raj','Patel'],
      ['Fiona','Campbell'],['Tom','Harrison'],['Priya','Sharma'],['Marcus','White']
    ];

    for (let i = 0; i < 8; i++) {
      const u = await User.create({
        firstName: names[i][0],
        lastName: names[i][1],
        email: `${names[i][0].toLowerCase()}@demo.com`,
        password: 'demo1234',
        role: 'user',
        subscription: {
          status: 'active',
          plan: i % 2 === 0 ? 'monthly' : 'yearly',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        charity: {
          selected: createdCharities[i % createdCharities.length]._id,
          contributionPercentage: 10 + (i * 3)
        }
      });
      subscribers.push(u);

      await Score.create({
        user: u._id,
        scores: scoreRanges[i].map((v, j) => ({
          value: v,
          date: new Date(Date.now() - j * 7 * 24 * 60 * 60 * 1000),
          course: ['Augusta National','Pebble Beach','Royal Portrush','Wentworth','The Belfry'][j]
        }))
      });
    }
    console.log(`✅ Created ${subscribers.length + 1} subscriber users`);

    // Create a published draw for March 2026
    const drawnNumbers = [22, 28, 32, 35, 38];
    const allSubscribers = [player, ...subscribers];
    const totalPool = allSubscribers.length * 9.99 * 0.6;

    const drawWinners = [];
    for (const sub of allSubscribers) {
      const scoreDoc = await Score.findOne({ user: sub._id });
      if (!scoreDoc) continue;
      const userVals = scoreDoc.scores.map(s => s.value);
      const matched = drawnNumbers.filter(n => userVals.includes(n));
      if (matched.length >= 3) {
        const matchType = matched.length === 5 ? '5-match' : matched.length === 4 ? '4-match' : '3-match';
        drawWinners.push({ user: sub._id, matchType, matchedNumbers: matched, prizeAmount: matchType === '5-match' ? totalPool * 0.4 : matchType === '4-match' ? totalPool * 0.35 : totalPool * 0.25, verificationStatus: 'pending', paymentStatus: 'pending' });
      }
    }

    await Draw.create({
      month: 3,
      year: 2026,
      drawnNumbers,
      drawType: 'random',
      status: 'published',
      totalSubscribers: allSubscribers.length,
      totalPrizePool: totalPool,
      prizePools: {
        fiveMatch: { total: totalPool * 0.40 },
        fourMatch: { total: totalPool * 0.35 },
        threeMatch: { total: totalPool * 0.25 }
      },
      winners: drawWinners,
      publishedAt: new Date()
    });
    console.log(`✅ Published March 2026 draw with ${drawWinners.length} winner(s)`);

    console.log('\n🎉 Seed complete!\n');
    console.log('Demo credentials:');
    console.log('  Admin  → admin@golfgive.com / admin1234');
    console.log('  Player → player@demo.com / demo1234');
    console.log('\nAll subscriber emails: alex@demo.com, sam@demo.com, etc. / password: demo1234\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
