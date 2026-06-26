import { motion } from 'framer-motion';
import { CheckCircle, Circle, Lock, Play, Clock, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

const roadmap = [
  {
    phase: 'Phase 1: Foundation', status: 'completed', duration: '2 weeks',
    topics: [
      { title: 'DSA Fundamentals', desc: 'Arrays, Strings, Linked Lists', done: true },
      { title: 'Resume Building', desc: 'ATS-optimized format', done: true },
      { title: 'Communication Basics', desc: 'Self-intro, elevator pitch', done: true },
    ]
  },
  {
    phase: 'Phase 2: Core Prep', status: 'in-progress', duration: '3 weeks',
    topics: [
      { title: 'Intermediate DSA', desc: 'Trees, Graphs, Dynamic Programming', done: true },
      { title: 'Mock Interviews x5', desc: 'Technical & behavioral rounds', done: false },
      { title: 'System Design Intro', desc: 'Scalability basics', done: false },
    ]
  },
  {
    phase: 'Phase 3: Advanced', status: 'locked', duration: '2 weeks',
    topics: [
      { title: 'Advanced System Design', desc: 'HLD, LLD, Case studies', done: false },
      { title: 'Company-Specific Prep', desc: 'FAANG interview patterns', done: false },
      { title: 'Final Mock Tests', desc: '3 full simulation rounds', done: false },
    ]
  },
];

const certifications = [
  { name: 'DSA Proficiency', issuer: 'client', earned: true, color: 'bg-primary/10 border-primary/20' },
  { name: 'Communication Expert', issuer: 'client', earned: false, color: 'bg-muted border-border' },
  { name: 'Interview Ready', issuer: 'client', earned: false, color: 'bg-muted border-border' },
];

const statusColor = { completed: 'text-primary', 'in-progress': 'text-blue-500', locked: 'text-foreground/30' };
const statusBg = { completed: 'bg-primary/10', 'in-progress': 'bg-blue-100 dark:bg-blue-900/20', locked: 'bg-muted' };

const TOPIC_ROUTES: Record<string, string> = {
  'Mock Interviews x5': '/dashboard/mock-interview',
  'System Design Intro': '/dashboard/mock-interview',
  'Intermediate DSA': '/dashboard/coding',
};

export default function LearningRoadmap() {
  const [, navigate] = useLocation();
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold">Learning Roadmap</h1>
        <p className="text-foreground/60 text-sm mt-1">Structured learning path to your dream job</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-lg">Overall Progress</h2>
            <p className="text-foreground/60 text-sm">You're ahead of 68% of learners!</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-xl px-4 py-2">
            <Zap className="w-4 h-4" /> 7-day streak 🔥
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: '55%' }} transition={{ duration: 1.2 }}
              className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full"
            />
          </div>
          <span className="font-bold text-lg text-primary">55%</span>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[['12', 'Topics Done'], ['5', 'Interviews'], ['3h', 'This Week']].map(([v, l]) => (
            <div key={l} className="text-center bg-muted/60 rounded-xl p-3">
              <div className="text-xl font-extrabold text-primary">{v}</div>
              <div className="text-xs text-foreground/60 mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="space-y-4">
        {roadmap.map(({ phase, status, duration, topics }, phaseIdx) => (
          <motion.div key={phase} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: phaseIdx * 0.1 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusBg[status as keyof typeof statusBg]}`}>
                {status === 'completed' ? <CheckCircle className="w-5 h-5 text-primary" /> : status === 'in-progress' ? <Play className="w-5 h-5 text-blue-500" /> : <Lock className="w-5 h-5 text-foreground/30" />}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold ${statusColor[status as keyof typeof statusColor]}`}>{phase}</h3>
                <div className="flex items-center gap-1 text-xs text-foreground/50 mt-0.5"><Clock className="w-3 h-3" />{duration}</div>
              </div>
              {status === 'in-progress' && <Button size="sm" onClick={() => navigate('/dashboard/mock-interview')} className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs">Continue</Button>}
            </div>
            <div className="space-y-2">
              {topics.map(({ title, desc, done }) => (
                <div key={title} className={`flex items-center gap-3 p-3 rounded-xl ${status === 'locked' ? 'opacity-40' : ''} ${done ? 'bg-primary/5' : 'bg-muted/50'}`}>
                  {done ? <CheckCircle className="w-4 h-4 text-primary shrink-0" /> : <Circle className="w-4 h-4 text-foreground/30 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-foreground/50">{desc}</p>
                  </div>
                  {!done && status !== 'locked' && (
                    <button
                      onClick={() => { const route = TOPIC_ROUTES[title]; if (route) navigate(route); }}
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div>
        <h2 className="font-bold text-lg mb-3">Certifications</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {certifications.map(({ name, issuer, earned, color }) => (
            <div key={name} className={`border rounded-2xl p-4 ${color} ${!earned ? 'opacity-60' : ''}`}>
              <div className="text-2xl mb-2">{earned ? '🏆' : '🔒'}</div>
              <h3 className="font-bold text-sm">{name}</h3>
              <p className="text-xs text-foreground/60 mt-1">{issuer}</p>
              {earned ? <span className="inline-block mt-2 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">Earned!</span> : <span className="inline-block mt-2 text-xs text-foreground/40">Not yet earned</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
