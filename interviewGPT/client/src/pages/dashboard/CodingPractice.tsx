import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, Play, Trophy, CheckCircle, XCircle, ChevronRight,
  Loader2, RefreshCw, BarChart2, Zap, Clock, Star, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const TOPICS_LIST = ['All', 'Arrays', 'Strings', 'Trees', 'Graphs', 'DP', 'Sorting', 'Searching', 'Recursion'];
const LANGUAGES = [
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'java', label: 'Java' },
];

interface Problem {
  id: number; title: string; difficulty: string; topic: string;
  description?: string; examples?: { input: string; output: string }[];
  constraints?: string[];
  starter?: Record<string, string>;
}
interface Evaluation {
  correctness_score: number; code_quality_score: number; overall_score: number;
  time_complexity: string; space_complexity: string; is_optimal: boolean;
  optimal_complexity?: string; edge_cases_handled: string[]; edge_cases_missing: string[];
  bugs: string[]; improvements: string[]; alternative_approach?: string; verdict: string;
}
interface LeaderboardEntry { rank: number; name: string; score: number; solved: number; streak: number; badge: string; }

type View = 'list' | 'solve';

const diffColor: Record<string, string> = { Easy: 'text-green-600 bg-green-100', Medium: 'text-yellow-600 bg-yellow-100', Hard: 'text-red-600 bg-red-100' };
const verdictColor: Record<string, string> = { Accepted: 'bg-green-50 border-green-200 text-green-700', 'Wrong Answer': 'bg-red-50 border-red-200 text-red-700', 'Needs Improvement': 'bg-yellow-50 border-yellow-200 text-yellow-700', 'Time Limit Exceeded': 'bg-orange-50 border-orange-200 text-orange-700' };

