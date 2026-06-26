import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, BrainCircuit, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
type FormData = z.infer<typeof schema>;

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await registerUser(data.name, data.email, data.password);
      toast({ title: 'Account created!', description: `Your OTP is: ${result.otp}` });
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err: unknown) {
      toast({ title: 'Registration failed', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const perks = ['AI-powered mock interviews', 'Real-time feedback & scoring', 'Company-specific prep', 'Track progress over time'];

  return (
    <div className="min-h-screen flex bg-background">
      <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/90 to-green-700 flex-col items-center justify-center p-12 relative overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <motion.div key={i} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 2 }}
              className={`absolute rounded-full bg-white/10 ${i === 0 ? '-top-20 -left-20 w-80 h-80' : i === 1 ? '-bottom-10 -right-10 w-96 h-96' : 'top-1/3 right-10 w-40 h-40'}`}
            />
          ))}
        </div>
        <div className="relative z-10 text-white max-w-sm w-full">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-8 shadow-xl">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-extrabold mb-4">Start your journey</h2>
          <p className="text-white/80 text-lg mb-8">Join 20,000+ candidates who've landed their dream jobs with client</p>
          <ul className="space-y-4">
            {perks.map(p => (
              <li key={p} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-white/90 shrink-0" />
                <span className="text-white/90">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto"
      >
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <BrainCircuit className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold">client</span>
          </div>
          <h1 className="text-3xl font-extrabold mb-2">Create account</h1>
          <p className="text-foreground/60 mb-8">Free forever. No credit card required.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input placeholder="John Doe" className="mt-1.5 h-12" {...register('name')} />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" placeholder="you@example.com" className="mt-1.5 h-12" {...register('email')} />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative mt-1.5">
                <Input type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" className="h-12 pr-12" {...register('password')} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input type="password" placeholder="Repeat password" className="mt-1.5 h-12" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} size="lg" className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/25 mt-2">
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</> : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-foreground/60 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
