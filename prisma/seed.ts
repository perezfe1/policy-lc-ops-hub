import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_CHECKLIST_ITEMS = [
  "Confirm room/venue is unlocked and set up",
  "Test A/V equipment (mic, projector, screen)",
  "Set up catering / food display",
  "Print and post directional signage",
  "Prepare sign-in sheet or QR code",
  "Greet and brief speaker",
  "Assign door greeter / welcome person",
  "Take event photos",
  "Collect attendee headcount",
  "Clean up after event",
];

async function main() {
  console.log('🌱 Seeding database...\n');

  const hash = await bcrypt.hash('password', 10);

  // ── Users ──
  const admin = await prisma.user.upsert({
    where: { email: 'admin@yale.edu' },
    update: {},
    create: { email: 'admin@yale.edu', name: 'Admin User', passwordHash: hash, role: 'ADMIN' },
  });

  const lead = await prisma.user.upsert({
    where: { email: 'lead@yale.edu' },
    update: {},
    create: { email: 'lead@yale.edu', name: 'LC Lead', passwordHash: hash, role: 'LC_LEAD' },
  });

  const lead2 = await prisma.user.upsert({
    where: { email: 'lead2@yale.edu' },
    update: {},
    create: { email: 'lead2@yale.edu', name: 'LC Lead 2', passwordHash: hash, role: 'LC_LEAD' },
  });

  const finance = await prisma.user.upsert({
    where: { email: 'finance@yale.edu' },
    update: {},
    create: { email: 'finance@yale.edu', name: 'Finance Approver', passwordHash: hash, role: 'FINANCE' },
  });

  const paymentAdmin = await prisma.user.upsert({
    where: { email: 'payment@yale.edu' },
    update: {},
    create: { email: 'payment@yale.edu', name: 'Cristina Violano', passwordHash: hash, role: 'PAYMENT_ADMIN' },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@yale.edu' },
    update: {},
    create: { email: 'member@yale.edu', name: 'Team Member', passwordHash: hash, role: 'MEMBER' },
  });

  console.log('✅ Users created:');
  console.log('   admin@yale.edu     (ADMIN)');
  console.log('   lead@yale.edu      (LC_LEAD)');
  console.log('   lead2@yale.edu     (LC_LEAD)');
  console.log('   finance@yale.edu   (FINANCE)');
  console.log('   payment@yale.edu   (PAYMENT_ADMIN - Cristina)');
  console.log('   member@yale.edu    (MEMBER)');
  console.log('   All passwords: "password"\n');

  // ── Academic Year ──
  const ay = await prisma.academicYear.create({
    data: {
      label: '2025-2026',
      startMonth: 9,
      startYear: 2025,
      endMonth: 8,
      endYear: 2026,
      isCurrent: true,
      budget: 15000,
    },
  });

  console.log('✅ Academic Year: 2025-2026 (budget: $15,000)\n');

  // ── Event 1: PLANNING, catering pending approval ──
  const event1 = await prisma.event.create({
    data: {
      title: 'Climate Policy & Environmental Justice Panel',
      description: 'A panel featuring experts on the intersection of climate policy and environmental justice in frontline communities.',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      time: '12:00 PM - 1:30 PM',
      location: 'Kroon Hall, Burke Auditorium',
      status: 'PLANNING',
      tags: 'NATIONAL',
      semester: 'Spring 2026',
      isOnCampus: true,
      speakerName: 'Dr. Maria Santos',
      speakerEmail: 'msantos@example.edu',
      speakerPhone: '(202) 555-0142',
      speakerOrg: 'Georgetown Climate Center',
      pocName: 'Lisa Chen',
      pocEmail: 'lchen@georgetown.edu',
      pocPhone: '(202) 555-0199',
      budgetAmount: 1200,
      createdById: lead.id,
      assigneeId: member.id,
      academicYearId: ay.id,
      catering: {
        create: {
          status: 'AWAITING_APPROVAL',
          vendor: 'Bon Appétit',
          estimatedCost: 450,
          menuDetails: 'Mediterranean lunch buffet with vegetarian and gluten-free options',
          dietaryNotes: '2 vegan, 1 nut allergy',
          headcount: 35,
          ezCaterLink: 'https://www.ezcater.com/order/12345',
          assigneeId: lead.id,
          acceptedAt: new Date(),
          submittedAt: new Date(),
        },
      },
      room: {
        create: {
          roomName: 'Burke Auditorium',
          status: 'CONFIRMED',
          confirmationId: 'YSE-2026-0142',
          confirmedAt: new Date(),
          assigneeId: lead2.id,
          acceptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      },
      flyer: {
        create: {
          assigneeId: lead.id,
          acceptedAt: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          designStatus: 'IN_PROGRESS',
          distEmail: true,
          distYaleConnect: true,
        },
      },
    },
  });

  await prisma.dayOfChecklist.create({
    data: {
      eventId: event1.id,
      items: { create: DEFAULT_CHECKLIST_ITEMS.map((label, i) => ({ label, sortOrder: i, isCustom: false })) },
    },
  });

  await prisma.expense.create({
    data: { eventId: event1.id, description: 'Speaker travel reimbursement', amount: 280, category: 'TRAVEL', vendor: 'Amtrak', isPaid: false },
  });

  console.log('✅ Event 1: Climate Policy Panel (PLANNING)');

  // ── Event 2: READY, catering approved, payment requested ──
  const event2 = await prisma.event.create({
    data: {
      title: 'Sustainable Finance Lunch Talk',
      description: 'An intimate lunch discussion on ESG investing trends and impact measurement.',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      time: '12:00 PM - 1:00 PM',
      location: 'Sage Hall, Room 24',
      status: 'READY',
      tags: 'INTERNATIONAL',
      semester: 'Spring 2026',
      isOnCampus: true,
      isHybrid: true,
      virtualLink: 'https://yale.zoom.us/j/123456789',
      speakerName: 'James Okafor',
      speakerEmail: 'jokafor@greenfinance.org',
      speakerPhone: '+44 20 7946 0958',
      speakerOrg: 'Green Finance Institute',
      budgetAmount: 800,
      createdById: admin.id,
      assigneeId: lead.id,
      academicYearId: ay.id,
      catering: {
        create: {
          status: 'APPROVED',
          vendor: 'Harvest Kitchen',
          estimatedCost: 320,
          actualCost: 310,
          menuDetails: 'Sandwich platters + salads',
          headcount: 25,
          assigneeId: lead.id,
          acceptedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          decidedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          decidedById: finance.id,
          paymentStatus: 'REQUESTED',
        },
      },
      room: {
        create: {
          roomName: 'Sage Hall, Room 24',
          status: 'CONFIRMED',
          confirmationId: 'YSE-2026-0155',
          confirmedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          assigneeId: lead2.id,
          acceptedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      },
      flyer: {
        create: {
          assigneeId: lead.id,
          acceptedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          designStatus: 'DONE',
          flyerUrl: 'https://example.com/flyer-sustainable-finance.pdf',
          distYaleConnect: true, distEmail: true, distWhatsApp: true, distTeams: true,
        },
      },
    },
  });

  await prisma.dayOfChecklist.create({
    data: {
      eventId: event2.id,
      items: { create: DEFAULT_CHECKLIST_ITEMS.map((label, i) => ({ label, sortOrder: i, isCustom: false })) },
    },
  });

  await prisma.expense.createMany({
    data: [
      { eventId: event2.id, description: 'Catering deposit', amount: 155, category: 'CATERING', vendor: 'Harvest Kitchen', isPaid: true, paidDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { eventId: event2.id, description: 'Printed programs', amount: 45, category: 'PRINTING', vendor: 'Yale Print Shop', isPaid: true, paidDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    ],
  });

  console.log('✅ Event 2: Sustainable Finance Talk (READY)');

  // ── Event 3: COMPLETED with retrospective ──
  const event3 = await prisma.event.create({
    data: {
      title: 'Water Policy in the American West',
      description: 'A seminar exploring water rights, drought policy, and indigenous water sovereignty.',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      time: '4:00 PM - 5:30 PM',
      location: 'Kroon Hall, Bowers Auditorium',
      status: 'COMPLETED',
      tags: 'NATIONAL,LOCAL',
      semester: 'Spring 2026',
      isOnCampus: true,
      speakerName: 'Prof. Lena Whitehorse',
      speakerEmail: 'lwhitehorse@stanford.edu',
      speakerPhone: '(650) 555-0173',
      speakerOrg: 'Stanford Water in the West',
      pocName: 'David Kim',
      pocEmail: 'dkim@stanford.edu',
      pocPhone: '(650) 555-0188',
      budgetAmount: 1500,
      headcount: 52,
      doAgain: true,
      reinviteSpeaker: true,
      retrospectiveNotes: 'Excellent turnout and engagement. Standing room only — consider larger venue next time. Q&A ran 15 min over, audience loved it.',
      createdById: lead.id,
      assigneeId: lead.id,
      academicYearId: ay.id,
      catering: {
        create: {
          status: 'APPROVED',
          vendor: 'Bon Appétit',
          estimatedCost: 280,
          actualCost: 295,
          menuDetails: 'Coffee & pastries reception',
          headcount: 40,
          assigneeId: lead.id,
          acceptedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
          submittedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          decidedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
          decidedById: finance.id,
          paymentStatus: 'PAID',
          paidById: paymentAdmin.id,
          paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          paymentNote: 'Payment processed via P-card. Done!',
        },
      },
      room: {
        create: {
          roomName: 'Bowers Auditorium',
          status: 'CONFIRMED',
          confirmationId: 'YSE-2026-0128',
          confirmedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          assigneeId: lead2.id,
          acceptedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
        },
      },
      flyer: {
        create: {
          assigneeId: lead.id,
          acceptedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
          designStatus: 'DONE',
          flyerUrl: 'https://example.com/flyer-water-policy.pdf',
          distYaleConnect: true, distEmail: true, distWhatsApp: true,
        },
      },
    },
  });

  await prisma.expense.createMany({
    data: [
      { eventId: event3.id, description: 'Catering', amount: 295, category: 'CATERING', vendor: 'Bon Appétit', isPaid: true, paidDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      { eventId: event3.id, description: 'Speaker honorarium', amount: 500, category: 'SPEAKER_FEE', isPaid: true, paidDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { eventId: event3.id, description: 'Speaker flight', amount: 385, category: 'TRAVEL', vendor: 'United Airlines', isPaid: true, paidDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ],
  });

  console.log('✅ Event 3: Water Policy (COMPLETED)');

  // ── Event 4: DRAFT, minimal ──
  await prisma.event.create({
    data: {
      title: 'Biodiversity & Conservation Finance Workshop',
      description: 'Workshop on innovative financing mechanisms for biodiversity conservation.',
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      time: '2:00 PM - 4:00 PM',
      location: 'TBD',
      status: 'DRAFT',
      tags: 'INTERNATIONAL',
      semester: 'Spring 2026',
      isVirtual: true,
      virtualLink: 'https://yale.zoom.us/j/987654321',
      isOnCampus: false,
      budgetAmount: 500,
      createdById: member.id,
      academicYearId: ay.id,
    },
  });

  console.log('✅ Event 4: Biodiversity Workshop (DRAFT, virtual)');

  console.log('\n🎉 Seeding complete! Log in at http://localhost:3000/login');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
