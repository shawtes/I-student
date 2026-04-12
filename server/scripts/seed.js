// Demo data seeder. Run: node server/scripts/seed.js
// Creates tutors, students, availability, bookings, forum posts, tickets.
// Idempotent — uses upsert by email where possible.

require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const Availability = require('../models/Availability');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const ForumPost = require('../models/ForumPost');
const ForumReply = require('../models/ForumReply');
const Ticket = require('../models/Ticket');
const Conversation = require('../models/Conversation');
const Flashcard = require('../models/Flashcard');
const StudySession = require('../models/StudySession');

const DEMO_TUTORS = [
  {
    cognitoId: 'demo-tutor-1',
    email: 'maya.chen@demo.gsu.edu',
    name: 'Maya Chen',
    role: 'tutor',
    subjects: ['CSC 1301', 'CSC 1302', 'CSC 2720'],
    hourlyRate: 28,
    learningPrefs: ['visual', 'hands-on'],
    bio: 'CS senior, peer tutor for 2 years. Specializing in intro programming and data structures.',
    ratingAverage: 4.9, ratingCount: 47,
    availability: [
      { day: 'Mon', startTime: '10:00', endTime: '12:00' },
      { day: 'Wed', startTime: '14:00', endTime: '17:00' },
      { day: 'Fri', startTime: '09:00', endTime: '11:00' },
    ]
  },
  {
    cognitoId: 'demo-tutor-2',
    email: 'james.patel@demo.gsu.edu',
    name: 'James Patel',
    role: 'tutor',
    subjects: ['MATH 2211', 'MATH 2212', 'MATH 2641'],
    hourlyRate: 32,
    learningPrefs: ['discussion', 'visual'],
    bio: 'Math grad student. Calc I, II, and Linear Algebra. Can also help with proofs.',
    ratingAverage: 4.7, ratingCount: 31,
    availability: [
      { day: 'Tue', startTime: '13:00', endTime: '18:00' },
      { day: 'Thu', startTime: '13:00', endTime: '18:00' },
    ]
  },
  {
    cognitoId: 'demo-tutor-3',
    email: 'sarah.johnson@demo.gsu.edu',
    name: 'Sarah Johnson',
    role: 'tutor',
    subjects: ['BIOL 2107', 'BIOL 2108', 'CHEM 1211'],
    hourlyRate: 25,
    learningPrefs: ['hands-on', 'flashcards'],
    bio: 'Pre-med junior. Cell biology and gen chem are my specialties.',
    ratingAverage: 4.8, ratingCount: 22,
    availability: [
      { day: 'Mon', startTime: '15:00', endTime: '18:00' },
      { day: 'Wed', startTime: '10:00', endTime: '12:00' },
      { day: 'Sat', startTime: '11:00', endTime: '14:00' },
    ]
  },
  {
    cognitoId: 'demo-tutor-4',
    email: 'david.kim@demo.gsu.edu',
    name: 'David Kim',
    role: 'tutor',
    subjects: ['PHYS 2211', 'PHYS 2212', 'MATH 2215'],
    hourlyRate: 30,
    learningPrefs: ['visual', 'hands-on'],
    bio: 'Physics PhD candidate. Calculus-based physics and vector calc.',
    ratingAverage: 4.6, ratingCount: 18,
    availability: [
      { day: 'Tue', startTime: '09:00', endTime: '12:00' },
      { day: 'Fri', startTime: '13:00', endTime: '17:00' },
    ]
  },
  {
    cognitoId: 'demo-tutor-5',
    email: 'aisha.williams@demo.gsu.edu',
    name: 'Aisha Williams',
    role: 'tutor',
    subjects: ['ECON 2105', 'ECON 2106', 'ACCT 2101'],
    hourlyRate: 26,
    learningPrefs: ['discussion'],
    bio: 'Business senior. Macro, micro, and financial accounting fundamentals.',
    ratingAverage: 4.9, ratingCount: 38,
    availability: [
      { day: 'Mon', startTime: '18:00', endTime: '21:00' },
      { day: 'Wed', startTime: '18:00', endTime: '21:00' },
    ]
  },
  {
    cognitoId: 'demo-tutor-6',
    email: 'ryan.brooks@demo.gsu.edu',
    name: 'Ryan Brooks',
    role: 'tutor',
    subjects: ['ENGL 1101', 'ENGL 1102', 'HIST 2110'],
    hourlyRate: 22,
    learningPrefs: ['discussion'],
    bio: 'English MA student. Essay writing, research papers, and US history.',
    ratingAverage: 4.5, ratingCount: 27,
    availability: [
      { day: 'Thu', startTime: '10:00', endTime: '14:00' },
      { day: 'Sun', startTime: '13:00', endTime: '17:00' },
    ]
  },
];

