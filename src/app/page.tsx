import Link from 'next/link'
import {
  ArrowRight,
  Rocket,
  Globe,
  MailCheck,
  MousePointerClick,
} from 'lucide-react'

const steps = [
  { step: '01', title: 'Add your site', description: 'Paste your HTML or upload your files.', icon: MousePointerClick },
  { step: '02', title: 'Publish', description: 'One click and your site is live at its own link.', icon: Rocket },
  { step: '03', title: 'Get messages', description: 'Visitors fill your contact form — you receive every message.', icon: MailCheck },
]

const features = [
  { icon: Rocket, title: 'Publish in one click', description: 'Your website goes live instantly — no servers, no setup, no code.' },
  { icon: Globe, title: 'A real live link', description: 'Every site gets its own address you can share with anyone.' },
  { icon: MailCheck, title: 'Capture messages', description: "Your site's contact form saves every message and alerts you." },
]

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center bg-grid bg-radial">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </div>
        <div className="container mx-auto px-4 lg:px-8 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-light mb-8 animate-float">
              <Rocket className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Put your website online in seconds</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
              <span className="text-foreground">Publish your website,</span>
              <br />
              <span className="gradient-text">get it live instantly</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Add your small website, hit publish, and share a live link — no servers, no setup. Your contact form even collects messages for you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/publish" className="btn-primary text-lg px-8 py-4 flex items-center gap-2 group">
                Publish a site
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/pricing" className="btn-secondary text-lg px-8 py-4 flex items-center gap-2">
                View Pricing
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Live in <span className="gradient-text">3 simple steps</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((item, index) => (
              <div key={index} className="relative">
                <div className="glass-light rounded-2xl p-8 text-center card-hover h-full">
                  <div className="text-6xl font-bold text-primary/20 mb-4">{item.step}</div>
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 glow-sm">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-primary/40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-radial-bottom">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Everything you need to <span className="gradient-text">go live</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="glass-light rounded-2xl p-8 card-hover">
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-6 glow-sm">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 gradient-primary opacity-90" />
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="relative p-12 md:p-16 text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Put your site online today
              </h2>
              <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                Add your website and share a live link in under a minute.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/publish" className="bg-white text-gray-900 font-semibold px-8 py-4 rounded-xl hover:bg-white/90 transition-all flex items-center gap-2 group shadow-lg">
                  Publish a site
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/pricing" className="bg-white/10 backdrop-blur-sm text-white font-medium px-8 py-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all">
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
