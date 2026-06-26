import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, Video, Code2, Users, Brain,
  MessageSquare, Briefcase, BookOpen, Settings, LogOut,
  BrainCircuit, Menu, X, Bell, Search, Moon, Sun, ChevronRight,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FileText, label: 'Resume Analysis', href: '/dashboard/resume' },
  { icon: Video, label: 'Mock Interview', href: '/dashboard/mock-interview' },
  { icon: Code2, label: 'Coding Practice', href: '/dashboard/coding' },
  { icon: Users, label: 'HR Interview', href: '/dashboard/hr-interview' },
  { icon: Brain, label: 'Aptitude Test', href: '/dashboard/aptitude' },
  { icon: MessageSquare, label: 'Communication Coach', href: '/dashboard/communication' },
  { icon: Briefcase, label: 'Job Match', href: '/dashboard/job-match' },
  { icon: BookOpen, label: 'Learning Roadmap', href: '/dashboard/roadmap' },
];

const bottomItems = [
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

interface Props { children: React.ReactNode }

export default function DashboardLayout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('igpt_dark') === 'true');
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('igpt_dark', String(darkMode));
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    toast({ title: 'Logged out', description: 'See you next time!' });
    window.location.href = '/';
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-border/50 ${sidebarCollapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
          <BrainCircuit className="w-5 h-5 text-white" />
        </div>
        {!sidebarCollapsed && <span className="font-bold text-lg">client</span>}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, href }) => {
          const active = location === href;
          return (
            <Link key={href} href={href}>
              <div onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group relative
                  ${active ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'hover:bg-muted text-foreground/70 hover:text-foreground'}
                  ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-white' : ''}`} />
                {!sidebarCollapsed && <span className="text-sm font-medium">{label}</span>}
                {!sidebarCollapsed && active && <ChevronRight className="w-4 h-4 ml-auto" />}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                    {label}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border/50 space-y-1">
        {bottomItems.map(({ icon: Icon, label, href }) => {
          const active = location === href;
          return (
            <Link key={href} href={href}>
              <div onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all
                  ${active ? 'bg-primary text-white' : 'hover:bg-muted text-foreground/70 hover:text-foreground'}
                  ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{label}</span>}
              </div>
            </Link>
          );
        })}
        <button onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!sidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>

        {!sidebarCollapsed && user && (
          <div className="flex items-center gap-3 px-3 py-3 mt-2 bg-muted/60 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {user.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-foreground/50 truncate">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col bg-card border-r border-border/50 shadow-sm relative z-20 overflow-hidden shrink-0"
      >
        <SidebarContent />
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors z-10"
        >
          <ChevronRight className={`w-3 h-3 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
        </button>
      </motion.aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)}
            />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-40 lg:hidden flex flex-col shadow-2xl"
            >
              <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b border-border/50 bg-card/80 backdrop-blur-xl shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-muted">
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input
                placeholder="Search..."
                className="pl-9 pr-4 py-2 bg-muted rounded-xl text-sm border border-transparent focus:border-primary/30 focus:bg-background outline-none transition-all w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)}
              className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4" />}
            </button>

            <button className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <Link href="/dashboard/settings">
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-sm font-bold text-primary cursor-pointer hover:bg-primary/30 transition-colors">
                {user?.name[0]?.toUpperCase() || <User className="w-4 h-4" />}
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background dark:bg-background">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