export default function CodingPractice() {
  const [view, setView] = useState<View>('list');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [difficulty, setDifficulty] = useState('All');
  const [topic, setTopic] = useState('All');
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [solved, setSolved] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  useEffect(() => { loadProblems(); loadLeaderboard(); }, []);
  useEffect(() => { loadProblems(); }, [difficulty, topic]);

  const loadProblems = async () => {
    try {
      const resp = await fetch(`${BASE}/api/coding/problems?difficulty=${difficulty}&topic=${topic}`);
      const json = await resp.json();
      if (resp.ok) setProblems(json.data);
    } catch { /* ignore */ }
  };

  const loadLeaderboard = async () => {
    try {
      const resp = await fetch(`${BASE}/api/coding/leaderboard`);
      const json = await resp.json();
      if (resp.ok) setLeaderboard(json.data);
    } catch { /* ignore */ }
  };

  const openProblem = async (p: Problem) => {
    try {
      const resp = await fetch(`${BASE}/api/coding/problem/${p.id}`);
      const json = await resp.json();
      if (resp.ok) {
        setSelectedProblem(json.data);
        setCode(json.data.starter?.[language] || `# Solve "${json.data.title}"\n`);
        setOutput(''); setEvaluation(null); setView('solve');
      }
    } catch { toast({ title: 'Failed to load problem', variant: 'destructive' }); }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    if (selectedProblem?.starter?.[lang]) setCode(selectedProblem.starter[lang]!);
  };

  const runCode = async () => {
    if (!code.trim()) return;
    setIsRunning(true); setOutput('');
    try {
      const resp = await fetch(`${BASE}/api/coding/execute`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error);
      const { stdout, stderr, exitCode } = json.data;
      setOutput(stdout || stderr || (exitCode === 0 ? '(no output)' : `Exit code: ${exitCode}`));
    } catch (e: unknown) {
      setOutput(`Error: ${(e as Error).message}`);
    } finally { setIsRunning(false); }
  };

  const evaluateCode = async () => {
    if (!selectedProblem || !code.trim()) return;
    setIsEvaluating(true); setEvaluation(null);
    try {
      const resp = await fetch(`${BASE}/api/coding/evaluate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemTitle: selectedProblem.title,
          problemDescription: selectedProblem.description,
          code, language, output
        })
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error);
      setEvaluation(json.data);
      if (json.data.verdict === 'Accepted') setSolved(s => new Set([...s, selectedProblem.id]));
    } catch (e: unknown) {
      toast({ title: (e as Error).message || 'Evaluation failed', variant: 'destructive' });
    } finally { setIsEvaluating(false); }
  };

  if (view === 'solve' && selectedProblem) {
    return (
      <div className="h-full flex flex-col p-4 gap-4 max-w-6xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setView('list')} className="rounded-xl gap-1 text-xs">← Back</Button>
            <h2 className="font-bold">{selectedProblem.title}</h2>
            <Badge className={`rounded-xl text-xs ${diffColor[selectedProblem.difficulty]}`}>{selectedProblem.difficulty}</Badge>
            <Badge variant="secondary" className="rounded-xl text-xs">{selectedProblem.topic}</Badge>
          </div>
          <div className="flex gap-2">
            {LANGUAGES.map(l => <button key={l.id} onClick={() => handleLanguageChange(l.id)} className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${language===l.id?'bg-primary text-white border-primary':'border-border hover:border-primary/50'}`}>{l.label}</button>)}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 flex-1">
          {/* Problem description */}
          <div className="bg-card border border-border rounded-2xl p-5 overflow-y-auto space-y-4">
            <h3 className="font-bold text-sm">Problem Description</h3>
            <p className="text-sm text-foreground/70 leading-relaxed">{selectedProblem.description}</p>
            {selectedProblem.examples?.map((ex, i) => (
              <div key={i} className="bg-muted/40 rounded-xl p-3 text-xs font-mono">
                <div><span className="font-bold text-foreground">Input: </span>{ex.input}</div>
                <div><span className="font-bold text-foreground">Output: </span>{ex.output}</div>
              </div>
            ))}
            {selectedProblem.constraints && (
              <div>
                <p className="text-xs font-bold mb-2">Constraints:</p>
                <ul className="space-y-1">{selectedProblem.constraints.map((c, i) => <li key={i} className="text-xs text-foreground/60 flex gap-2"><span className="text-primary">•</span>{c}</li>)}</ul>
              </div>
            )}
          </div>

          {/* Code Editor + Output */}
          <div className="flex flex-col gap-3">
            <div className="bg-card border border-border rounded-2xl overflow-hidden flex-1">
              <div className="bg-muted/50 border-b border-border px-4 py-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground/60">{LANGUAGES.find(l => l.id === language)?.label}</span>
                <div className="flex gap-2">
                  <Button onClick={runCode} disabled={isRunning} size="sm" variant="outline" className="rounded-lg gap-1.5 text-xs h-7">
                    {isRunning ? <><Loader2 className="w-3 h-3 animate-spin" />Running…</> : <><Play className="w-3 h-3" />Run</>}
                  </Button>
                  <Button onClick={evaluateCode} disabled={isEvaluating} size="sm" className="rounded-lg gap-1.5 text-xs h-7 bg-primary text-white">
                    {isEvaluating ? <><Loader2 className="w-3 h-3 animate-spin" />Evaluating…</> : <><Zap className="w-3 h-3" />Evaluate</>}
                  </Button>
                </div>
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs p-4 resize-none outline-none"
                style={{ minHeight: '280px' }}
                spellCheck={false}
              />
            </div>

            {/* Output */}
            {output && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="bg-muted/50 border-b border-border px-4 py-2 text-xs font-semibold text-foreground/60">Output</div>
                <pre className="p-4 text-xs font-mono text-foreground/80 whitespace-pre-wrap max-h-32 overflow-y-auto">{output}</pre>
              </div>
            )}

            {/* Evaluation */}
            <AnimatePresence>
              {evaluation && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border p-4 ${verdictColor[evaluation.verdict] || 'bg-card border-border'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm">{evaluation.verdict}</span>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{evaluation.time_complexity}</span>
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{evaluation.space_complexity}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[['Correctness', evaluation.correctness_score], ['Code Quality', evaluation.code_quality_score], ['Overall', evaluation.overall_score]].map(([l, v]) => (
                      <div key={l as string} className="text-center"><div className="text-lg font-extrabold">{v}</div><div className="text-[10px] opacity-70">{l}</div></div>
                    ))}
                  </div>
                  {evaluation.improvements.length > 0 && (
                    <ul className="space-y-1">{evaluation.improvements.slice(0, 3).map((imp, i) => <li key={i} className="text-[10px] flex gap-1.5"><AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />{imp}</li>)}</ul>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-extrabold mb-1">Coding Practice</h1><p className="text-foreground/60 text-sm">Write, run, and evaluate solutions with AI complexity analysis.</p></div>
        <Button onClick={() => setShowLeaderboard(!showLeaderboard)} variant="outline" className="rounded-xl gap-2 text-sm">
          <Trophy className="w-4 h-4 text-yellow-500" /> Leaderboard
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[{icon:CheckCircle,label:'Solved',val:solved.size,cls:'text-green-600'},{icon:BarChart2,label:'Total',val:problems.length,cls:'text-primary'},{icon:Star,label:'Easy',val:problems.filter(p=>p.difficulty==='Easy').length,cls:'text-green-500'},{icon:AlertCircle,label:'Hard',val:problems.filter(p=>p.difficulty==='Hard').length,cls:'text-red-500'}].map(({icon:Icon,label,val,cls})=>(
          <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center"><Icon className={`w-5 h-5 ${cls} mx-auto mb-1`} /><div className="font-bold text-xl">{val}</div><div className="text-xs text-foreground/50">{label}</div></div>
        ))}
      </div>

      {/* Leaderboard */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="font-bold text-sm">Global Leaderboard</span>
            </div>
            <div className="divide-y divide-border">
              {leaderboard.map(entry => (
                <div key={entry.rank} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg w-6 text-center">{entry.badge}</span>
                  <span className="font-bold text-sm w-4 text-foreground/50">{entry.rank}</span>
                  <span className="font-semibold text-sm flex-1">{entry.name}</span>
                  <div className="flex items-center gap-4 text-xs text-foreground/60">
                    <span>{entry.solved} solved</span>
                    <span className="font-bold text-primary">{entry.score} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          {DIFFICULTIES.map(d => <button key={d} onClick={() => setDifficulty(d)} className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${difficulty===d?'bg-primary text-white border-primary':'border-border hover:border-primary/50'}`}>{d}</button>)}
        </div>
        <div className="flex flex-wrap gap-2">
          {TOPICS_LIST.map(t => <button key={t} onClick={() => setTopic(t)} className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${topic===t?'bg-primary/20 text-primary border-primary/30':'border-border hover:border-primary/50'}`}>{t}</button>)}
        </div>
      </div>

      {/* Problem List */}
      <div className="space-y-2">
        {problems.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between hover:shadow-sm hover:border-primary/20 transition-all cursor-pointer"
            onClick={() => openProblem(p)}
          >
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${solved.has(p.id) ? 'bg-green-500' : 'bg-muted'}`}>
                {solved.has(p.id) ? <CheckCircle className="w-4 h-4 text-white" /> : <span className="text-xs font-bold text-foreground/50">{p.id}</span>}
              </div>
              <div>
                <span className="font-semibold text-sm">{p.title}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={`text-[10px] rounded-lg px-2 py-0 ${diffColor[p.difficulty]}`}>{p.difficulty}</Badge>
                  <span className="text-[10px] text-foreground/50">{p.topic}</span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-foreground/30" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
