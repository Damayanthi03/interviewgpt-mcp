import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  BrainCircuit, FileText, Video, Code2, Users, Brain, MessageSquare,
  Briefcase, BookOpen, ArrowRight, Star, Zap,
  BarChart2, Shield, ChevronDown, Play, Bot, MoveRight,
  User, Phone, Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import InterviewImage from "@/assets/interview-ui.png";
const features = [
  { icon: FileText, title: 'Resume ATS Analysis', desc: 'AI-powered resume scoring, keyword optimization, and improvement tips to pass ATS filters.', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  { icon: Video, title: 'AI Mock Interviews', desc: 'Upload your resume, let AI identify your skills and ask tailored questions with instant feedback.', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  { icon: Code2, title: 'Coding Practice', desc: 'Solve DSA problems with Monaco editor, live code execution, and AI complexity analysis.', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  { icon: Users, title: 'HR Round Prep', desc: 'Master behavioral questions using STAR framework with personalized model answers.', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
  { icon: Brain, title: 'Aptitude Tests', desc: 'Timed tests for quantitative, logical, and verbal reasoning with detailed solutions.', color: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30' },
  { icon: MessageSquare, title: 'Communication Coach', desc: 'Record voice, detect filler words, get grammar and fluency scores with improvement tips.', color: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30' },
  { icon: Briefcase, title: 'Job Matching', desc: 'Match to LinkedIn jobs based on your skills and experience with one-click apply.', color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' },
  { icon: BookOpen, title: 'Learning Roadmap', desc: 'Personalized week-by-week study plan to land your dream role on your timeline.', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
];

const stats = [
  { value: '20,000+', label: 'Active Students', icon: Users },
  { value: '95%', label: 'Success Rate', icon: BarChart2 },
  { value: '500+', label: 'Companies Covered', icon: Briefcase },
  { value: '4.9★', label: 'Average Rating', icon: Star },
];

const faqs = [
  { q: 'Is client free?', a: 'Yes! Core features including mock interviews, resume analysis, and coding practice are completely free. We offer a Pro plan for advanced analytics and personalized coaching.' },
  { q: 'How accurate is the ATS resume analysis?', a: 'Our AI is trained on thousands of resumes and real ATS systems. It provides highly accurate scoring and actionable improvement suggestions.' },
  { q: 'Which companies does client prepare for?', a: 'We cover 500+ companies including Google, Amazon, Microsoft, Meta, Flipkart, Swiggy, Zomato, TCS, Infosys, and many more with company-specific question patterns.' },
  { q: 'How are mock interviews conducted?', a: 'Upload your resume, our AI reads it, identifies your skills, and asks personalized questions. Answer via text or microphone and get instant AI feedback.' },
];

const fadeIn = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl">client</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/70">
            {['Features', 'How it Works', 'FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-foreground transition-colors">{item}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" className="rounded-xl font-semibold">Sign In</Button></Link>
            <Link href="/register"><Button className="rounded-xl font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">Get Started Free</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero — matches reference design */}
      <section className="relative pt-14 pb-6 px-6 overflow-hidden bg-gradient-to-b from-green-50/70 to-background">
        {/* Decorative rotated diamond outlines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-6 left-4 w-20 h-20 border-[3px] border-primary/25 rotate-45 rounded-xl" />
          <div className="absolute top-16 left-14 w-9 h-9 border-2 border-primary/15 rotate-45 rounded-lg" />
          <div className="absolute top-6 right-4 w-20 h-20 border-[3px] border-primary/25 rotate-45 rounded-xl" />
          <div className="absolute top-16 right-14 w-9 h-9 border-2 border-primary/15 rotate-45 rounded-lg" />
          <div className="absolute bottom-16 left-6 w-14 h-14 border-2 border-primary/20 rotate-45 rounded-lg" />
          <div className="absolute bottom-16 right-6 w-14 h-14 border-2 border-primary/20 rotate-45 rounded-lg" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Centered heading */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-5"
            >
              <Zap className="w-3.5 h-3.5" /> Powered by GPT-4 AI
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
              className="text-5xl sm:text-6xl font-extrabold leading-tight mb-4 tracking-tight"
            >
              Master Every{' '}
              <span className="inline-flex items-center gap-3 align-middle">
                <span className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-full shadow-lg shadow-primary/30">
                  <MoveRight className="w-7 h-7 text-white" />
                </span>
                {' '}Interview with
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-500">client</span>
              {' '}
              <span className="inline-flex items-center justify-center w-14 h-14 bg-foreground/90 rounded-full shadow-lg align-middle">
                <Bot className="w-7 h-7 text-background" />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
              className="text-lg text-foreground/60 max-w-xl mx-auto leading-relaxed"
            >
              From resume to offer letter — practice real interviews with AI, get instant feedback, and land your dream job faster.
            </motion.p>
          </div>

          {/* Three-column layout below heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] gap-6 items-center"
          >
            {/* Left: social proof + CTA */}
            <div className="flex flex-col gap-4 items-center lg:items-start text-center lg:text-left order-2 lg:order-1">
              {/* Person silhouette avatars */}
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full bg-primary/15 border-2 border-white dark:border-background flex items-center justify-center">
                    <User className="w-5 h-5 text-primary/70" />
                  </div>
                ))}
              </div>
              {/* Stars + review count */}
              <div>
                <div className="flex items-center gap-0.5 mb-1 justify-center lg:justify-start">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />)}
                </div>
                <p className="text-sm font-extrabold text-foreground">15,927 reviews</p>
              </div>
              {/* Testimonial quote */}
              <p className="text-sm text-foreground/65 leading-relaxed max-w-[190px]">
                "client helped me crack Google and improved my confidence!"
              </p>
              {/* CTA */}
              <Link href="/register" className="w-full">
                <Button size="lg" className="rounded-xl px-5 h-12 text-sm font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 gap-2 w-full">
                  Start Mock Interview
                </Button>
              </Link>
            </div>

            {/* Center: video interview card — matches reference */}
            <div className="relative order-1 lg:order-2">
             <div className="relative flex justify-center items-center mt-12">

              <img
                src={InterviewImage}
                alt="AI Interview"
                className="
                w-full
                max-w-[920px]
                rounded-[28px]
                shadow-2xl
                object-cover
                border border-gray-200
                 "
               />
               </div>
            </div>

            {/* Right: success panel */}
            <div className="flex flex-col gap-4 items-center lg:items-start order-3">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-md w-full max-w-[210px]">
                <h3 className="font-extrabold text-sm leading-snug mb-2 text-foreground">
                  Let's turn your preparation into success
                </h3>
                <p className="text-xs text-foreground/60 leading-relaxed mb-4">
                  Our top specialists will help you create the project of your dreams.
                </p>
                <Link href="/login">
                  <Button variant="outline" size="sm" className="rounded-xl gap-1.5 border-primary/50 text-primary hover:bg-primary/5 font-semibold text-xs w-full">
                    <Play className="w-3 h-3 fill-current" /> Watch Demo
                  </Button>
                </Link>
              </div>
              <motion.div
                animate={{ y: [-4, 4, -4] }} transition={{ duration: 3, repeat: Infinity }}
                className="bg-card border border-border rounded-2xl px-5 py-3 shadow-lg"
              >
                <div className="text-xs text-foreground/60">ATS Score</div>
                <div className="text-2xl font-extrabold text-primary">92/100</div>
              </motion.div>
            </div>
          </motion.div>

          <div className="flex justify-center mt-10">
            <ChevronDown className="w-6 h-6 text-foreground/30 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map(({ value, label, icon: Icon }) => (
              <motion.div key={label} {...fadeIn} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl font-extrabold text-primary">{value}</div>
                <div className="text-sm text-foreground/60 mt-1">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-14">
            <h2 className="text-4xl font-extrabold mb-4">Everything you need to ace interviews</h2>
            <p className="text-foreground/60 text-lg max-w-2xl mx-auto">8 AI-powered tools in one platform. Practice smarter, not harder.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div key={title} {...fadeIn} transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-14">
            <h2 className="text-4xl font-extrabold mb-4">How it works</h2>
            <p className="text-foreground/60 text-lg">Get interview-ready in 3 simple steps</p>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Upload Your Resume', desc: 'Upload your resume and our AI instantly analyzes it — extracting skills, experience, and generating your ATS score.' },
              { step: '02', title: 'Practice with AI', desc: 'AI asks personalized questions based on your skills. Answer via text or microphone. Get real-time feedback on every response.' },
              { step: '03', title: 'Land the Job', desc: 'Track your scores, fix weak spots, match to LinkedIn jobs, and walk into every interview with full confidence.' },
            ].map(({ step, title, desc }, i) => (
              <motion.div key={step} {...fadeIn} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary text-white text-lg font-extrabold flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/30">
                  {step}
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-foreground/60 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 bg-muted/20">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-14">
            <h2 className="text-4xl font-extrabold mb-4">Frequently Asked Questions</h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map(({ q, a }) => (
              <motion.div key={q} {...fadeIn} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary shrink-0" /> {q}
                </h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeIn}
            className="bg-gradient-to-r from-primary to-green-600 rounded-3xl p-12 text-white text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full" />
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl font-extrabold mb-4">Ready to master your interviews?</h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">Join 20,000+ students who've transformed their careers with client</p>
              <Link href="/register">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-extrabold rounded-2xl px-10 h-14 text-base shadow-xl gap-2">
                  Start for Free <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">client</span>
          </div>
          <p className="text-sm text-foreground/50">© 2026 client. Built with ❤️ for job seekers.</p>
          <div className="flex gap-4 text-sm text-foreground/50">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
