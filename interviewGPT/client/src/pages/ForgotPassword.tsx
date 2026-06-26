import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setSentEmail(data.email);
      setSent(true);
      toast({ title: 'OTP sent!', description: `Check your email for the OTP. (Demo: ${json.otp})` });
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link href="/login" className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>

        <div className="bg-card border border-border rounded-3xl p-8 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>

          {!sent ? (
            <>
              <h1 className="text-2xl font-extrabold text-center mb-2">Forgot password?</h1>
              <p className="text-foreground/60 text-center mb-8 text-sm">Enter your email and we'll send you a one-time password</p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label>Email address</Label>
                  <Input type="email" placeholder="you@example.com" className="mt-1.5 h-12" {...register('email')} />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>
                <Button type="submit" disabled={isSubmitting} size="lg" className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : 'Send OTP'}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
              >
                <Mail className="w-8 h-8 text-primary" />
              </motion.div>
              <h1 className="text-2xl font-extrabold mb-2">Check your email</h1>
              <p className="text-foreground/60 text-sm mb-6">We sent a 6-digit OTP to <strong>{sentEmail}</strong></p>
              <Link href={`/verify-otp?email=${encodeURIComponent(sentEmail)}&mode=reset`}>
                <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl">
                  Enter OTP
                </Button>
              </Link>
              <button onClick={() => setSent(false)} className="mt-4 text-sm text-foreground/60 hover:text-foreground transition-colors">
                Use a different email
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
