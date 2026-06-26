import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Users, Play, ChevronRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const questions = [
  { q: 'Tell me about yourself', category: 'Introduction', difficulty: 'Easy', attempts: 5 },
  { q: 'What are your greatest strengths?', category: 'Strengths', difficulty: 'Easy', attempts: 3 },
  { q: 'Describe a challenging project and how you handled it', category: 'Behavioral', difficulty: 'Medium', attempts: 2 },
  { q: 'Where do you see yourself in 5 years?', category: 'Career Goals', difficulty: 'Medium', attempts: 1 },
  { q: 'Why do you want to work at our company?', category: 'Company Fit', difficulty: 'Medium', attempts: 0 },
  { q: 'Describe a time you handled a difficult team conflict', category: 'Leadership', difficulty: 'Hard', attempts: 0 },
];

const frameworks = [
  { name: 'STAR Method', desc: 'Situation, Task, Action, Result', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
  { name: 'CAR Method', desc: 'Challenge, Action, Result', color: 'bg-primary/10 text-primary' },
  { name: 'SOAR Method', desc: 'Situation, Obstacle, Action, Result', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' },
];

export default function HRInterview() {
  const [, navigate] = useLocation();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold">HR Interview Prep</h1>
        <p className="text-foreground/60 text-sm mt-1">Master behavioral and situational interview questions</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2"><Users className="w-5 h-5" /><span className="font-semibold">AI HR Simulation</span></div>
            <h2 className="text-xl font-extrabold mb-1">Practice with a virtual HR interviewer</h2>
            <p className="text-white/80 text-sm">Get feedback on confidence, clarity, and content</p>
          </div>
          <Button onClick={() => navigate('/dashboard/hr-interview/session')}
            className="bg-white text-blue-700 hover:bg-white/90 font-bold rounded-xl shrink-0">
            <Play className="w-4 h-4 mr-2" /> Start Session
          </Button>
        </div>
      </motion.div>

      <div>
        <h2 className="font-bold text-lg mb-3">Answer Frameworks</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {frameworks.map(({ name, desc, color }) => (
            <div key={name} className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${color}`}>{name}</span>
              <p className="text-sm text-foreground/60 mt-2">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-lg mb-4">Question Bank</h2>
        <div className="space-y-2">
          {questions.map(({ q, category, difficulty, attempts }) => (
            <motion.div key={q} whileHover={{ x: 4 }}
              className="flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{q}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-foreground/50">{category}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficulty === 'Easy' ? 'bg-green-100 text-green-700' : difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{difficulty}</span>
                  {attempts > 0 && <span className="text-xs text-foreground/40">{attempts} attempt{attempts !== 1 ? 's' : ''}</span>}
                </div>
              </div>
              <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 rounded-xl text-xs">
                <Play className="w-3 h-3 mr-1" /> Practice
              </Button>
              <ChevronRight className="w-4 h-4 text-foreground/30" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
