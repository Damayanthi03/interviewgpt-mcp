import { motion } from 'framer-motion';
import {
  AreaChart, Area, RadialBarChart, RadialBar, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Trophy, Zap, Target, TrendingUp, Calendar, Star, ArrowUp, Clock, Code2, MessageSquare, FileText, Video } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const weeklyActivity = [
  { day: 'Mon', interviews: 2, coding: 3, aptitude: 1 },
  { day: 'Tue', interviews: 1, coding: 5, aptitude: 2 },
  { day: 'Wed', interviews: 3, coding: 2, aptitude: 3 },
  { day: 'Thu', interviews: 2, coding: 4, aptitude: 1 },
  { day: 'Fri', interviews: 4, coding: 3, aptitude: 2 },
  { day: 'Sat', interviews: 1, coding: 6, aptitude: 0 },
  { day: 'Sun', interviews: 2, coding: 2, aptitude: 1 },
];

const skillProgress = [
  { name: 'Communication', score: 78, fill: '#22c55e' },
  { name: 'Problem Solving', score: 85, fill: '#16a34a' },
  { name: 'Technical', score: 72, fill: '#4ade80' },
  { name: 'Leadership', score: 65, fill: '#86efac' },
];

const leaderboard = [
  { rank: 1, name: 'Ananya S.', score: 98, avatar: 'A' },
  { rank: 2, name: 'Rohan M.', score: 95, avatar: 'R' },
  { rank: 3, name: 'Priya K.', score: 91, avatar: 'P' },
  { rank: 4, name: 'You', score: 87, avatar: '?', isYou: true },
  { rank: 5, name: 'Vikram D.', score: 84, avatar: 'V' },
];

const upcoming = [
  { title: 'Google Mock Interview', time: 'Today 3:00 PM', type: 'Tech', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { title: 'DSA Practice Session', time: 'Tomorrow 10:00 AM', type: 'Coding', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { title: 'HR Round Simulation', time: 'Fri 2:00 PM', type: 'HR', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
];

const recentActivities = [
  { icon: Video, label: 'Completed Mock Interview', sub: 'Score: 88/100', time: '2h ago', color: 'text-primary bg-primary/10' },
  { icon: Code2, label: 'Solved 3 DSA Problems', sub: 'Arrays & Strings', time: '4h ago', color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
  { icon: FileText, label: 'Resume ATS Check', sub: 'Score improved to 76', time: '1d ago', color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
  { icon: MessageSquare, label: 'Communication Practice', sub: 'Body language tips', time: '2d ago', color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' },
];

function ScoreCard({ label, score, icon: Icon, color, trend }: {
  label: string; score: number; icon: React.ElementType; color: string; trend: number;
}) {
  return (
    <motion.div whileHover={{ y: -2, scale: 1.01 }} transition={{ duration: 0.2 }}
      className="bg-card dark:bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 opacity-5 ${color}`} />
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} bg-opacity-10`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-1 text-green-500 text-xs font-semibold">
          <ArrowUp className="w-3 h-3" />
          +{trend}%
        </div>
      </div>
      <div className="text-3xl font-extrabold mb-0.5">{score}<span className="text-base font-normal text-foreground/40">/100</span></div>
      <div className="text-sm text-foreground/60">{label}</div>
      <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1, delay: 0.3 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </motion.div>
  );
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

export default function Dashboard() {
  const { user } = useAuth();

  const scores = [
    { label: 'ATS Score', score: user?.atsScore ?? 90, icon: FileText, color: 'bg-primary text-primary', trend: 12 },
    { label: 'Interview Score', score: user?.interviewScore ?? 93, icon: Video, color: 'bg-blue-500 text-blue-500', trend: 8 },
    { label: 'Coding Score', score: user?.codingScore ?? 92, icon: Code2, color: 'bg-purple-500 text-purple-500', trend: 15 },
    { label: 'Communication', score: user?.communicationScore ?? 95, icon: MessageSquare, color: 'bg-orange-500 text-orange-500', trend: 5 },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <motion.div {...fadeIn} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Good morning, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
          <p className="text-foreground/60 text-sm mt-1">Here's your interview prep overview</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-primary/10 text-primary rounded-xl px-4 py-2 text-sm font-semibold">
          <Zap className="w-4 h-4" />
          7-day streak 🔥
        </div>
      </motion.div>

      <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {scores.map(s => <ScoreCard key={s.label} {...s} />)}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Weekly Activity</h2>
            <span className="text-xs text-foreground/50 bg-muted px-2 py-1 rounded-lg">This week</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyActivity} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <defs>
                <linearGradient id="gInterviews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gCoding" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="interviews" stroke="#22c55e" strokeWidth={2.5} fill="url(#gInterviews)" name="Interviews" />
              <Area type="monotone" dataKey="coding" stroke="#a855f7" strokeWidth={2.5} fill="url(#gCoding)" name="Coding" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-2">
            {[['#22c55e','Interviews'], ['#a855f7','Coding'], ['#f97316','Aptitude']].map(([color, name]) => (
              <div key={name} className="flex items-center gap-2 text-xs text-foreground/60">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                {name}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h2 className="font-bold text-lg">Leaderboard</h2>
          </div>
          <div className="space-y-3">
            {leaderboard.map(({ rank, name, score, isYou }) => (
              <div key={rank} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${isYou ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${rank === 1 ? 'bg-yellow-100 text-yellow-700' : rank === 2 ? 'bg-gray-100 text-gray-600' : rank === 3 ? 'bg-orange-100 text-orange-600' : isYou ? 'bg-primary/20 text-primary' : 'bg-muted text-foreground/60'}`}>
                  {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isYou ? 'text-primary' : ''}`}>{name}</p>
                </div>
                <span className="text-sm font-bold tabular-nums">{score}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Skill Progress</h2>
          </div>
          <div className="space-y-4">
            {skillProgress.map(({ name, score, fill }) => (
              <div key={name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{name}</span>
                  <span className="font-bold" style={{ color: fill }}>{score}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1, delay: 0.5 }}
                    className="h-full rounded-full" style={{ background: fill }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h2 className="font-bold text-lg">Upcoming</h2>
          </div>
          <div className="space-y-3">
            {upcoming.map(({ title, time, type, color }) => (
              <div key={title} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                <div className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${color}`}>{type}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{title}</p>
                  <div className="flex items-center gap-1 text-xs text-foreground/50 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.35 }} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-lg">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {recentActivities.map(({ icon: Icon, label, sub, time, color }) => (
              <div key={label} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{label}</p>
                  <p className="text-xs text-foreground/50 truncate">{sub}</p>
                </div>
                <span className="text-xs text-foreground/40 shrink-0">{time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