const DEMO_STUDENTS = [
  { cognitoId: 'demo-student-1', email: 'alex.martinez@demo.gsu.edu', name: 'Alex Martinez', role: 'student', courses: ['CSC 1301', 'MATH 2211', 'ENGL 1101'], major: 'Computer Science', year: 'Freshman' },
  { cognitoId: 'demo-student-2', email: 'priya.singh@demo.gsu.edu', name: 'Priya Singh', role: 'student', courses: ['BIOL 2107', 'CHEM 1211', 'MATH 1113'], major: 'Biology', year: 'Sophomore' },
  { cognitoId: 'demo-student-3', email: 'marcus.thompson@demo.gsu.edu', name: 'Marcus Thompson', role: 'student', courses: ['CSC 2720', 'MATH 2212', 'PHYS 2211'], major: 'Computer Science', year: 'Junior' },
  { cognitoId: 'demo-student-4', email: 'emma.garcia@demo.gsu.edu', name: 'Emma Garcia', role: 'student', courses: ['ECON 2105', 'ACCT 2101', 'MATH 1113'], major: 'Business', year: 'Sophomore' },
  { cognitoId: 'demo-student-5', email: 'noah.roberts@demo.gsu.edu', name: 'Noah Roberts', role: 'student', courses: ['ENGL 1102', 'HIST 2110', 'POLS 1101'], major: 'Political Science', year: 'Freshman' },
];

const DEMO_ADMIN = {
  cognitoId: 'demo-admin-1',
  email: 'admin@demo.gsu.edu',
  name: 'Jordan Lee',
  role: 'admin'
};

const DEMO_POSTS = [
  { title: 'Best way to study for CSC 1301 midterm?', body: 'Midterm is next week. Anyone have tips on recursion problems? I keep getting stuck on base cases.', category: 'Computer Science', authorIdx: 0 },
  { title: 'MATH 2211 - limits question', body: 'Can someone help me understand L\'Hopital\'s rule? The textbook explanation is confusing.', category: 'Mathematics', authorIdx: 2 },
  { title: 'Study group forming for BIOL 2107', body: 'Looking for 2-3 people to meet Wednesdays at the library. Focus on cell respiration and photosynthesis.', category: 'Science', authorIdx: 1 },
  { title: 'Effective note-taking strategies', body: 'What do you all use? I\'ve been trying Cornell method but curious about Zettelkasten.', category: 'Study Tips', authorIdx: 4 },
  { title: 'ECON 2105 essay topic ideas?', body: 'Need to pick a topic for the final paper. Professor wants something current. Any suggestions on recent economic events to cover?', category: 'General', authorIdx: 3 },
  { title: 'Tutor recommendations for Calc II?', body: 'Struggling with integration techniques. Looking for a good tutor who can meet evenings.', category: 'Tutoring', authorIdx: 2 },
];

const DEMO_REPLIES = [
  { postIdx: 0, authorIdx: 2, body: 'Practice with the "smaller problem" framing. Every recursive call should make the input smaller until you hit a base case.' },
  { postIdx: 0, authorIdx: 4, body: 'I made flashcards with recursive patterns. Happy to share if you want.' },
  { postIdx: 1, authorIdx: 0, body: 'James Patel is a great tutor for this. He broke it down for me in like 20 minutes.' },
  { postIdx: 2, authorIdx: 3, body: 'Interested! I have Wednesdays free after 4pm.' },
  { postIdx: 5, authorIdx: 1, body: 'Check out Maya Chen or James Patel. Both have good reviews for math.' },
];

