import { useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { motion } from 'framer-motion';
import { Loader2, Shield, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function OTPVerify() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const email = params.get('email') || '';
  const mode = params.get('mode') || 'verify';
  const isReset = mode === 'reset';

  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setIsLoading(true);
    try {
      const body: Record<string, string> = { email, otp };
      if (isReset && newPassword) body.newPassword = newPassword;

      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      if (data.token) {
        localStorage.setItem('igpt_token', data.token);
        await refreshUser();
      }

      toast({ title: 'Verified!', description: isReset ? 'Password reset successfully' : 'Email verified successfully' });
      navigate('/dashboard');
    } catch (err: unknown) {
      toast({ title: 'Verification failed', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-card border border-border rounded-3xl p-8 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-2xl font-extrabold text-center mb-2">{isReset ? 'Reset Password' : 'Verify Email'}</h1>
          <p className="text-foreground/60 text-center text-sm mb-2">
            We sent a 6-digit code to
          </p>
          <p className="font-semibold text-center mb-8">{email}</p>

          <div className="flex justify-center mb-6">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                {[0,1,2,3,4,5].map(i => (
                  <InputOTPSlot key={i} index={i} className="w-12 h-14 text-xl font-bold border-2" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {isReset && (
            <div className="mb-6">
              <Label>New Password</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password (min. 8 characters)"
                  className="h-12 pr-12"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          <Button
            onClick={handleVerify}
            disabled={otp.length !== 6 || isLoading || (isReset && newPassword.length < 8)}
            size="lg"
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</> : 'Verify & Continue'}
          </Button>

          <button
            onClick={() => navigate('/login')}
            className="w-full text-center text-sm text-foreground/60 hover:text-foreground transition-colors mt-4"
          >
            Back to login
          </button>
        </div>
      </motion.div>
    </div>
  );
}
