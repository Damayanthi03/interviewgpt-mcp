import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Mic, MicOff, Send, FileText, Brain, ChevronRight,
  CheckCircle, XCircle, Star, BarChart2, RefreshCw, Trophy,
  Target, TrendingUp, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

type Phase = 'setup' | 'interview' | 'report';

interface Question {
  question: string; category: string; difficulty: string;
  question_number: number; total_questions: number; hint?: string;
}
interface EvalResult {
  score: number; feedback: string; strengths: string[];
  improvements: string[]; sample_answer: string; next_question: Question | null;
}
interface HistoryItem {
  question: string; answer: string; score: number;
  category: string; feedback: string; strengths: string[]; improvements: string[];
}
interface Report {
  overall_score: number; grade: string; verdict: string; summary: string;
  scores: Record<string, number>;
  strengths: string[]; weaknesses: string[]; recommendations: string[];
  study_topics: string[];
  category_breakdown: { category: string; score: number; questions_asked: number }[];
}

const ROLES = ['Software Engineer','Frontend Developer','Backend Developer','Full Stack Developer','Data Scientist','ML Engineer','DevOps Engineer','System Design','Product Manager'];
const diffColors: Record<string,string> = { Easy:'bg-green-100 text-green-700', Medium:'bg-yellow-100 text-yellow-700', Hard:'bg-red-100 text-red-700' };
const catColors: Record<string,string> = { Technical:'bg-blue-100 text-blue-700', Behavioral:'bg-purple-100 text-purple-700', 'System Design':'bg-orange-100 text-orange-700', HR:'bg-teal-100 text-teal-700' };

