import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import {
  Users, ArrowLeft, ArrowRight, CheckCircle, Loader2,
  Lightbulb, Star, BarChart2, RefreshCw, Trophy, MessageSquare,
  Mic, MicOff, Camera, CameraOff, Video, VideoOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const HR_QUESTIONS = [
  { q: 'Tell me about yourself.', category: 'Introduction', hint: 'Present-Past-Future: current role → key achievements → why this role excites you.' },
  { q: 'What are your greatest strengths?', category: 'Strengths', hint: 'Pick 2-3 strengths relevant to this role, each backed by a specific example.' },
  { q: 'What is your biggest weakness?', category: 'Self-Awareness', hint: 'Choose a real weakness, show you\'re actively improving it, and demonstrate self-awareness.' },
  { q: 'Describe a challenging project and how you handled it.', category: 'Behavioral', hint: 'STAR: Situation → Task → Action → Result. Quantify your impact wherever possible.' },
  { q: 'Where do you see yourself in 5 years?', category: 'Career Goals', hint: 'Show ambition aligned with the company\'s growth. Be realistic and specific.' },
  { q: 'Why do you want to work at our company?', category: 'Company Fit', hint: 'Mention specific products, values, or recent news. Show genuine research.' },
  { q: 'Describe a time you handled a difficult team conflict.', category: 'Leadership', hint: 'Focus on your actions, not blame. Show empathy, communication, and positive outcome.' },
  { q: 'Tell me about a time you failed. What did you learn?', category: 'Resilience', hint: 'Be honest about the failure, pivot quickly to what you learned and how you applied it.' },
];

interface FeedbackResult {
  score: number;
  starAnalysis: { situation: string; task: string; action: string; result: string };
  strengths: string[];
  improvements: string[];
  sampleAnswer: string;
  overallFeedback: string;
}

export default function HRInterviewSession() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [sessionResults, setSessionResults] = useState<{ q: string; score: number }[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  // Camera state
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);

  const question = HR_QUESTIONS[currentQ];

  // ── Camera ─────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraOn(true);
    } catch {
      setCameraError('Camera access denied. Please allow camera permission in your browser.');
      setCameraOn(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  // Start camera when session mounts
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // ── Voice recognition ──────────────────────────────────────────────────
  const toggleVoice = () => {
    const SR = (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported in this browser.'); return; }

    if (isListening) {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const r = new SR();
      r.continuous = true;
      r.interimResults = true;
      r.lang = 'en-US';
      r.onresult = (e: SpeechRecognitionEvent) => {
        const t = Array.from(e.results).map(res => res[0].transcript).join('');
        setAnswer(t);
      };
      r.onerror = () => { isListeningRef.current = false; setIsListening(false); };
      r.onend = () => {
        if (isListeningRef.current) {
          try { r.start(); } catch { isListeningRef.current = false; setIsListening(false); }
        } else {
          setIsListening(false);
        }
      };
      isListeningRef.current = true;
      recognitionRef.current = r;
      r.start();
      setIsListening(true);
    }
  };

  // ── Audio recording ────────────────────────────────────────────────────
  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream);
        chunksRef.current = [];
        mr.ondataavailable = e => chunksRef.current.push(e.data);
        mr.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `hr-q${currentQ + 1}.webm`; a.click();
        };
        mr.start();
        mediaRecorderRef.current = mr;
        setIsRecording(true);
      } catch { alert('Microphone access denied.'); }
    }
  };

  // ── Submit answer ──────────────────────────────────────────────────────
  async function submitAnswer() {
    if (!answer.trim()) return;
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/interview/hr-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('igpt_token')}` },
        body: JSON.stringify({ question: question.q, answer, category: question.category }),
      });
      const data = await res.json();
      const fb: FeedbackResult = data.success ? data.data : {
        score: 70, starAnalysis: { situation: 'Context provided', task: 'Role described', action: 'Steps mentioned', result: 'Outcome stated' },
        strengths: ['Clear communication', 'Relevant example given'],
        improvements: ['Add quantifiable results', 'Be more specific about your individual actions'],
        sampleAnswer: 'Structure: Situation → Task → Action → Measurable Result.',
        overallFeedback: 'Good attempt. Add concrete numbers to strengthen your STAR responses.',
      };
      setFeedback(fb);
      setSessionResults(prev => [...prev, { q: question.q, score: fb.score }]);
    } catch {
      setFeedback({ score: 65, starAnalysis: { situation: 'Provided', task: 'Partially described', action: 'Good detail', result: 'Needs specifics' }, strengths: ['Answered directly'], improvements: ['Add STAR structure', 'Quantify outcomes'], sampleAnswer: 'Set scene → Define role → Actions → Measurable result.', overallFeedback: 'Use STAR to make your answer more compelling.' });
    } finally {
      setIsLoading(false);
    }
  }

  function nextQuestion() {
    if (currentQ < HR_QUESTIONS.length - 1) {
      setCurrentQ(prev => prev + 1);
      setAnswer(''); setFeedback(null); setShowHint(false);
    } else {
      setSessionComplete(true);
    }
  }

  const avgScore = sessionResults.length > 0 ? Math.round(sessionResults.reduce((s, r) => s + r.score, 0) / sessionResults.length) : 0;

  // ── Session complete ───────────────────────────────────────────────────
  if (sessionComplete) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold mb-2">Session Complete!</h1>
          <p className="text-foreground/60 mb-8">You answered all {HR_QUESTIONS.length} HR questions</p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-card border border-border rounded-2xl p-5 text-center">
              <div className="text-3xl font-extrabold text-primary">{avgScore}</div>
              <div className="text-xs text-foreground/60 mt-1">Avg Score</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 text-center">
              <div className="text-3xl font-extrabold text-green-600">{sessionResults.filter(r => r.score >= 75).length}</div>
              <div className="text-xs text-foreground/60 mt-1">Strong Answers</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 text-center">
              <div className="text-3xl font-extrabold text-orange-500">{sessionResults.filter(r => r.score < 75).length}</div>
              <div className="text-xs text-foreground/60 mt-1">Need Work</div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 mb-6 text-left space-y-2">
            {sessionResults.map(({ q, score }, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                <span className="text-foreground/70 truncate mr-3 flex-1">{q}</span>
                <span className={`font-bold shrink-0 ${score >= 80 ? 'text-green-600' : score >= 65 ? 'text-yellow-600' : 'text-red-500'}`}>{score}/100</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => { setCurrentQ(0); setAnswer(''); setFeedback(null); setSessionResults([]); setSessionComplete(false); setShowHint(false); startCamera(); }}
              variant="outline" className="rounded-xl gap-2"><RefreshCw className="w-4 h-4" /> Retry Session</Button>
            <Link href="/dashboard/hr-interview">
              <Button className="rounded-xl gap-2 bg-primary text-white"><ArrowLeft className="w-4 h-4" /> Back to HR Prep</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Session UI ─────────────────────────────────────────────────────────
  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/dashboard/hr-interview">
          <Button variant="ghost" size="sm" className="rounded-xl gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold">HR Interview Session</h1>
          <p className="text-sm text-foreground/60">Question {currentQ + 1} of {HR_QUESTIONS.length}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-foreground/50">Progress</div>
          <div className="text-sm font-bold text-primary">{Math.round((currentQ / HR_QUESTIONS.length) * 100)}%</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-5">
        <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${(currentQ / HR_QUESTIONS.length) * 100}%` }} transition={{ duration: 0.3 }} />
      </div>

      {/* Two-column layout: camera left, content right */}
      <div className="grid lg:grid-cols-[300px_1fr] gap-5">
        {/* Left: Camera preview */}
        <div className="space-y-3">
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3] shadow-lg">
            {cameraOn ? (
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/60">
                <VideoOff className="w-10 h-10" />
                <span className="text-sm text-center px-4">{cameraError || 'Camera off'}</span>
              </div>
            )}
            {/* Live indicator */}
            {cameraOn && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white text-xs font-semibold">LIVE</span>
              </div>
            )}
            {/* Question number overlay */}
            <div className="absolute top-3 right-3 bg-primary/80 backdrop-blur-sm rounded-full px-2.5 py-1">
              <span className="text-white text-xs font-bold">Q{currentQ + 1}</span>
            </div>
          </div>

          {/* Camera controls */}
          <div className="flex gap-2">
            <Button
              onClick={cameraOn ? stopCamera : startCamera}
              variant="outline"
              size="sm"
              className={`rounded-xl flex-1 gap-2 text-xs ${cameraOn ? 'border-green-500 text-green-600' : 'border-foreground/30'}`}
            >
              {cameraOn ? <><Camera className="w-3.5 h-3.5" /> Camera On</> : <><CameraOff className="w-3.5 h-3.5" /> Camera Off</>}
            </Button>
            <Button
              onClick={toggleRecording}
              variant="outline"
              size="sm"
              className={`rounded-xl flex-1 gap-2 text-xs ${isRecording ? 'border-red-500 text-red-500' : ''}`}
            >
              {isRecording ? <><MicOff className="w-3.5 h-3.5" /> Stop Rec</> : <><Mic className="w-3.5 h-3.5" /> Record</>}
            </Button>
          </div>

          {cameraError && (
            <p className="text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/20 rounded-xl px-3 py-2">{cameraError}</p>
          )}

          {/* STAR framework labels */}
          <div className="grid grid-cols-2 gap-1.5">
            {['Situation', 'Task', 'Action', 'Result'].map((label, i) => (
              <div key={label} className={`rounded-xl px-2 py-1.5 text-center text-xs font-bold ${['bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'][i]}`}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Question + Answer + Feedback */}
        <div className="space-y-4">
          {/* Question card */}
          <AnimatePresence mode="wait">
            <motion.div key={currentQ} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl p-5 text-white"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">{question.category}</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Q{currentQ + 1}/{HR_QUESTIONS.length}</span>
                  </div>
                  <p className="font-bold leading-snug">{question.q}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Hint toggle */}
          <button onClick={() => setShowHint(!showHint)} className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline">
            <Lightbulb className="w-4 h-4" /> {showHint ? 'Hide hint' : 'Show answering tip'}
          </button>

          <AnimatePresence>
            {showHint && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300"
              >
                <strong className="block mb-1">💡 Tip:</strong> {question.hint}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Answer area */}
          {!feedback && (
            <div className="space-y-3">
              <Textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer using the STAR framework: Situation → Task → Action → Result..."
                className="min-h-[160px] rounded-xl text-sm resize-none border-border/60 focus:border-primary"
                disabled={isLoading}
              />
              <div className="flex items-center gap-3">
                <Button onClick={submitAnswer} disabled={!answer.trim() || isLoading} className="rounded-xl gap-2 bg-primary text-white flex-1">
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><MessageSquare className="w-4 h-4" /> Get AI Feedback</>}
                </Button>
                <Button variant="outline" onClick={toggleVoice} className={`rounded-xl gap-2 shrink-0 ${isListening ? 'border-red-500 text-red-500 animate-pulse' : ''}`}>
                  {isListening ? <><MicOff className="w-4 h-4" /> Stop</> : <><Mic className="w-4 h-4" /> Speak</>}
                </Button>
              </div>
            </div>
          )}

          {/* Feedback panel */}
          <AnimatePresence>
            {feedback && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">AI Feedback</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-extrabold ${feedback.score >= 80 ? 'text-green-600' : feedback.score >= 65 ? 'text-yellow-600' : 'text-red-500'}`}>{feedback.score}/100</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(feedback.score / 20) ? 'text-yellow-500 fill-current' : 'text-foreground/20'}`} />)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {Object.entries(feedback.starAnalysis).map(([key, val]) => (
                      <div key={key} className="bg-muted/50 rounded-xl p-2.5">
                        <div className="text-xs font-bold text-primary uppercase mb-1">{key}</div>
                        <p className="text-xs text-foreground/70">{val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mb-3">
                    <h4 className="text-xs font-bold text-green-600 mb-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Strengths</h4>
                    <ul className="space-y-1">{feedback.strengths.map((s, i) => <li key={i} className="text-xs text-foreground/70 flex gap-2"><span className="text-green-500">✓</span>{s}</li>)}</ul>
                  </div>
                  <div className="mb-3">
                    <h4 className="text-xs font-bold text-orange-500 mb-2 flex items-center gap-1"><BarChart2 className="w-3 h-3" /> Improvements</h4>
                    <ul className="space-y-1">{feedback.improvements.map((s, i) => <li key={i} className="text-xs text-foreground/70 flex gap-2"><span className="text-orange-400">→</span>{s}</li>)}</ul>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                    <p className="text-xs text-foreground/80 leading-relaxed">{feedback.overallFeedback}</p>
                  </div>
                </div>
                <details className="bg-card border border-border rounded-2xl overflow-hidden">
                  <summary className="px-5 py-3.5 cursor-pointer font-semibold text-sm flex items-center gap-2 hover:bg-muted/50">
                    <Lightbulb className="w-4 h-4 text-yellow-500" /> View sample strong answer
                  </summary>
                  <div className="px-5 pb-4 text-sm text-foreground/70 leading-relaxed border-t border-border pt-3">{feedback.sampleAnswer}</div>
                </details>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setFeedback(null); setAnswer(''); }} className="rounded-xl gap-2 flex-1">
                    <RefreshCw className="w-4 h-4" /> Re-answer
                  </Button>
                  <Button onClick={nextQuestion} className="rounded-xl gap-2 bg-primary text-white flex-1">
                    {currentQ < HR_QUESTIONS.length - 1 ? <><ArrowRight className="w-4 h-4" /> Next Question</> : <><Trophy className="w-4 h-4" /> Finish Session</>}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