const DEMO_TICKETS = [
  { authorIdx: 0, subject: 'Can\'t upload PDF larger than 50MB', description: 'Tried uploading my lecture recording but it fails silently. The file is 80MB.', category: 'Bug Report' },
  { authorIdx: 3, subject: 'How do I cancel a tutoring session?', description: 'Booked a session but something came up. Where is the cancel button?', category: 'Tutoring Issue' },
  { authorIdx: 2, subject: 'Feature request: dark mode', description: 'Would love a dark mode option, especially for late-night study sessions.', category: 'Feature Request' },
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  const ALL = [...DEMO_TUTORS, ...DEMO_STUDENTS, DEMO_ADMIN];

  // Users (upsert by email)
  console.log('Seeding users...');
  const userDocs = {};
  for (const u of ALL) {
    const doc = await User.findOneAndUpdate(
      { email: u.email },
      { $set: u },
      { upsert: true, new: true }
    );
    userDocs[u.cognitoId] = doc;
    console.log(`  ${doc.role.padEnd(8)} ${doc.name} (${doc.email})`);
  }

  // Availability for tutors
  console.log('Seeding availability...');
  for (const t of DEMO_TUTORS) {
    const tutor = userDocs[t.cognitoId];
    await Availability.deleteMany({ tutor: tutor._id });
    if (t.availability) {
      for (const slot of t.availability) {
        await Availability.create({ tutor: tutor._id, ...slot });
      }
    }
  }

  // Bookings: student 1 has a confirmed session with tutor 1, student 2 has pending with tutor 3
  console.log('Seeding bookings...');
  await Booking.deleteMany({ student: { $in: Object.values(userDocs).map(u => u._id) } });
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(10, 0, 0, 0);

  const b1 = await Booking.create({
    student: userDocs['demo-student-1']._id,
    tutor: userDocs['demo-tutor-1']._id,
    subject: 'CSC 1301',
    startTime: nextWeek,
    durationMinutes: 60,
    status: 'confirmed',
  });
  const p1 = await Payment.create({
    booking: b1._id,
    student: userDocs['demo-student-1']._id,
    amount: 28,
    method: 'card',
    status: 'succeeded'
  });
  b1.payment = p1._id; await b1.save();

  const inTwoDays = new Date();
  inTwoDays.setDate(inTwoDays.getDate() + 2);
  inTwoDays.setHours(15, 0, 0, 0);

  await Booking.create({
    student: userDocs['demo-student-2']._id,
    tutor: userDocs['demo-tutor-3']._id,
    subject: 'BIOL 2107',
    startTime: inTwoDays,
    durationMinutes: 60,
    status: 'pending',
  });

  const completedDate = new Date();
  completedDate.setDate(completedDate.getDate() - 5);
  const b3 = await Booking.create({
    student: userDocs['demo-student-3']._id,
    tutor: userDocs['demo-tutor-2']._id,
    subject: 'MATH 2212',
    startTime: completedDate,
    durationMinutes: 90,
    status: 'completed',
  });
  const p3 = await Payment.create({
    booking: b3._id,
    student: userDocs['demo-student-3']._id,
    amount: 48,
    method: 'card',
    status: 'succeeded'
  });
  b3.payment = p3._id; await b3.save();

  // Add more completed sessions across tutors for richer earnings demo
  const pastDates = [3, 8, 12, 17, 22].map(days => {
    const d = new Date(); d.setDate(d.getDate() - days); d.setHours(10 + (days % 6), 0, 0, 0); return d;
  });
  const extraSessions = [
    { studentIdx: 1, tutorIdx: 0, subject: 'CSC 1302', amount: 28 },
    { studentIdx: 2, tutorIdx: 0, subject: 'CSC 1301', amount: 28 },
    { studentIdx: 3, tutorIdx: 4, subject: 'ECON 2105', amount: 26 },
    { studentIdx: 4, tutorIdx: 5, subject: 'ENGL 1102', amount: 22 },
    { studentIdx: 0, tutorIdx: 0, subject: 'CSC 1301', amount: 28 },
  ];
  for (let i = 0; i < extraSessions.length; i++) {
    const s = extraSessions[i];
    const sKey = 'demo-student-' + (s.studentIdx + 1);
    const tKey = 'demo-tutor-' + (s.tutorIdx + 1);
    const booking = await Booking.create({
      student: userDocs[sKey]._id,
      tutor: userDocs[tKey]._id,
      subject: s.subject,
      startTime: pastDates[i],
      durationMinutes: 60,
      status: 'completed',
    });
    const payment = await Payment.create({
      booking: booking._id,
      student: userDocs[sKey]._id,
      amount: s.amount,
      method: 'card',
      status: 'succeeded'
    });
    booking.payment = payment._id;
    await booking.save();
  }

  // Forum posts + replies
  console.log('Seeding forum...');
  await ForumPost.deleteMany({ author_id: { $in: DEMO_STUDENTS.map(s => s.cognitoId) } });
  await ForumReply.deleteMany({ author_id: { $in: DEMO_STUDENTS.map(s => s.cognitoId) } });
  const postDocs = [];
  for (const p of DEMO_POSTS) {
    const author = DEMO_STUDENTS[p.authorIdx];
    const post = await ForumPost.create({
      author_id: author.cognitoId,
      author_name: author.name,
      author_role: 'student',
      title: p.title,
      body: p.body,
      category: p.category,
    });
    postDocs.push(post);
  }
  for (const r of DEMO_REPLIES) {
    const author = DEMO_STUDENTS[r.authorIdx];
    await ForumReply.create({
      post_id: postDocs[r.postIdx]._id,
      author_id: author.cognitoId,
      author_name: author.name,
      author_role: 'student',
      body: r.body,
    });
    await ForumPost.findByIdAndUpdate(postDocs[r.postIdx]._id, { $inc: { reply_count: 1 } });
  }

  // Help tickets
  console.log('Seeding tickets...');
  await Ticket.deleteMany({ author_id: { $in: DEMO_STUDENTS.map(s => s.cognitoId) } });
  for (const t of DEMO_TICKETS) {
    const author = DEMO_STUDENTS[t.authorIdx];
    await Ticket.create({
      author_id: author.cognitoId,
      author_name: author.name,
      author_email: author.email,
      author_role: 'student',
      subject: t.subject,
      description: t.description,
      category: t.category,
      messages: [{
        sender_id: author.cognitoId,
        sender_name: author.name,
        sender_role: 'student',
        body: t.description,
      }],
    });
  }

  // A sample conversation for demo student 1
  console.log('Seeding conversations...');
  await Conversation.deleteMany({ userId: { $in: DEMO_STUDENTS.map(s => s.cognitoId) } });
  await Conversation.create({
    userId: 'demo-student-1',
    title: 'Recursion help',
    folder: 'CSC 1301',
    messages: [
      { role: 'user', content: 'Can you explain how recursion works with an example?' },
      { role: 'assistant', content: 'Recursion is when a function calls itself to solve a smaller version of a problem.\n\nClassic example - factorial:\n\n```\nfunction factorial(n) {\n  if (n <= 1) return 1;       // base case\n  return n * factorial(n - 1); // recursive case\n}\n```\n\nEach call makes the input smaller until we hit the base case, then the results stack back up.' },
    ]
  });

  // Sample flashcards
  console.log('Seeding flashcards...');
  await Flashcard.deleteMany({ owner: { $in: Object.values(userDocs).map(u => u._id) } });
  const student1 = userDocs['demo-student-1'];
  const cscCards = [
    { q: 'What is a variable?', a: 'A named storage location that holds a value which can change.' },
    { q: 'What is the difference between == and === in JavaScript?', a: '== compares with type coercion, === compares value and type strictly.' },
    { q: 'What is a function?', a: 'A reusable block of code that performs a specific task, optionally taking parameters and returning a value.' },
    { q: 'What is a loop?', a: 'A control flow structure that repeats a block of code while or until a condition is met.' },
    { q: 'What is recursion?', a: 'When a function calls itself to solve a smaller instance of the same problem.' },
  ];
  for (const c of cscCards) {
    await Flashcard.create({
      owner: student1._id,
      deck: 'CSC 1301 Fundamentals',
      topic: 'Programming basics',
      question: c.q,
      answer: c.a,
      source: 'manual'
    });
  }

  // Study session on the calendar
  console.log('Seeding study sessions...');
  await StudySession.deleteMany({ userId: { $in: DEMO_STUDENTS.map(s => s.cognitoId) } });
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0);
  await StudySession.create({
    userId: 'demo-student-1',
    title: 'Review recursion problems',
    folder: 'CSC 1301',
    startTime: tomorrow,
    endTime: new Date(tomorrow.getTime() + 90 * 60000),
    type: 'study',
    color: '#2d5be3'
  });

  const examDay = new Date();
  examDay.setDate(examDay.getDate() + 5);
  examDay.setHours(10, 0, 0, 0);
  await StudySession.create({
    userId: 'demo-student-1',
    title: 'CSC 1301 Midterm',
    folder: 'CSC 1301',
    startTime: examDay,
    endTime: new Date(examDay.getTime() + 90 * 60000),
    type: 'exam',
    color: '#dc2626'
  });

  console.log('\nDone. Demo accounts:');
  console.log('  Admin:    admin@demo.gsu.edu');
  DEMO_TUTORS.forEach(t => console.log(`  Tutor:    ${t.email} (${t.subjects.join(', ')})`));
  DEMO_STUDENTS.forEach(s => console.log(`  Student:  ${s.email} (${s.courses.join(', ')})`));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
