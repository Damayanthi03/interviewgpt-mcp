import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Send, BarChart2, Clock, RefreshCw, TrendingUp,
  AlertCircle, CheckCircle, Volume2, Loader2, MessageSquare, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

interface AnalysisResult {
  grammar_score: number; confidence_score: number; fluency_score: number;
  clarity_score: number; vocabulary_score: number; overall_score: number;
  tone: string;
  grammar_errors: string[]; pronunciation_suggestions: string[];
  improvement_tips: string[]; positive_feedback: string[];
  summary: string;
  filler_words: { word: string; count: number }[];
  total_filler_count: number; filler_rate_percent: number;
  word_count: number; speaking_speed_wpm: number | null; duration_seconds: number | null;
}

interface Session { id: number; date: string; duration: string; overall_score: number; transcript: string; result: AnalysisResult; }

type RecordState = 'idle' | 'recording' | 'analyzing' | 'done';

const scoreColor = (s: number) => s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : 'text-red-600';
const scoreBg = (s: number) => s >= 80 ? 'bg-green-500' : s >= 60 ? 'bg-yellow-500' : 'bg-red-500';

export default function CommunicationCoach() {
  const [state, setState] = useState<RecordState>('idle');
  const [transcript, setTranscript] = useState('');
  const [isManual, setIsManual] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isActiveRef = useRef(false);
  const { toast } = useToast();

  const startRecording = () => {
    const SR = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) { setIsManual(true); setState('recording'); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e) => { let t = ''; for (let i = 0; i < e.results.length; i++) t += e.results[i]![0]!.transcript + ' '; setTranscript(t.trim()); };
    rec.onerror = () => { toast({ title: 'Microphone error', variant: 'destructive' }); stopRecording(); };
    rec.onend = () => {
      if (isActiveRef.current) {
        try { rec.start(); } catch { /* ignore restart failures */ }
      }
    };
    recognitionRef.current = rec;
    isActiveRef.current = true;
    rec.start();
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    setState('recording');
    setTranscript('');
  };

  const stopRecording = () => {
    isActiveRef.current = false;
    recognitionRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setState('idle');
  };

  const analyze = async () => {
    if (!transcript.trim() || transcript.trim().split(/\s+/).length < 5) {
      toast({ title: 'Please speak or type at least a few sentences', variant: 'destructive' }); return;
    }
    if (state === 'recording') { recognitionRef.current?.stop(); if (timerRef.current) clearInterval(timerRef.current); }
    setState('analyzing');
    try {
      const resp = await fetch(`${BASE}/api/communication/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, durationSeconds: elapsed || null })
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error);
      const r: AnalysisResult = json.data;
      setResult(r);
      setSessions(s => [{
        id: Date.now(), date: new Date().toLocaleDateString(), duration: elapsed ? `${Math.floor(elapsed/60)}m ${elapsed%60}s` : '—',
        overall_score: r.overall_score, transcript, result: r
      }, ...s.slice(0, 9)]);
      setState('done');
    } catch (e: unknown) {
      toast({ title: (e as Error).message || 'Analysis failed', variant: 'destructive' });
      setState('idle');
    }
  };

  const reset = () => { setState('idle'); setTranscript(''); setResult(null); setElapsed(0); };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const radarData = result ? [
    { subject: 'Grammar', score: result.grammar_score },
    { subject: 'Confidence', score: result.confidence_score },
    { subject: 'Fluency', score: result.fluency_score },
    { subject: 'Clarity', score: result.clarity_score },
    { subject: 'Vocabulary', score: result.vocabulary_score },
  ] : [];

  const historyData = sessions.slice().reverse().map((s, i) => ({ name: `S${i + 1}`, score: s.overall_score }));

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold mb-1">Communication Coach</h1>
        <p className="text-foreground/60 text-sm">Record your voice or type a speech. Get instant AI analysis of filler words, grammar, fluency, and confidence.</p>
      </div>

      {/* Recording Card */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${state === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-foreground/20'}`} />
            <span className="font-semibold text-sm">{state === 'recording' ? `Recording… ${elapsed}s` : state === 'analyzing' ? 'Analyzing…' : 'Ready to record'}</span>
          </div>
          <div className="flex gap-2">
            {state === 'idle' && !isManual && (
              <Button onClick={startRecording} className="rounded-xl gap-2 bg-primary text-white">
                <Mic className="w-4 h-4" /> Start Recording
              </Button>
            )}
            {state === 'recording' && (
              <Button onClick={stopRecording} variant="outline" className="rounded-xl gap-2 border-red-300 text-red-600">
                <MicOff className="w-4 h-4" /> Stop
              </Button>
            )}
            <Button onClick={() => { setIsManual(true); setState(s => s === 'idle' ? 'recording' : s); }} variant="outline" size="sm" className="rounded-xl text-xs gap-1">
              <MessageSquare className="w-3 h-3" /> Type Instead
            </Button>
          </div>
        </div>

        <textarea
          className="w-full rounded-xl border border-border bg-muted/30 p-3 text-sm resize-none font-mono"
          rows={5}
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
          placeholder="Your speech will appear here as you speak… or type/paste a speech sample to analyze."
          readOnly={state === 'recording' && !isManual}
        />

        <div className="flex gap-3">
          {result && <Button onClick={reset} variant="outline" className="rounded-xl gap-2"><RefreshCw className="w-4 h-4" />New Session</Button>}
          <Button onClick={analyze} disabled={!transcript.trim() || state === 'analyzing'} className="flex-1 rounded-xl bg-primary text-white gap-2">
            {state === 'analyzing' ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing…</> : <><Send className="w-4 h-4" />Analyze Speech</>}
          </Button>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && state === 'done' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Score Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Overall', val: result.overall_score },
                { label: 'Grammar', val: result.grammar_score },
                { label: 'Fluency', val: result.fluency_score },
                { label: 'Confidence', val: result.confidence_score },
                { label: 'Clarity', val: result.clarity_score },
                { label: 'Vocabulary', val: result.vocabulary_score },
              ].map(({ label, val }) => (
                <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center">
                  <div className={`text-2xl font-extrabold ${scoreColor(val)}`}>{val}</div>
                  <div className="text-xs text-foreground/60 mt-0.5">{label}</div>
                  <Progress value={val} className="h-1.5 mt-2" />
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {/* Radar */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold mb-3 text-sm">Skills Radar</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <Radar name="Score" dataKey="score" stroke="#16a34a" fill="#16a34a" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Filler Words */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold mb-1 text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />Filler Word Analysis</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-muted/40 rounded-xl p-3 text-center">
                    <div className="text-xl font-extrabold text-primary">{result.total_filler_count}</div>
                    <div className="text-xs text-foreground/60">Total Fillers</div>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3 text-center">
                    <div className="text-xl font-extrabold text-primary">{result.filler_rate_percent}%</div>
                    <div className="text-xs text-foreground/60">Filler Rate</div>
                  </div>
                  {result.word_count > 0 && <div className="bg-muted/40 rounded-xl p-3 text-center">
                    <div className="text-xl font-extrabold text-primary">{result.word_count}</div>
                    <div className="text-xs text-foreground/60">Words Spoken</div>
                  </div>}
                  {result.speaking_speed_wpm && <div className="bg-muted/40 rounded-xl p-3 text-center">
                    <div className="text-xl font-extrabold text-primary">{result.speaking_speed_wpm}</div>
                    <div className="text-xs text-foreground/60">WPM</div>
                  </div>}
                </div>
                {result.filler_words.length > 0 ? (
                  <div className="space-y-1.5">
                    {result.filler_words.slice(0, 6).map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="font-medium capitalize">"{f.word}"</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(100, f.count * 20)}%` }} />
                          </div>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">×{f.count}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-600 text-xs"><CheckCircle className="w-3 h-3" />No filler words detected!</div>
                )}
              </div>
            </div>

            {/* AI Feedback */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold mb-3 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />Positive Feedback</h3>
                <ul className="space-y-1.5">{result.positive_feedback.map((s, i) => <li key={i} className="text-xs text-foreground/70 flex gap-2"><span className="text-green-500">✓</span>{s}</li>)}</ul>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold mb-3 text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Improvement Tips</h3>
                <ul className="space-y-1.5">{result.improvement_tips.map((s, i) => <li key={i} className="text-xs text-foreground/70 flex gap-2"><span className="text-primary font-bold">{i + 1}.</span>{s}</li>)}</ul>
              </div>
            </div>

            {result.grammar_errors.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold mb-3 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 text-yellow-500" />Grammar Notes</h3>
                <ul className="space-y-1.5">{result.grammar_errors.map((e, i) => <li key={i} className="text-xs text-foreground/70 flex gap-2"><span className="text-yellow-500">⚠</span>{e}</li>)}</ul>
              </div>
            )}

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
              <p className="text-sm font-semibold text-primary mb-1">AI Summary — Tone: {result.tone}</p>
              <p className="text-sm text-foreground/70">{result.summary}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session History */}
      {sessions.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold flex items-center gap-2"><BarChart2 className="w-4 h-4 text-primary" />Improvement Over Time</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={historyData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="score" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0 ${scoreBg(s.overall_score)}`}>{s.overall_score}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{s.date} · {s.duration}</p>
                  <p className="text-[10px] text-foreground/50 truncate">{s.transcript.slice(0, 60)}…</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-foreground/50"><Clock className="w-3 h-3" />{s.duration}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
