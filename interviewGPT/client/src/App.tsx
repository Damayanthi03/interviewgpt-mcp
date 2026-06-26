import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import OTPVerify from "@/pages/OTPVerify";
import DashboardLayout from "@/layouts/DashboardLayout";
import Dashboard from "@/pages/dashboard/Dashboard";
import ResumeAnalysis from "@/pages/dashboard/ResumeAnalysis";
import MockInterview from "@/pages/dashboard/MockInterview";
import CodingPractice from "@/pages/dashboard/CodingPractice";
import HRInterview from "@/pages/dashboard/HRInterview";
import HRInterviewSession from "@/pages/dashboard/HRInterviewSession";
import AptitudeTest from "@/pages/dashboard/AptitudeTest";
import CommunicationCoach from "@/pages/dashboard/CommunicationCoach";
import JobMatch from "@/pages/dashboard/JobMatch";
import LearningRoadmap from "@/pages/dashboard/LearningRoadmap";
import Settings from "@/pages/dashboard/Settings";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-foreground/60">Loading...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Redirect to="/login" />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Redirect to="/dashboard" />;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login">
        <GuestRoute><Login /></GuestRoute>
      </Route>
      <Route path="/register">
        <GuestRoute><Register /></GuestRoute>
      </Route>
      <Route path="/forgot-password">
        <ForgotPassword />
      </Route>
      <Route path="/verify-otp">
        <OTPVerify />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardLayout><Dashboard /></DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/resume">
        <ProtectedRoute>
          <DashboardLayout><ResumeAnalysis /></DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/mock-interview">
        <ProtectedRoute>
          <DashboardLayout><MockInterview /></DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/coding">
        <ProtectedRoute>
          <DashboardLayout><CodingPractice /></DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/hr-interview">
        <ProtectedRoute>
          <DashboardLayout><HRInterview /></DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/hr-interview/session">
        <ProtectedRoute>
          <DashboardLayout><HRInterviewSession /></DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/aptitude">
        <ProtectedRoute>
          <DashboardLayout><AptitudeTest /></DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/communication">
        <ProtectedRoute>
          <DashboardLayout><CommunicationCoach /></DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/job-match">
        <ProtectedRoute>
          <DashboardLayout><JobMatch /></DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/roadmap">
        <ProtectedRoute>
          <DashboardLayout><LearningRoadmap /></DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/settings">
        <ProtectedRoute>
          <DashboardLayout><Settings /></DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
