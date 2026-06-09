'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User as AuthUser } from '@supabase/supabase-js'
import OnboardingChecklist, { type OnboardingStep } from '@/components/onboarding-checklist'
import {
  User, 
  CreditCard, 
  Settings, 
  LogOut, 
  Clock, 
  Zap, 
  BarChart3,
  Bell,
  ChevronRight,
  Sparkles,
  AlertTriangle
} from 'lucide-react'

interface Subscription {
  plan?: string | null
  status?: string | null
  trial_ends_at?: string | null
}

interface Profile {
  full_name?: string | null
}

interface DashboardContentProps {
  user: AuthUser
  subscription: Subscription | null
  profile: Profile | null
}

export default function DashboardContent({ user, subscription, profile }: DashboardContentProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // Calculate trial status
  const trialEndsAt = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null
  const now = new Date()
  const isTrialActive = trialEndsAt && trialEndsAt > now
  const trialExpired = trialEndsAt && trialEndsAt <= now
  const hoursRemaining = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60))) : 0

  const quickStats = [
    { label: 'Published Sites', value: '0', icon: BarChart3, color: 'text-blue-500' },
    { label: 'New Messages', value: '0', icon: Bell, color: 'text-yellow-500' },
    { label: 'Team Members', value: '1', icon: User, color: 'text-purple-500' },
  ]

  const onboardingSteps: OnboardingStep[] = [
    {
      label: 'Explore your dashboard',
      description: "You're here — take a look around.",
      done: true,
      href: '/dashboard',
      cta: 'Open',
    },
    {
      label: 'Complete your profile',
      description: 'Add your name so your account feels like yours.',
      done: !!profile?.full_name,
      href: '/dashboard/settings',
      cta: 'Edit profile',
    },
    {
      label: 'Choose your plan',
      description: 'Pick a plan to unlock everything Flowstas offers.',
      done: subscription?.status === 'active',
      href: '/dashboard/billing',
      cta: 'View plans',
    },
  ]

  return (
    <>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}
            </h1>
            <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your account</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="btn-secondary flex items-center gap-2 w-fit"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Onboarding checklist */}
        <OnboardingChecklist steps={onboardingSteps} />

        {/* Trial Status Banner */}
        {isTrialActive && (
          <div className="glass-light rounded-2xl p-6 mb-8 border border-primary/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Trial Active</h3>
                  <p className="text-muted-foreground">
                    You have <span className="text-primary font-semibold">{hoursRemaining} hours</span> remaining in your free trial
                  </p>
                </div>
              </div>
              <Link href="/pricing" className="btn-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Upgrade Now
              </Link>
            </div>
          </div>
        )}

        {/* Trial Expired Banner */}
        {trialExpired && subscription?.status === 'trialing' && (
          <div className="glass-light rounded-2xl p-6 mb-8 border border-destructive/20 bg-destructive/5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Trial Expired</h3>
                  <p className="text-muted-foreground">
                    Your free trial has ended. Upgrade to continue using Flowstas.
                  </p>
                </div>
              </div>
              <Link href="/pricing" className="btn-primary flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Choose a Plan
              </Link>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, index) => (
            <div key={index} className="glass-light rounded-2xl p-6 card-hover">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                <span className="text-2xl font-bold text-foreground">{stat.value}</span>
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Account Info */}
          <div className="lg:col-span-2 glass-light rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Account Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{user.email}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium text-foreground">{profile?.full_name || 'Not set'}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium text-foreground">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="glass-light rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Subscription
            </h2>
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 glow">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1 capitalize">
                {subscription?.plan || 'Trial'} Plan
              </h3>
              <p className="text-sm text-muted-foreground mb-6 capitalize">
                Status: {subscription?.status || 'Active'}
              </p>
              <Link href="/pricing" className="btn-primary w-full flex items-center justify-center gap-2">
                {subscription?.plan === 'trial' ? 'Upgrade Plan' : 'Manage Subscription'}
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: BarChart3, label: 'Publish a Site', href: '/publish', color: 'bg-blue-500/10 text-blue-500' },
              { icon: User, label: 'Edit Profile', href: '/dashboard/settings', color: 'bg-purple-500/10 text-purple-500' },
              { icon: Settings, label: 'Settings', href: '/dashboard/settings', color: 'bg-gray-500/10 text-gray-400' },
              { icon: CreditCard, label: 'Billing', href: '/dashboard/billing', color: 'bg-green-500/10 text-green-500' },
            ].map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="glass-light rounded-xl p-4 flex items-center gap-4 card-hover"
              >
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-foreground">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
    </>
  )
}
