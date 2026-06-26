import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, ExternalLink, TrendingUp, Target, Bookmark, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const SKILLS_LIST = ['React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'AWS', 'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'Java', 'Spring Boot', 'Machine Learning', 'TensorFlow', 'Data Science', 'DevOps', 'Go', 'Rust', 'GraphQL', 'Redis'];

const ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'Cloud Architect', 'Product Manager',
  'Android Developer', 'iOS Developer', 'Site Reliability Engineer'
];

const LOCATIONS = ['Remote', 'Bangalore', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai', 'San Francisco', 'New York', 'London'];

const FEATURED_JOBS = [
  { company: 'Google', role: 'Senior Software Engineer', location: 'Bangalore / Remote', salary: '₹40–80 LPA', skills: ['Python', 'Go', 'Distributed Systems', 'Kubernetes'], match: 91, logo: 'G', color: 'bg-blue-500' },
  { company: 'Amazon', role: 'SDE-II', location: 'Hyderabad', salary: '₹30–60 LPA', skills: ['Java', 'AWS', 'Spring Boot', 'Microservices'], match: 87, logo: 'A', color: 'bg-orange-500' },
  { company: 'Microsoft', role: 'Software Engineer II', location: 'Bangalore', salary: '₹35–65 LPA', skills: ['C#', 'Azure', 'TypeScript', 'React'], match: 84, logo: 'M', color: 'bg-blue-600' },
  { company: 'Flipkart', role: 'Full Stack Developer', location: 'Bangalore', salary: '₹20–40 LPA', skills: ['React', 'Node.js', 'MongoDB', 'Redis'], match: 95, logo: 'F', color: 'bg-blue-700' },
  { company: 'Swiggy', role: 'Backend Engineer', location: 'Bangalore / Remote', salary: '₹18–35 LPA', skills: ['Go', 'Kafka', 'PostgreSQL', 'Docker'], match: 78, logo: 'S', color: 'bg-orange-600' },
  { company: 'Zomato', role: 'Data Scientist', location: 'Gurugram', salary: '₹15–30 LPA', skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow'], match: 82, logo: 'Z', color: 'bg-red-500' },
];

const matchColor = (m: number) => m >= 90 ? 'text-green-600 bg-green-100' : m >= 75 ? 'text-blue-600 bg-blue-100' : 'text-yellow-600 bg-yellow-100';

function buildLinkedInUrl(role: string, location: string, skills: string[]): string {
  const keywords = [role, ...skills.slice(0, 3)].join(' ');
  const params = new URLSearchParams({ keywords, location: location !== 'Remote' ? location : '' });
  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}

export default function JobMatch() {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState('Software Engineer');
  const [selectedLocation, setSelectedLocation] = useState('Remote');
  const [experience, setExperience] = useState('0-2');
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const toggleSkill = (s: string) => setSelectedSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleSave = (company: string) => setSaved(prev => { const n = new Set(prev); n.has(company) ? n.delete(company) : n.add(company); return n; });

  const openLinkedIn = (role?: string, location?: string, skills?: string[]) => {
    const r = role || selectedRole;
    const l = location || selectedLocation;
    const s = skills || selectedSkills;
    const url = buildLinkedInUrl(r, l, s);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const filteredJobs = FEATURED_JOBS.filter(j =>
    selectedSkills.length === 0 || selectedSkills.some(s => j.skills.includes(s))
  ).sort((a, b) => b.match - a.match);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold mb-1">Job Match</h1>
        <p className="text-foreground/60 text-sm">Select your skills and target role, then find matching jobs on LinkedIn instantly.</p>
      </div>

      {/* Search Builder */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <h3 className="font-bold flex items-center gap-2"><Filter className="w-4 h-4 text-primary" />Build Your Job Search</h3>

        <div>
          <label className="text-sm font-semibold mb-2 block">Target Role</label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(r => (
              <button key={r} onClick={() => setSelectedRole(r)}
                className={`text-xs px-3 py-2 rounded-xl border transition-all ${selectedRole === r ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary/50'}`}
              >{r}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Your Skills <span className="text-foreground/50">(select all that apply)</span></label>
          <div className="flex flex-wrap gap-2">
            {SKILLS_LIST.map(s => (
              <button key={s} onClick={() => toggleSkill(s)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${selectedSkills.includes(s) ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary/50'}`}
              >{s}</button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Location</label>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map(l => (
                <button key={l} onClick={() => setSelectedLocation(l)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${selectedLocation === l ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary/50'}`}
                >{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">Experience</label>
            <div className="flex flex-wrap gap-2">
              {['0-2', '2-5', '5-10', '10+'].map(e => (
                <button key={e} onClick={() => setExperience(e)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${experience === e ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary/50'}`}
                >{e} yrs</button>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={() => openLinkedIn()} className="w-full h-12 rounded-xl font-bold bg-[#0077B5] hover:bg-[#006098] text-white gap-2 text-base">
          <ExternalLink className="w-5 h-5" /> Search Jobs on LinkedIn
        </Button>
        {selectedSkills.length > 0 && (
          <p className="text-xs text-foreground/50 text-center">Searching for: <span className="font-medium text-foreground/70">{selectedRole}</span> with {selectedSkills.join(', ')} in {selectedLocation}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[{icon:Target,label:'Best Match',val:'95%'},{icon:Briefcase,label:'Job Openings',val:'2,400+'},{icon:TrendingUp,label:'Avg Salary',val:'₹25 LPA'}].map(({icon:Icon,label,val}) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center">
            <Icon className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="font-bold text-lg">{val}</div>
            <div className="text-xs text-foreground/50">{label}</div>
          </div>
        ))}
      </div>

      {/* Featured Jobs */}
      <div className="space-y-4">
        <h3 className="font-bold flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" />Featured Opportunities</h3>
        <div className="space-y-3">
          {filteredJobs.map(job => (
            <motion.div key={job.company} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/20 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl ${job.color} flex items-center justify-center text-white font-extrabold text-lg shrink-0`}>{job.logo}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm">{job.role}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${matchColor(job.match)}`}>{job.match}% match</span>
                    </div>
                    <p className="text-sm text-foreground/60 mt-0.5">{job.company}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-foreground/50">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                      <span className="font-semibold text-foreground/70">{job.salary}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {job.skills.map(s => <Badge key={s} variant="secondary" className="text-[10px] rounded-lg px-2 py-0.5">{s}</Badge>)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button size="sm" onClick={() => openLinkedIn(job.role, job.location.split(' /')[0]!, job.skills)}
                    className="rounded-xl bg-[#0077B5] hover:bg-[#006098] text-white gap-1.5 text-xs h-8"
                  >
                    <ExternalLink className="w-3 h-3" /> Apply
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleSave(job.company)}
                    className={`rounded-xl gap-1.5 text-xs h-8 ${saved.has(job.company) ? 'bg-primary/10 border-primary/30 text-primary' : ''}`}
                  >
                    <Bookmark className={`w-3 h-3 ${saved.has(job.company) ? 'fill-current' : ''}`} />
                    {saved.has(job.company) ? 'Saved' : 'Save'}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* LinkedIn Banner */}
      <div className="bg-gradient-to-r from-[#0077B5] to-[#00a0dc] rounded-2xl p-6 text-white text-center">
        <p className="font-bold text-lg mb-1">Ready to apply?</p>
        <p className="text-white/80 text-sm mb-4">Open LinkedIn Jobs with your skills pre-filled to find hundreds more opportunities.</p>
        <Button onClick={() => openLinkedIn()} className="bg-white text-[#0077B5] hover:bg-white/90 font-bold rounded-xl gap-2 px-6">
          <ExternalLink className="w-4 h-4" /> Open LinkedIn Jobs
        </Button>
      </div>
    </div>
  );
}
