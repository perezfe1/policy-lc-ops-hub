# 🏛️ Policy LC Ops Hub

**Event operations management system for the Yale YSE Policy Learning Community**

Built with Next.js 14, TypeScript, Tailwind CSS, Prisma + SQLite, and NextAuth.

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- **Node.js 18+** — Download from https://nodejs.org (choose the LTS version)
- A code editor like VS Code — https://code.visualstudio.com

### Step-by-step Setup

**1. Unzip and open the project**
```bash
# Unzip the download, then open a terminal in that folder
cd policy-lc-ops-hub
```

**2. Install dependencies**
```bash
npm install
```
This will take 1-2 minutes. You'll see a progress bar.

**3. Create your environment file**
```bash
cp .env.example .env
```
Then open `.env` in your editor and set a secret key:
```
NEXTAUTH_SECRET=any-random-string-at-least-32-characters-long-here
```
(Tip: just mash your keyboard for 32+ characters — it just needs to be random)

**4. Set up the database**
```bash
npm run setup
```
This creates the SQLite database and populates it with demo data.
You should see green checkmarks (✅) for users and events.

**5. Start the app**
```bash
npm run dev
```
Wait until you see `✓ Ready in X.Xs`

**6. Open your browser**
Go to: **http://localhost:3000**

---

## 🔐 Demo Login Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@yale.edu` | `password` | Admin (full access) |
| `lead@yale.edu` | `password` | LC Lead (manage events) |
| `finance@yale.edu` | `password` | Finance (approve catering, payments) |
| `member@yale.edu` | `password` | Member (basic access) |

---

## 📱 What You Can Do

### Dashboard (`/`)
- See upcoming events, stats, and action items at a glance

### Events (`/events`)
- Toggle between **Table** and **Kanban** views
- Filter by status (Draft, Planning, Ready, etc.)
- Click any event to see full details

### Create Event (`/events/new`)
- Single-page form with all fields
- Speaker info, location, tags, semester

### Event Detail (`/events/[id]`)
- **Catering**: Submit for approval → Finance reviews → Payment tracking
- **Room**: Track reservation status and confirmation
- **Flyer**: Design status + distribution channel checkboxes
- **Day-of Checklist**: 10 predefined items + add custom ones
- **Expenses**: Track costs by category with paid/unpaid toggle
- **Retrospective**: Record headcount, "do again?", and notes

### Calendar (`/calendar`)
- Month grid view of all events

### Archive (`/archive`)
- View completed and archived events

### Settings (`/settings`)
- Export events/expenses as CSV
- Manage users (admin only)

---

## 🔧 Troubleshooting

**"Command not found: npm"**
→ You need to install Node.js: https://nodejs.org

**"prisma: command not found"**
→ Run `npm install` first — Prisma is included as a dependency

**"NEXTAUTH_SECRET missing"**
→ Make sure you created the `.env` file (step 3 above)

**Port 3000 already in use**
→ Stop whatever else is on port 3000, or run: `PORT=3001 npm run dev`

**Database errors after changing schema**
→ Delete `prisma/dev.db` and run `npm run setup` again

---

## 📂 Project Structure

```
policy-lc-ops-hub/
├── prisma/
│   ├── schema.prisma    ← Database schema (all models)
│   └── seed.ts          ← Demo data
├── src/
│   ├── app/             ← Pages (Next.js App Router)
│   ├── components/      ← Reusable UI components
│   ├── lib/             ← Business logic, auth, email, constants
│   └── types/           ← TypeScript type definitions
├── .env.example         ← Template for environment variables
├── package.json         ← Dependencies and scripts
└── README.md            ← You are here
```

---

## 📧 Email Setup (Optional)

By default, emails are logged to the console (no actual emails sent).
To enable real emails, add one of these to your `.env`:

**SendGrid:**
```
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-api-key
```

**AWS SES:**
```
EMAIL_PROVIDER=ses
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
```

---

## 🛑 Stopping the App

Press `Ctrl + C` in your terminal to stop the development server.

To restart later, just run `npm run dev` again (no need to redo setup).
