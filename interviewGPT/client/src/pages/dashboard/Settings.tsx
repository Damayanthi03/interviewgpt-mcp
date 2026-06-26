import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Bell, Shield, Palette, Trash2, Save, Camera, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  name: z.string().min(2),
  bio: z.string().optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  location: z.string().optional(),
});
type ProfileData = z.infer<typeof profileSchema>;

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      phone: user?.phone || '',
      jobTitle: user?.jobTitle || '',
      location: user?.location || '',
    },
  });

  const onSave = async (data: ProfileData) => {
    try {
      await updateProfile(data);
      toast({ title: 'Profile updated!', description: 'Your changes have been saved.' });
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Settings</h1>
        <p className="text-foreground/60 text-sm mt-1">Manage your account preferences</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="sm:w-48 shrink-0">
          <nav className="flex sm:flex-col gap-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${activeTab === id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground/70'}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
            {activeTab === 'profile' && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
                <h2 className="font-bold text-lg">Profile Information</h2>

                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl font-extrabold text-primary">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md hover:bg-primary/90">
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                  <div>
                    <p className="font-semibold">{user?.name}</p>
                    <p className="text-sm text-foreground/60">{user?.email}</p>
                    <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold capitalize">{user?.role}</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input className="mt-1.5 h-11" {...register('name')} />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={user?.email} disabled className="mt-1.5 h-11 bg-muted cursor-not-allowed" />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input placeholder="+91 9876543210" className="mt-1.5 h-11" {...register('phone')} />
                    </div>
                    <div>
                      <Label>Job Title</Label>
                      <Input placeholder="Software Engineer" className="mt-1.5 h-11" {...register('jobTitle')} />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input placeholder="Bangalore, India" className="mt-1.5 h-11" {...register('location')} />
                    </div>
                  </div>
                  <div>
                    <Label>Bio</Label>
                    <textarea
                      {...register('bio')}
                      placeholder="Tell us a bit about yourself..."
                      rows={3}
                      className="mt-1.5 w-full px-4 py-3 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold gap-2">
                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Changes</>}
                  </Button>
                </form>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
                <h2 className="font-bold text-lg">Notification Preferences</h2>
                {[
                  { label: 'Interview Reminders', desc: 'Get reminded before scheduled mock interviews', enabled: true },
                  { label: 'Weekly Progress Report', desc: 'Summary of your weekly activity', enabled: true },
                  { label: 'New Job Matches', desc: 'When new jobs match your profile', enabled: false },
                  { label: 'Tips & Resources', desc: 'AI-curated interview tips', enabled: true },
                ].map(({ label, desc, enabled }) => (
                  <div key={label} className="flex items-center justify-between p-4 rounded-xl hover:bg-muted transition-colors">
                    <div>
                      <p className="font-semibold text-sm">{label}</p>
                      <p className="text-xs text-foreground/60">{desc}</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
                <h2 className="font-bold text-lg">Security Settings</h2>
                <div className={`flex items-center gap-3 p-4 rounded-xl ${user?.isVerified ? 'bg-green-50 dark:bg-green-900/20 border border-green-200' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200'}`}>
                  <CheckCircle className={`w-5 h-5 shrink-0 ${user?.isVerified ? 'text-primary' : 'text-yellow-500'}`} />
                  <div>
                    <p className="font-semibold text-sm">{user?.isVerified ? 'Email Verified' : 'Email Not Verified'}</p>
                    <p className="text-xs text-foreground/60">{user?.email}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Change Password</h3>
                  <div className="space-y-3">
                    <Input type="password" placeholder="Current password" className="h-11" />
                    <Input type="password" placeholder="New password" className="h-11" />
                    <Input type="password" placeholder="Confirm new password" className="h-11" />
                    <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold">Update Password</Button>
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <h3 className="font-semibold text-red-500 mb-3">Danger Zone</h3>
                  <Button variant="outline" className="border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl gap-2">
                    <Trash2 className="w-4 h-4" /> Delete Account
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
                <h2 className="font-bold text-lg">Appearance</h2>
                <div>
                  <Label className="mb-3 block">Theme</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: 'Light', preview: 'bg-white border-2 border-primary', active: true },
                      { name: 'Dark', preview: 'bg-gray-900 border-2 border-border', active: false },
                      { name: 'System', preview: 'bg-gradient-to-br from-white to-gray-900 border-2 border-border', active: false },
                    ].map(({ name, preview, active }) => (
                      <div key={name} className={`rounded-xl overflow-hidden cursor-pointer transition-all ${active ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-2 hover:ring-border hover:ring-offset-2'}`}>
                        <div className={`h-20 ${preview}`} />
                        <div className="bg-card p-2 text-center text-xs font-semibold">{name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
