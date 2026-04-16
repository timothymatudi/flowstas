'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Bell, Mail, Smartphone, Loader2 } from 'lucide-react'

export function NotificationSettings() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [settings, setSettings] = useState({
    emailUpdates: true,
    emailMarketing: false,
    emailSecurity: true,
    pushNotifications: false,
    pushMarketing: false,
    billingAlerts: true,
    weeklyDigest: true,
  })

  function updateSetting(key: keyof typeof settings) {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSave() {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose what emails you&apos;d like to receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <NotificationToggle
            id="emailUpdates"
            label="Product Updates"
            description="Get notified about new features and improvements"
            checked={settings.emailUpdates}
            onCheckedChange={() => updateSetting('emailUpdates')}
          />
          <NotificationToggle
            id="emailMarketing"
            label="Marketing Emails"
            description="Receive tips, offers, and promotional content"
            checked={settings.emailMarketing}
            onCheckedChange={() => updateSetting('emailMarketing')}
          />
          <NotificationToggle
            id="emailSecurity"
            label="Security Alerts"
            description="Important alerts about your account security"
            checked={settings.emailSecurity}
            onCheckedChange={() => updateSetting('emailSecurity')}
          />
          <NotificationToggle
            id="billingAlerts"
            label="Billing Alerts"
            description="Notifications about payments and invoices"
            checked={settings.billingAlerts}
            onCheckedChange={() => updateSetting('billingAlerts')}
          />
          <NotificationToggle
            id="weeklyDigest"
            label="Weekly Digest"
            description="A weekly summary of your activity and analytics"
            checked={settings.weeklyDigest}
            onCheckedChange={() => updateSetting('weeklyDigest')}
          />
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Manage browser and mobile push notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <NotificationToggle
            id="pushNotifications"
            label="Enable Push Notifications"
            description="Receive real-time notifications in your browser"
            checked={settings.pushNotifications}
            onCheckedChange={() => updateSetting('pushNotifications')}
          />
          <NotificationToggle
            id="pushMarketing"
            label="Promotional Notifications"
            description="Get notified about special offers and promotions"
            checked={settings.pushMarketing}
            onCheckedChange={() => updateSetting('pushMarketing')}
            disabled={!settings.pushNotifications}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
        {success && (
          <span className="text-sm text-green-600">Preferences saved!</span>
        )}
      </div>
    </div>
  )
}

function NotificationToggle({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onCheckedChange: () => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor={id} className={disabled ? 'text-muted-foreground' : ''}>
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  )
}
