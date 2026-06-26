import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, CheckCircle, AlertCircle, XCircle,
  Loader2, Download, TrendingUp, Target, Star, Zap,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

interface ResumeData {
  extracted: {
    name?: string; email?: string; phone?: string; location?: string; linkedin?: string;
    skills?: string[]; education?: Array<{ degree: string; institution: string; year: string; gpa?: string }>;
    experience?: Array<{ title: string; company: string; duration: string; highlights?: string[] }>;
    projects?: Array<{ name: string; description: string; technologies?: string[] }>;
    certifications?: string[];
  };
  ats_score: number;
  ats_label: string;
  section_scores?: Record<string, number>;
  keyword_analysis?: { matched?: string[]; missing?: string[] };
  suggestions?: Array<{ type: 'success' | 'warning' | 'error'; category: string; message: string }>;
  missing_skills?: string[];
  recommended_certifications?: Array<{ name: string; provider: string; relevance: string; reason: string }>;
  recommended_projects?: Array<{ title: string; description: string; technologies?: string[]; impact: string }>;
  overall_feedback?: string;
}

const scoreColor = (s: number) => s >= 80 ? '#22c55e' : s >= 60 ? '#f59e0b' : '#ef4444';
const scoreLabel = (s: number) => s >= 80 ? 'Excellent' : s >= 65 ? 'Good' : s >= 50 ? 'Needs Improvement' : 'Poor';
const suggestionIcon = { success: CheckCircle, warning: AlertCircle, error: XCircle };
const suggestionStyle = {
  success: 'bg-green-50 border-green-100 text-green-700 dark:bg-green-900/20 dark:border-green-800',
  warning: 'bg-yellow-50 border-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800',
  error: 'bg-red-50 border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-800',
};

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-muted/50 transition-colors"
      >
        <h3 className="font-bold">{title}</h3>
        {open ? <ChevronUp className="w-4 h-4 text-foreground/50" /> : <ChevronDown className="w-4 h-4 text-foreground/50" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden"
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ResumeAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f); setResult(null); setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true); setError(null);
    try {
      const form = new FormData();
      form.append('resume', file);
      const token = localStorage.getItem('igpt_token');
      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Analysis failed');
      setResult(json.data);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const score = result?.ats_score ?? 0;
  const radialData = [{ name: 'score', value: score, fill: scoreColor(score) }];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold">Resume Analysis</h1>
        <p className="text-foreground/60 text-sm mt-1">AI-powered ATS scoring and optimization</p>
      </div>

      {!result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer
            ${dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-bold text-lg mb-2">{file ? file.name : 'Drop your resume here'}</h3>
          {file
            ? <p className="text-foreground/60 text-sm">{(file.size / 1024).toFixed(1)} KB • {file.type.includes('pdf') ? 'PDF' : 'Word Document'}</p>
            : <p className="text-foreground/60 text-sm">Supports PDF, DOC, DOCX • Max 10 MB</p>
          }
          {file && (
            <div className="mt-4 flex items-center justify-center gap-3" onClick={e => e.stopPropagation()}>
              <Button onClick={analyze} disabled={loading}
                className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl px-8 shadow-lg shadow-primary/25 gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Zap className="w-4 h-4" /> Analyze Resume</>}
              </Button>
              <Button variant="outline" onClick={() => { setFile(null); }} className="rounded-xl">
                Remove
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-12">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-3 bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-semibold">Analyzing your resume...</p>
            <p className="text-foreground/60 text-sm mt-1">Extracting content, scoring ATS, generating feedback</p>
          </div>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">Analysis Complete 🎉</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setFile(null); setResult(null); }} className="rounded-xl text-xs">
                Analyze Another
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs gap-1">
                <Download className="w-3 h-3" /> Download Report
              </Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1 bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col items-center">
              <h3 className="font-bold mb-2">ATS Score</h3>
              <div className="relative h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="80%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={radialData}>
                    <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'hsl(var(--muted))' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <div className="text-4xl font-extrabold" style={{ color: scoreColor(score) }}>{score}</div>
                  <div className="text-xs font-semibold text-foreground/60">{scoreLabel(score)}</div>
                </div>
              </div>
              <div className={`mt-2 px-4 py-1.5 rounded-xl text-sm font-bold ${score >= 80 ? 'bg-green-100 text-green-700' : score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {result.ats_label}
              </div>
            </div>

            <div className="sm:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Section Scores</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(result.section_scores || {}).map(([section, sScore]) => (
                  <div key={section}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize font-medium">{section}</span>
                      <span className="font-bold" style={{ color: scoreColor(sScore as number) }}>{sScore as number}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${sScore}%` }} transition={{ duration: 0.8 }}
                        className="h-full rounded-full" style={{ background: scoreColor(sScore as number) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {result.suggestions && result.suggestions.length > 0 && (
            <Section title={`Suggestions (${result.suggestions.length})`}>
              <div className="space-y-2">
                {result.suggestions.map(({ type, category, message }, i) => {
                  const Icon = suggestionIcon[type];
                  return (
                    <div key={i} className={`flex gap-3 p-3 rounded-xl border text-sm ${suggestionStyle[type]}`}>
                      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                      <div><span className="font-semibold">{category}: </span>{message}</div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {result.keyword_analysis && (
            <Section title="Keyword Analysis">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Matched ({result.keyword_analysis.matched?.length || 0})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keyword_analysis.matched?.map(k => (
                      <span key={k} className="text-xs px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-lg font-medium">{k}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Missing ({result.keyword_analysis.missing?.length || 0})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keyword_analysis.missing?.map(k => (
                      <span key={k} className="text-xs px-2.5 py-1 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg font-medium border border-red-100">{k}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Section>
          )}

          {result.extracted?.skills && result.extracted.skills.length > 0 && (
            <Section title="Extracted Skills">
              <div className="flex flex-wrap gap-2">
                {result.extracted.skills.map(s => (
                  <span key={s} className="text-xs px-3 py-1.5 bg-muted rounded-xl font-medium">{s}</span>
                ))}
              </div>
            </Section>
          )}

          {result.extracted?.experience && result.extracted.experience.length > 0 && (
            <Section title="Experience">
              <div className="space-y-4">
                {result.extracted.experience.map(({ title, company, duration, highlights }) => (
                  <div key={title + company} className="border-l-2 border-primary/30 pl-4">
                    <h4 className="font-semibold">{title}</h4>
                    <p className="text-sm text-foreground/60">{company} • {duration}</p>
                    {highlights && highlights.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {highlights.map((h, i) => <li key={i} className="text-xs text-foreground/70 flex gap-2"><span className="text-primary shrink-0">•</span>{h}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {result.recommended_certifications && result.recommended_certifications.length > 0 && (
            <Section title="Recommended Certifications" defaultOpen={false}>
              <div className="grid sm:grid-cols-2 gap-3">
                {result.recommended_certifications.map(({ name, provider, relevance, reason }) => (
                  <div key={name} className="p-4 bg-muted/60 rounded-xl">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-sm">{name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ${relevance === 'High' ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground/60'}`}>{relevance}</span>
                    </div>
                    <p className="text-xs text-foreground/60 mb-1">{provider}</p>
                    <p className="text-xs text-foreground/70">{reason}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {result.overall_feedback && (
            <Section title="Overall Feedback">
              <div className="flex gap-3 p-4 bg-primary/5 rounded-xl">
                <Star className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/80 leading-relaxed">{result.overall_feedback}</p>
              </div>
            </Section>
          )}
        </motion.div>
      )}
    </div>
  );
}
