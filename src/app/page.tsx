'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Mic, CheckCircle, Clock, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center">
          {/* Logo */}
          <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-500/30">
            <Mic className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Voice Task Tracker
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Manage your tasks effortlessly with voice commands. 
            Just speak, and let the app do the rest.
          </p>

          {/* CTA Button */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:-translate-y-0.5"
          >
            Get Started
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 7l5 5m0 0l-5 5m5-5H6" 
              />
            </svg>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Mic className="w-6 h-6" />}
            title="Voice Commands"
            description="Add, complete, and delete tasks using natural voice commands"
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Instant Sync"
            description="Your tasks sync in real-time across all your devices"
          />
          <FeatureCard
            icon={<CheckCircle className="w-6 h-6" />}
            title="Smart Organization"
            description="Tasks are automatically organized by status and priority"
          />
        </div>

        {/* How it works */}
        <div className="mt-24">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <StepCard
              step="1"
              title="Sign In"
              description="Sign in securely with your Google account"
            />
            <StepCard
              step="2"
              title="Speak"
              description='Tap the microphone and say "Add task buy groceries"'
            />
            <StepCard
              step="3"
              title="Done!"
              description="Your task is added and synced automatically"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 mt-24">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500">
          <p>Voice Task Tracker © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StepCard({ 
  step, 
  title, 
  description 
}: { 
  step: string; 
  title: string; 
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
        {step}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
