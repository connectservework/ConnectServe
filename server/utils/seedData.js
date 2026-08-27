const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Event = require('../models/Event');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const EventRegistration = require('../models/EventRegistration');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Review = require('../models/Review');

dotenv.config();

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany(),
      Event.deleteMany(),
      Post.deleteMany(),
      Comment.deleteMany(),
      EventRegistration.deleteMany(),
      Certificate.deleteMany(),
      Notification.deleteMany(),
      Conversation.deleteMany(),
      Message.deleteMany(),
      Review.deleteMany(),
    ]);

    console.log('[Seed] Creating demo users...');

    // 1. Admin
    const admin = await User.create({
      name: 'System Administrator',
      username: 'admin',
      email: 'admin@connectserve.org',
      password: 'password123',
      role: 'admin',
      avatar: {
        url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
        public_id: '',
      },
      bio: 'Platform supervisor & community director at ConnectServe.',
      location: 'San Francisco, CA',
    });

    // 2. Organizations
    const ngo1 = await User.create({
      name: 'Green Earth Initiative',
      username: 'greenearth',
      email: 'contact@greenearth.ngo',
      password: 'password123',
      role: 'organization',
      avatar: {
        url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=200&auto=format&fit=crop&q=80',
        public_id: '',
      },
      banner: {
        url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80',
        public_id: '',
      },
      bio: 'Leading environmental conservation, tree planting drives, and coastal cleanup missions worldwide.',
      location: 'Seattle, WA',
      orgDetails: {
        mission: 'To restore 1 million hectares of urban greenery and foster community environmental stewardship.',
        registrationNumber: 'NGO-US-2018-9482',
        isVerified: true,
        contactPerson: 'Laura Vance',
        foundedYear: 2018,
        category: 'Environment',
      },
      socialLinks: {
        website: 'https://greenearth.example.org',
        twitter: 'https://twitter.com/greenearth_ngo',
      },
    });

    const ngo2 = await User.create({
      name: 'City Food Bank & Relief',
      username: 'cityfoodbank',
      email: 'hello@foodbank.ngo',
      password: 'password123',
      role: 'organization',
      avatar: {
        url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=200&auto=format&fit=crop&q=80',
        public_id: '',
      },
      banner: {
        url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1200&auto=format&fit=crop&q=80',
        public_id: '',
      },
      bio: 'Fighting food insecurity by rescuing surplus meals and feeding vulnerable families daily.',
      location: 'Chicago, IL',
      orgDetails: {
        mission: 'No one in our city should go to bed hungry. Nutritious food is a human right.',
        registrationNumber: 'NGO-US-2015-3211',
        isVerified: true,
        contactPerson: 'Marcus Vance',
        foundedYear: 2015,
        category: 'Hunger & Poverty',
      },
      socialLinks: {
        website: 'https://cityfoodbank.example.org',
      },
    });

    const ngo3 = await User.create({
      name: 'Tech For Youth Foundation',
      username: 'techyouth',
      email: 'team@techyouth.ngo',
      password: 'password123',
      role: 'organization',
      avatar: {
        url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=200&auto=format&fit=crop&q=80',
        public_id: '',
      },
      bio: 'Bridging the digital divide by teaching coding, digital literacy, and STEM to underprivileged youth.',
      location: 'Austin, TX',
      orgDetails: {
        mission: 'Empowering future innovators through free computer science education and mentorship.',
        registrationNumber: 'NGO-US-2020-5674',
        isVerified: false, // unverified for admin testing!
        contactPerson: 'Priya Sharma',
        foundedYear: 2020,
        category: 'Education',
      },
    });

    // 3. Volunteers
    const vol1 = await User.create({
      name: 'Alex Morgan',
      username: 'alex_m',
      email: 'alex@volunteer.org',
      password: 'password123',
      role: 'user',
      avatar: {
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        public_id: '',
      },
      bio: 'Passionate eco-volunteer and software developer. Love tree planting and ocean conservation.',
      location: 'Seattle, WA',
      skills: ['Tree Planting', 'First Aid', 'Social Media', 'Mentoring', 'Web Design'],
      interests: ['Environment', 'Youth Empowerment', 'Animal Welfare'],
      volunteerHours: 36,
      badges: [
        { name: 'First Step', tier: 'Bronze', icon: 'Sparkles', description: 'Completed your very first volunteer hour with ConnectServe!' },
        { name: 'Bronze Volunteer', tier: 'Bronze', icon: 'Medal', description: 'Contributed over 10 hours of active community service.' },
        { name: 'Silver Volunteer', tier: 'Silver', icon: 'Award', description: 'Dedicated 25+ hours towards impactful social causes.' },
        { name: 'Earth Guardian', tier: 'Special', icon: 'Leaf', description: 'Participated in eco-conservation and environmental service.' },
      ],
      following: [ngo1._id, ngo2._id],
    });

    const vol2 = await User.create({
      name: 'Sarah Chen',
      username: 'sarah_chen',
      email: 'sarah@volunteer.org',
      password: 'password123',
      role: 'user',
      avatar: {
        url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
        public_id: '',
      },
      bio: 'Public health student & weekend community kitchen coordinator. Helping one meal at a time.',
      location: 'Chicago, IL',
      skills: ['Food Preparation', 'Logistics', 'Health Screening', 'Spanish Translation'],
      interests: ['Hunger & Poverty', 'Health & Wellness', 'Elderly Care'],
      volunteerHours: 54,
      badges: [
        { name: 'First Step', tier: 'Bronze', icon: 'Sparkles', description: 'Completed your very first volunteer hour with ConnectServe!' },
        { name: 'Bronze Volunteer', tier: 'Bronze', icon: 'Medal', description: 'Contributed over 10 hours of active community service.' },
        { name: 'Silver Volunteer', tier: 'Silver', icon: 'Award', description: 'Dedicated 25+ hours towards impactful social causes.' },
        { name: 'Gold Champion', tier: 'Gold', icon: 'Crown', description: 'Logged 50+ hours of service, inspiring the entire community.' },
        { name: 'Food Champion', tier: 'Special', icon: 'Utensils', description: 'Helped distribute meals and fight hunger in the community.' },
      ],
      following: [ngo2._id, vol1._id],
    });

    const vol3 = await User.create({
      name: 'Marcus Johnson',
      username: 'marcus_j',
      email: 'marcus@volunteer.org',
      password: 'password123',
      role: 'user',
      avatar: {
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        public_id: '',
      },
      bio: 'High school teacher & STEM mentor. Believer in the power of hands-on education.',
      location: 'Austin, TX',
      skills: ['Coding (Python/JS)', 'Math Tutoring', 'Curriculum Design', 'Public Speaking'],
      interests: ['Education', 'Youth Empowerment', 'Community Development'],
      volunteerHours: 18,
      badges: [
        { name: 'First Step', tier: 'Bronze', icon: 'Sparkles', description: 'Completed your very first volunteer hour with ConnectServe!' },
        { name: 'Bronze Volunteer', tier: 'Bronze', icon: 'Medal', description: 'Contributed over 10 hours of active community service.' },
        { name: 'Knowledge Torch', tier: 'Special', icon: 'BookOpen', description: 'Empowered youth and students through education volunteering.' },
      ],
      following: [ngo3._id, vol1._id],
    });

    // Update follow arrays
    ngo1.followers.push(vol1._id);
    ngo2.followers.push(vol1._id, vol2._id);
    ngo3.followers.push(vol3._id);
    vol1.followers.push(vol2._id, vol3._id);
    await Promise.all([ngo1.save(), ngo2.save(), ngo3.save(), vol1.save()]);

    console.log('[Seed] Creating Events...');

    // Event 1: Upcoming Tree Planting
    const event1 = await Event.create({
      organizer: ngo1._id,
      title: 'Emerald City Urban Forest & Tree Planting Drive',
      description: 'Join us at Discovery Park to plant over 300 native evergreen saplings! Help restore our local wildlife canopy, reduce urban heat islands, and learn essential tree planting & mulching techniques from certified arborists. Gloves, tools, and refreshments will be provided.',
      category: 'Environment',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // in 5 days
      time: '09:00 AM - 01:00 PM',
      location: 'Discovery Park - North Meadow, Seattle, WA',
      locationType: 'in-person',
      volunteerSlots: 35,
      registeredCount: 14,
      hoursGranted: 4,
      banner: {
        url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&auto=format&fit=crop&q=80',
        public_id: '',
      },
      requirements: ['Wear sturdy closed-toe boots', 'Bring a reusable water bottle', 'Ages 14+ (minors with guardian)'],
      skillsNeeded: ['Physical Endurance', 'Tree Planting', 'Teamwork'],
      status: 'upcoming',
      isFeatured: true,
      averageRating: 4.9,
      totalRatings: 18,
    });

    // Event 2: Upcoming Food Drive
    const event2 = await Event.create({
      organizer: ngo2._id,
      title: 'Community Food Pantry Sorting & Meal Packaging',
      description: 'Help us package over 1,500 emergency grocery kits for low-income families and senior citizens across Cook County. Tasks include categorizing canned goods, packing fresh produce, and quality checking care packages.',
      category: 'Hunger & Poverty',
      date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // in 8 days
      time: '10:00 AM - 02:00 PM',
      location: 'Grand Ave Warehouse, Chicago, IL',
      locationType: 'in-person',
      volunteerSlots: 25,
      registeredCount: 19,
      hoursGranted: 4,
      banner: {
        url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1200&auto=format&fit=crop&q=80',
        public_id: '',
      },
      requirements: ['Ability to lift up to 20 lbs', 'Hairnet and gloves provided on site'],
      skillsNeeded: ['Food Preparation', 'Organization', 'Logistics'],
      status: 'upcoming',
      averageRating: 4.8,
      totalRatings: 12,
    });

    // Event 3: Virtual Coding Bootcamp Mentorship
    const event3 = await Event.create({
      organizer: ngo3._id,
      title: 'Virtual Youth Code Jam: Python & Web Basics',
      description: 'Volunteer as a virtual breakout mentor! Guide middle and high school students through interactive game development in Python and basic HTML/CSS. No heavy tutoring experience needed—just enthusiasm for tech!',
      category: 'Education',
      date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      time: '01:00 PM - 04:00 PM EST',
      location: 'Zoom / Google Meet (Virtual)',
      locationType: 'virtual',
      volunteerSlots: 15,
      registeredCount: 8,
      hoursGranted: 3,
      banner: {
        url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
        public_id: '',
      },
      requirements: ['Laptop with stable WiFi connection', 'Basic knowledge of Python or JavaScript'],
      skillsNeeded: ['Python', 'HTML/CSS', 'Mentoring'],
      status: 'upcoming',
      averageRating: 5.0,
      totalRatings: 6,
    });

    // Event 4: Past Completed Event (for certificates and reviews demo)
    const event4 = await Event.create({
      organizer: ngo1._id,
      title: 'Puget Sound Shoreline & Beach Cleanup Drive',
      description: 'Completed coastal restoration initiative where volunteers removed 450 lbs of plastic pollution, marine debris, and microplastics from Alki Beach shorelines.',
      category: 'Environment',
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      time: '08:30 AM - 12:30 PM',
      location: 'Alki Beach Park, Seattle, WA',
      locationType: 'in-person',
      volunteerSlots: 40,
      registeredCount: 40,
      hoursGranted: 4,
      banner: {
        url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=1200&auto=format&fit=crop&q=80',
        public_id: '',
      },
      status: 'completed',
      averageRating: 4.9,
      totalRatings: 15,
    });

    console.log('[Seed] Creating Registrations & Certificates...');

    // Alex's registration and certificate for completed event 4
    await EventRegistration.create({
      event: event4._id,
      user: vol1._id,
      status: 'attended',
      attended: true,
      hoursLogged: 4,
      appliedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      attendanceMarkedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      certificateIssued: true,
      reviewGiven: true,
    });

    const cert1 = await Certificate.create({
      certificateCode: 'CS-2026-GRN-8492',
      user: vol1._id,
      event: event4._id,
      organization: ngo1._id,
      volunteerName: vol1.name,
      eventTitle: event4.title,
      organizationName: ngo1.name,
      hours: 4,
      issueDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      badgeAwarded: 'Earth Guardian',
    });

    // Review from Alex for Event 4
    await Review.create({
      event: event4._id,
      user: vol1._id,
      rating: 5,
      comment: 'Incredible event! Well organized, great safety precautions, and we made a tangible difference clearing 450 lbs of marine plastic. Highly recommended!',
    });

    // Sarah's registration for Event 4
    await EventRegistration.create({
      event: event4._id,
      user: vol2._id,
      status: 'attended',
      attended: true,
      hoursLogged: 4,
      certificateIssued: true,
    });

    await Certificate.create({
      certificateCode: 'CS-2026-GRN-9104',
      user: vol2._id,
      event: event4._id,
      organization: ngo1._id,
      volunteerName: vol2.name,
      eventTitle: event4.title,
      organizationName: ngo1.name,
      hours: 4,
      issueDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      badgeAwarded: 'Verified Community Volunteer',
    });

    // Alex registered for upcoming Event 1
    await EventRegistration.create({
      event: event1._id,
      user: vol1._id,
      status: 'approved',
      notes: 'Excited to help plant trees again with the team!',
    });

    // Sarah registered for upcoming Event 2
    await EventRegistration.create({
      event: event2._id,
      user: vol2._id,
      status: 'approved',
    });

    // Marcus registered for Event 3
    await EventRegistration.create({
      event: event3._id,
      user: vol3._id,
      status: 'pending',
      notes: 'Experienced computer science instructor ready to guide high school students.',
    });

    console.log('[Seed] Creating Social Posts & Comments...');

    // Post 1 by Alex
    const post1 = await Post.create({
      author: vol1._id,
      content: '🌱 Spent this past weekend with the Green Earth Initiative planting saplings at Discovery Park. Planting trees is not just about today—it is an investment in clean air and biodiversity for future generations! What community drives are you joining this month? #GreenEarth #Volunteering #CommunityService #EcoWarrior',
      media: {
        url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1000&auto=format&fit=crop&q=80',
        public_id: '',
        mediaType: 'image',
      },
      likes: [vol2._id, vol3._id, ngo1._id],
      commentsCount: 2,
      eventTag: event1._id,
      tags: ['greenearth', 'volunteering', 'communityservice', 'ecowarrior'],
      location: 'Seattle, WA',
    });

    // Comments on Post 1
    await Comment.create({
      post: post1._id,
      author: ngo1._id,
      content: 'Thank you Alex! Your leadership during the planting session was phenomenal. See you at the upcoming Saturday drive!',
    });

    await Comment.create({
      post: post1._id,
      author: vol2._id,
      content: 'Inspiring work Alex! Can’t wait to join the next environmental drive together!',
    });

    // Post 2 by City Food Bank (NGO)
    const post2 = await Post.create({
      author: ngo2._id,
      content: '📦 Milestone Alert: Over 12,000 nutritious meals distributed this month across 8 neighborhoods! A heartfelt thank you to all our selfless volunteers who packed boxes, drove delivery vans, and brought smiles to families in need. Together we rise! ❤️ #FoodSecurity #ZeroHunger #CommunityFirst',
      media: {
        url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1000&auto=format&fit=crop&q=80',
        public_id: '',
        mediaType: 'image',
      },
      likes: [vol1._id, vol2._id, admin._id],
      commentsCount: 1,
      eventTag: event2._id,
      tags: ['foodsecurity', 'zerohunger', 'communityfirst'],
      location: 'Chicago, IL',
    });

    await Comment.create({
      post: post2._id,
      author: vol1._id,
      content: 'So proud to support this initiative! Keep up the incredible mission.',
    });

    // Post 3 by Sarah
    await Post.create({
      author: vol2._id,
      content: 'Just received my Gold Champion milestone badge on ConnectServe! 50+ hours of community service and every single hour has taught me resilience, gratitude, and true teamwork. Get involved in your local community—it changes everything!',
      media: {
        url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1000&auto=format&fit=crop&q=80',
        public_id: '',
        mediaType: 'image',
      },
      likes: [vol1._id, vol3._id, ngo2._id, admin._id],
      commentsCount: 0,
      tags: ['milestone', 'goldbadge', 'volunteerhours', 'impact'],
      location: 'Chicago, IL',
    });

    console.log('[Seed] Creating Direct Chat conversation...');
    const conversation1 = await Conversation.create({
      participants: [vol1._id, ngo1._id],
      lastMessageText: 'Hi Alex! We confirmed your volunteer slot for this Saturday’s tree planting drive.',
      lastMessageAt: new Date(),
    });

    await Message.create({
      conversation: conversation1._id,
      sender: ngo1._id,
      recipient: vol1._id,
      text: 'Hi Alex! We confirmed your volunteer slot for this Saturday’s tree planting drive.',
      isRead: true,
    });

    console.log('[Seed] Creating Notifications...');
    await Notification.create({
      recipient: vol1._id,
      sender: ngo1._id,
      type: 'certificate_issued',
      title: 'Digital Certificate Issued! 🏆',
      message: 'You earned 4 volunteer hours and an official certificate for "Puget Sound Shoreline & Beach Cleanup Drive".',
      entityId: cert1._id,
      entityType: 'certificate',
      link: '/certificates',
      isRead: false,
    });

    await Notification.create({
      recipient: vol1._id,
      sender: vol2._id,
      type: 'like',
      title: 'New Like',
      message: 'Sarah Chen liked your post.',
      entityId: post1._id,
      entityType: 'post',
      link: `/posts/${post1._id}`,
      isRead: true,
    });

    console.log('[Seed] Database seeding completed successfully! ✨');
    console.log('--- Demo Accounts ---');
    console.log('Admin:        admin@connectserve.org  /  password123');
    console.log('NGO 1 (Verified): contact@greenearth.ngo  /  password123');
    console.log('NGO 2 (Verified): hello@foodbank.ngo      /  password123');
    console.log('NGO 3 (Unverified): team@techyouth.ngo   /  password123');
    console.log('Volunteer 1:  alex@volunteer.org      /  password123');
    console.log('Volunteer 2:  sarah@volunteer.org     /  password123');
    console.log('Volunteer 3:  marcus@volunteer.org    /  password123');
    console.log('---------------------');

    if (require.main === module) {
      await disconnectDB();
      process.exit(0);
    }
  } catch (error) {
    console.error('[Seed Error]', error);
    if (require.main === module) {
      await disconnectDB();
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
