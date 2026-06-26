import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Clock, CheckCircle, XCircle, Play, BarChart2, RefreshCw, Trophy, Target, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

interface Question { id: number; question: string; options: string[]; answer: number; explanation: string; category: string; }
interface SessionResult { score: number; total: number; timeTaken: number; answers: { q: Question; selected: number; correct: boolean }[]; }

const TOPICS = ['All', 'Quantitative', 'Logical', 'Verbal', 'Data Interpretation'];
const TIME_LIMITS = [{ label: '5 min', secs: 300 }, { label: '10 min', secs: 600 }, { label: '15 min', secs: 900 }, { label: 'No limit', secs: 0 }];
const Q_COUNTS = [5, 10, 15, 20];

type Phase = 'setup' | 'test' | 'result';

const topicColors: Record<string, string> = {
  Quantitative: 'bg-blue-100 text-blue-700', Logical: 'bg-purple-100 text-purple-700',
  Verbal: 'bg-green-100 text-green-700', 'Data Interpretation': 'bg-orange-100 text-orange-700', Mixed: 'bg-gray-100 text-gray-700'
};

export default function AptitudeTest() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [topic, setTopic] = useState('All');
  const [qCount, setQCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(600);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ q: Question; selected: number; correct: boolean }[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<{ score: number; total: number; date: string }[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const startTest = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch(`${BASE}/api/aptitude/questions?topic=${encodeURIComponent(topic)}&count=${qCount}`);
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error);
      setQuestions(json.data);
      setCurrentIdx(0); setSelected(null); setAnswers([]); setShowExplanation(false);
      setStartTime(Date.now());
      if (timeLimit > 0) {
        setTimeLeft(timeLimit);
        timerRef.current = setInterval(() => setTimeLeft(t => { if (t <= 1) { finishTest(json.data, []); return 0; } return t - 1; }), 1000);
      }
      setPhase('test');
    } catch (e: unknown) {
      toast({ title: (e as Error).message || 'Failed to load questions', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const finishTest = (qs = questions, ans = answers) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const score = ans.filter(a => a.correct).length;
    const r: SessionResult = { score, total: qs.length, timeTaken, answers: ans };
    setResult(r);
    setHistory(h => [...h, { score, total: qs.length, date: new Date().toLocaleDateString() }].slice(-10));
    setPhase('result');
  };

  const selectOption = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowExplanation(true);
    const q = questions[currentIdx]!;
    setAnswers(a => [...a, { q, selected: idx, correct: idx === q.answer }]);
  };

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) { finishTest(); return; }
    setCurrentIdx(i => i + 1); setSelected(null); setShowExplanation(false);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const resetTest = () => { setPhase('setup'); setQuestions([]); setResult(null); setAnswers([]); if (timerRef.current) clearInterval(timerRef.current); };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (phase === 'setup') return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div><h1 className="text-2xl font-extrabold mb-1">Aptitude Test</h1><p className="text-foreground/60 text-sm">Real questions across Quantitative, Logical, Verbal, and Data Interpretation topics.</p></div>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div>
          <label className="text-sm font-semibold mb-2 block">Topic</label>
          <div className="grid grid-cols-3 gap-2">
            {TOPICS.map(t => <button key={t} onClick={() => setTopic(t)} className={`text-xs px-3 py-2 rounded-xl border transition-all ${topic===t?'bg-primary text-white border-primary':'border-border hover:border-primary/50'}`}>{t}</button>)}
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold mb-2 block">Number of Questions</label>
          <div className="flex gap-2">
            {Q_COUNTS.map(n => <button key={n} onClick={() => setQCount(n)} className={`px-4 py-2 rounded-xl border text-sm transition-all ${qCount===n?'bg-primary text-white border-primary':'border-border hover:border-primary/50'}`}>{n}</button>)}
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold mb-2 block">Time Limit</label>
          <div className="flex gap-2">
            {TIME_LIMITS.map(tl => <button key={tl.label} onClick={() => setTimeLimit(tl.secs)} className={`px-4 py-2 rounded-xl border text-sm transition-all ${timeLimit===tl.secs?'bg-primary text-white border-primary':'border-border hover:border-primary/50'}`}>{tl.label}</button>)}
          </div>
        </div>
        <Button onClick={startTest} disabled={isLoading} className="w-full h-12 rounded-xl font-bold bg-primary text-white gap-2">
          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Loading…</> : <><Play className="w-4 h-4" />Start Test</>}
        </Button>
      </div>

      {history.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-sm"><BarChart2 className="w-4 h-4 text-primary" />Score History</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={history.map((h, i) => ({ name: `T${i+1}`, score: Math.round((h.score/h.total)*100) }))}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="score" fill="#16a34a" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  if (phase === 'result' && result) {
    const pct = Math.round((result.score / result.total) * 100);
    const sc = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600';
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">Test Result</h1>
          <Button onClick={resetTest} variant="outline" className="rounded-xl gap-2 text-sm"><RefreshCw className="w-4 h-4" />Retake</Button>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className={`text-6xl font-extrabold ${sc} mb-2`}>{pct}%</div>
          <div className="text-lg font-bold mb-1">{result.score} / {result.total} Correct</div>
          <p className="text-foreground/60 text-sm">Time taken: {formatTime(result.timeTaken)}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[{icon:CheckCircle,label:'Correct',val:result.score,cls:'text-green-600'},{icon:XCircle,label:'Incorrect',val:result.total-result.score,cls:'text-red-600'},{icon:Clock,label:'Time',val:formatTime(result.timeTaken),cls:'text-primary'}].map(({icon:Icon,label,val,cls})=>(
            <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center"><Icon className={`w-5 h-5 ${cls} mx-auto mb-1`} /><div className={`font-bold text-xl ${cls}`}>{val}</div><div className="text-xs text-foreground/50">{label}</div></div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-sm">Question Review</h3>
          {result.answers.map((a, i) => (
            <div key={i} className={`rounded-xl p-4 border ${a.correct ? 'border-green-200 bg-green-50 dark:bg-green-900/10' : 'border-red-200 bg-red-50 dark:bg-red-900/10'}`}>
              <div className="flex items-start gap-2 mb-2">
                {a.correct ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                <p className="text-xs font-medium">{a.q.question}</p>
              </div>
              <div className="grid grid-cols-2 gap-1 mb-2">
                {a.q.options.map((opt, j) => (
                  <div key={j} className={`text-xs px-2 py-1 rounded-lg ${j===a.q.answer?'bg-green-500 text-white':j===a.selected&&!a.correct?'bg-red-400 text-white':'bg-background/50'}`}>{opt}</div>
                ))}
              </div>
              <p className="text-[10px] text-foreground/60"><span className="font-semibold">Explanation: </span>{a.q.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  if (!q) return null;
  const progress = ((currentIdx) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Question {currentIdx + 1} of {questions.length}</span>
          <div className="flex items-center gap-3">
            {timeLimit > 0 && <div className={`flex items-center gap-1 text-sm font-mono font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-foreground/70'}`}><Clock className="w-3.5 h-3.5" />{formatTime(timeLeft)}</div>}
            <Badge variant="outline" className="text-xs">{answers.filter(a => a.correct).length} correct</Badge>
          </div>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Question */}
      <motion.div key={currentIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Badge className={`rounded-xl text-xs ${topicColors[q.category] || topicColors['Mixed']}`}>{q.category}</Badge>
        </div>
        <h2 className="text-base font-semibold leading-relaxed">{q.question}</h2>
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((opt, i) => {
            let cls = 'border-border hover:border-primary/50 hover:bg-primary/5';
            if (selected !== null) {
              if (i === q.answer) cls = 'border-green-500 bg-green-50 dark:bg-green-900/20';
              else if (i === selected && selected !== q.answer) cls = 'border-red-400 bg-red-50 dark:bg-red-900/20';
              else cls = 'border-border opacity-60';
            }
            return (
              <button key={i} onClick={() => selectOption(i)} disabled={selected !== null}
                className={`p-3 rounded-xl border text-sm text-left transition-all font-medium ${cls}`}
              >{opt}</button>
            );
          })}
        </div>

        <AnimatePresence>
          {showExplanation && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
              <div className={`rounded-xl p-3 flex items-center gap-2 ${selected === q.answer ? 'bg-green-50 dark:bg-green-900/20 border border-green-200' : 'bg-red-50 dark:bg-red-900/20 border border-red-200'}`}>
                {selected === q.answer ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                <span className={`text-sm font-semibold ${selected === q.answer ? 'text-green-700' : 'text-red-700'}`}>
                  {selected === q.answer ? 'Correct!' : `Incorrect. Correct: ${q.options[q.answer]}`}
                </span>
              </div>
              <div className="bg-muted/40 rounded-xl p-3 text-xs text-foreground/70"><span className="font-semibold">Explanation: </span>{q.explanation}</div>
              <Button onClick={nextQuestion} className="w-full rounded-xl bg-primary text-white gap-2">
                {currentIdx + 1 >= questions.length ? <><Trophy className="w-4 h-4" />View Results</> : <>Next Question <ChevronRight className="w-4 h-4" /></>}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
