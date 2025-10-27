# GymStreak - Setup Guide

## 🚀 Quick Start

The GymStreak app is fully implemented and ready to use. Follow these steps to get it running:

## 1. Supabase Database Setup

The app is already configured to connect to the provided Supabase project. You need to create the following tables in your Supabase dashboard:

### **1.1 Users Table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### **1.2 Workouts Table**
```sql
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_workouts_user_date ON workouts(user_id, date);
```

### **1.3 Exercises Table**
```sql
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets INTEGER DEFAULT 3,
  reps INTEGER DEFAULT 10,
  last_weight NUMERIC(10, 2),
  done BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_exercises_workout ON exercises(workout_id);
```

### **1.4 Body Metrics Table**
```sql
CREATE TABLE body_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight NUMERIC(10, 2),
  muscle_mass NUMERIC(10, 2),
  fat_percentage NUMERIC(5, 2),
  height NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_body_metrics_user_date ON body_metrics(user_id, date);
```

### **1.5 Streaks Table**
```sql
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_workout_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_streaks_user ON streaks(user_id);
```

## 2. Authentication Setup

The app uses Supabase Auth. Enable email/password authentication:

1. Go to your Supabase Project
2. Navigate to **Authentication** > **Providers**
3. Enable **Email** provider
4. Configure email settings (optional: enable email confirmations)

## 3. Run the App

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# The app will be available at http://localhost:8080
```

## 4. First Time Usage

1. Navigate to `/login`
2. Create a new account with email and password
3. You'll be redirected to the home page
4. Add exercises for today in the home page
5. Complete exercises and save your workout
6. Visit other pages:
   - **Calendário**: View your yearly progress heatmap
   - **Evolução**: Track body metrics with charts
   - **Perfil**: Log monthly measurements

## 📱 App Features

### **🔥 Treino do Dia (Home Page)**
- Daily workout tracker
- Exercise list with sets, reps, and weight tracking
- Completion tracking
- Streak counter (current and longest)
- Days trained counter (/365)
- Automatic streak updates when all exercises are completed

### **📅 Calendário (Calendar)**
- Yearly progress heatmap (GitHub-style)
- Current streak display
- Best streak tracker
- Total workouts counter

### **📈 Evolução (Evolution)**
- Body weight tracking chart
- Body composition analysis (muscle mass vs fat percentage)
- Comparative metrics
- Trend visualization

### **👤 Perfil (Profile)**
- Monthly measurement logging:
  - Weight
  - Muscle mass
  - Fat percentage
  - Height
- Historical data storage

## 🔐 Security Notes

- Supabase credentials are included in the code (public anon key - this is safe)
- Private API key is never exposed to the client
- All data is tied to authenticated users
- Enable RLS (Row Level Security) on Supabase for production

## 🎨 Design Features

- **Duolingo-inspired**: Vibrant orange/amber color scheme
- **Mobile-first**: Fully responsive design
- **Modern UI**: Rounded cards, smooth animations, gradient accents
- **Intuitive Navigation**: Bottom navigation on mobile, sidebar on desktop
- **Visual Feedback**: Completion animations, streak celebrations

## 📊 Database Relationships

```
users
├── workouts (one-to-many)
│   └── exercises (one-to-many)
├── body_metrics (one-to-many)
└── streaks (one-to-one)
```

## 🚀 Deployment

The app is ready for production deployment:

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

You can deploy to:
- **Netlify**: Use the Netlify MCP integration
- **Vercel**: Use the Vercel MCP integration
- **Any Node.js server**: Using `pnpm build && pnpm start`

## 🐛 Troubleshooting

### Blank Page After Login
- Check browser console for errors
- Verify Supabase tables are created
- Check that `user_id` in workouts matches authenticated user

### Charts Not Showing
- Ensure body_metrics table has data
- Check that measurements were saved with correct date format

### Exercises Not Loading
- Create a workout for today via the database or app
- Add exercises to the workout

## 📝 Next Steps

1. Set up Supabase tables (copy-paste SQL above)
2. Configure Supabase Auth
3. Run `pnpm dev`
4. Test the app with a test account
5. Deploy to production (Netlify or Vercel)

Enjoy tracking your gym progress! 🏋️💪