export default function MockInterview() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [role, setRole] = useState('Software Engineer');
  const [skills, setSkills] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showEval, setShowEval] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isRecordingRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const startInterview = async () => {
    if (!skills.trim() && !resumeFile) {
      toast({ title: 'Please enter your skills or upload your resume', variant: 'destructive' }); return;
    }
    setIsLoading(true);
    try {
      const resp = await fetch(`${BASE}/api/interview/start`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: skills.split(',').map(s => s.trim()).filter(Boolean), role })
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error);
      setCurrentQ(json.data); setPhase('interview');
    } catch (e: unknown) {
      toast({ title: (e as Error).message || 'Failed to start', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !currentQ) return;
    setIsLoading(true); setShowEval(false);
    try {
      const resp = await fetch(`${BASE}/api/interview/evaluate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question, answer, category: currentQ.category,
          questionNumber: currentQ.question_number, totalQuestions: currentQ.total_questions,
          skills: skills.split(',').map(s => s.trim()).filter(Boolean), role
        })
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error);
      const ev: EvalResult = json.data;
      setEvalResult(ev); setShowEval(true);
      setHistory(h => [...h, { question: currentQ.question, answer, score: ev.score, category: currentQ.category, feedback: ev.feedback, strengths: ev.strengths, improvements: ev.improvements }]);
    } catch (e: unknown) {
      toast({ title: (e as Error).message || 'Evaluation failed', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const nextQuestion = () => {
    if (!evalResult?.next_question) return;
    setCurrentQ(evalResult.next_question); setAnswer(''); setEvalResult(null); setShowEval(false);
  };

  const finishInterview = async () => {
    if (history.length === 0) return;
    setIsLoading(true);
    try {
      const resp = await fetch(`${BASE}/api/interview/report`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, role, skills: skills.split(',').map(s => s.trim()).filter(Boolean) })
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error);
      setReport(json.data); setPhase('report');
    } catch (e: unknown) {
      toast({ title: (e as Error).message || 'Report failed', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const toggleMic = () => {
    const SR = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) { toast({ title: 'Speech recognition not supported', variant: 'destructive' }); return; }
    if (isRecording) {
      isRecordingRef.current = false;
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e) => { let t = ''; for (let i = 0; i < e.results.length; i++) t += e.results[i]![0]!.transcript; setAnswer(t); };
    rec.onerror = () => { isRecordingRef.current = false; setIsRecording(false); };
    rec.onend = () => {
      if (isRecordingRef.current) {
        try { rec.start(); } catch { isRecordingRef.current = false; setIsRecording(false); }
      } else {
        setIsRecording(false);
      }
    };
    isRecordingRef.current = true;
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  };

  const resetInterview = () => { setPhase('setup'); setCurrentQ(null); setAnswer(''); setEvalResult(null); setHistory([]); setReport(null); setShowEval(false); };
  const avgScore = history.length ? Math.round(history.reduce((s,h) => s + h.score, 0) / history.length) : 0;

  if (phase === 'setup') return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div><h1 className="text-2xl font-extrabold mb-1">AI Mock Interview</h1><p className="text-foreground/60 text-sm">AI reads your skills and asks personalized interview questions. Answer via text or microphone.</p></div>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div>
          <label className="text-sm font-semibold mb-2 block">Target Role</label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(r => <button key={r} onClick={() => setRole(r)} className={`text-xs px-3 py-2 rounded-xl border transition-all ${role===r?'bg-primary text-white border-primary':'border-border hover:border-primary/50'}`}>{r}</button>)}
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold mb-2 block">Your Skills <span className="text-foreground/50">(comma separated)</span></label>
          <Textarea value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, Node.js, Python, SQL, System Design, AWS..." className="resize-none rounded-xl" rows={3} />
        </div>
        <div className="text-center text-xs text-foreground/40">— or upload your resume —</div>
        <div onClick={() => fileRef.current?.click()} className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${resumeFile?'border-primary/50 bg-primary/5':'border-border hover:border-primary/50'}`}>
          <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => setResumeFile(e.target.files?.[0]??null)} />
          {resumeFile ? <div className="flex items-center justify-center gap-2 text-primary"><FileText className="w-4 h-4" /><span className="text-sm font-semibold">{resumeFile.name}</span></div>
            : <div><Upload className="w-6 h-6 text-foreground/30 mx-auto mb-1" /><p className="text-xs text-foreground/50">Upload PDF or DOCX</p></div>}
        </div>
        <Button onClick={startInterview} disabled={isLoading} className="w-full h-12 rounded-xl font-bold bg-primary text-white gap-2">
          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Starting...</> : <><Brain className="w-4 h-4" />Start AI Interview</>}
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[{icon:Target,label:'Sessions',val:history.length},{icon:Star,label:'Avg Score',val:avgScore?avgScore+'%':'—'},{icon:Trophy,label:'Best',val:history.length?Math.max(...history.map(h=>h.score))+'%':'—'}].map(({icon:Icon,label,val}) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center"><Icon className="w-5 h-5 text-primary mx-auto mb-1" /><div className="font-bold text-lg">{val}</div><div className="text-xs text-foreground/50">{label}</div></div>
        ))}
      </div>
    </div>
  );

  if (phase === 'report' && report) {
    const sc = report.overall_score >= 80 ? 'text-green-600' : report.overall_score >= 60 ? 'text-yellow-600' : 'text-red-600';
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">Interview Report</h1>
          <Button onClick={resetInterview} variant="outline" className="rounded-xl gap-2 text-sm"><RefreshCw className="w-4 h-4" />New Interview</Button>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className={`text-6xl font-extrabold ${sc} mb-2`}>{report.overall_score}</div>
          <div className="text-xl font-bold mb-1">{report.grade} — {report.verdict}</div>
          <p className="text-foreground/60 text-sm max-w-lg mx-auto">{report.summary}</p>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {Object.entries(report.scores).map(([k,v]) => (
            <div key={k} className="bg-card border border-border rounded-2xl p-3 text-center">
              <div className="text-xl font-extrabold text-primary">{v}</div>
              <div className="text-[10px] text-foreground/60 mt-1 capitalize leading-tight">{k.replace(/_/g,' ')}</div>
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" />Strengths</h3>
            <ul className="space-y-1.5">{report.strengths.map((s,i) => <li key={i} className="text-xs text-foreground/70 flex gap-2"><span className="text-green-500">✓</span>{s}</li>)}</ul>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-sm"><XCircle className="w-4 h-4 text-red-500" />Improvements</h3>
            <ul className="space-y-1.5">{report.weaknesses.map((s,i) => <li key={i} className="text-xs text-foreground/70 flex gap-2"><span className="text-red-500">✗</span>{s}</li>)}</ul>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2 text-sm"><TrendingUp className="w-4 h-4 text-primary" />Recommendations</h3>
          <ul className="space-y-2">{report.recommendations.map((r,i) => <li key={i} className="text-xs text-foreground/70 flex gap-2"><span className="text-primary font-bold">{i+1}.</span>{r}</li>)}</ul>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-3 text-sm">Study Topics</h3>
          <div className="flex flex-wrap gap-2">{report.study_topics.map((t,i) => <Badge key={i} variant="secondary" className="rounded-xl text-xs">{t}</Badge>)}</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-3 text-sm">Question Breakdown</h3>
          <div className="space-y-2">
            {history.map((h,i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0 ${h.score>=80?'bg-green-500':h.score>=60?'bg-yellow-500':'bg-red-500'}`}>{h.score}</div>
                <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{h.question}</p><p className="text-[10px] text-foreground/50">{h.category}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      {currentQ && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Question {currentQ.question_number} of {currentQ.total_questions}</span>
            <Button onClick={finishInterview} disabled={isLoading||history.length===0} variant="outline" size="sm" className="rounded-xl text-xs gap-1 h-7">
              <BarChart2 className="w-3 h-3" />End & Report
            </Button>
          </div>
          <Progress value={(currentQ.question_number/currentQ.total_questions)*100} className="h-1.5" />
        </div>
      )}
      {currentQ && !showEval && (
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`rounded-xl text-xs ${catColors[currentQ.category]||'bg-gray-100 text-gray-700'}`}>{currentQ.category}</Badge>
            <Badge className={`rounded-xl text-xs ${diffColors[currentQ.difficulty]||''}`}>{currentQ.difficulty}</Badge>
          </div>
          <h2 className="text-base font-semibold leading-relaxed">{currentQ.question}</h2>
          {currentQ.hint && <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-primary/80"><span className="font-semibold">Hint: </span>{currentQ.hint}</div>}
          <div className="space-y-3">
            <Textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type your answer here… or click the mic to speak" className="resize-none rounded-xl min-h-[120px] text-sm" disabled={isLoading} />
            <div className="flex gap-3">
              <Button onClick={toggleMic} variant="outline" className={`rounded-xl gap-2 text-sm ${isRecording?'bg-red-50 border-red-300 text-red-600':''}`}>
                {isRecording ? <><MicOff className="w-4 h-4" />Stop</> : <><Mic className="w-4 h-4" />Speak</>}
              </Button>
              <Button onClick={submitAnswer} disabled={isLoading||!answer.trim()} className="flex-1 rounded-xl bg-primary text-white gap-2 text-sm">
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Evaluating…</> : <><Send className="w-4 h-4" />Submit Answer</>}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
      <AnimatePresence>
        {showEval && evalResult && (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Answer Evaluation</h3>
              <div className={`text-3xl font-extrabold ${evalResult.score>=80?'text-green-600':evalResult.score>=60?'text-yellow-600':'text-red-600'}`}>{evalResult.score}/100</div>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">{evalResult.feedback}</p>
            {evalResult.strengths.length > 0 && (
              <div><p className="text-xs font-bold text-green-600 mb-1.5">STRENGTHS</p>
              <ul className="space-y-1">{evalResult.strengths.map((s,i) => <li key={i} className="text-xs text-foreground/70 flex gap-2"><CheckCircle className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />{s}</li>)}</ul></div>
            )}
            {evalResult.improvements.length > 0 && (
              <div><p className="text-xs font-bold text-yellow-600 mb-1.5">IMPROVEMENTS</p>
              <ul className="space-y-1">{evalResult.improvements.map((s,i) => <li key={i} className="text-xs text-foreground/70 flex gap-2"><AlertCircle className="w-3 h-3 text-yellow-500 shrink-0 mt-0.5" />{s}</li>)}</ul></div>
            )}
            <details><summary className="text-xs font-bold text-primary cursor-pointer">View Sample Answer</summary>
              <div className="mt-2 bg-muted/40 rounded-xl p-3 text-xs text-foreground/70 leading-relaxed">{evalResult.sample_answer}</div>
            </details>
            {evalResult.next_question ? (
              <Button onClick={nextQuestion} className="w-full rounded-xl bg-primary text-white gap-2">Next Question <ChevronRight className="w-4 h-4" /></Button>
            ) : (
              <Button onClick={finishInterview} disabled={isLoading} className="w-full rounded-xl bg-primary text-white gap-2">
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating Report…</> : <><BarChart2 className="w-4 h-4" />View Final Report</>}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
