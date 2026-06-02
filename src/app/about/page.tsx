import { Users, Target, Award, TrendingUp } from 'lucide-react'

const stats = [
  { value: '10,000+', label: 'Active Users' },
  { value: '50+', label: 'Countries' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
]

const values = [
  {
    icon: Users,
    title: 'Customer First',
    description: 'Everything we build starts with understanding our customers\' needs and challenges.',
  },
  {
    icon: Target,
    title: 'Simplicity',
    description: 'We believe powerful tools should be easy to use. No complexity, no confusion.',
  },
  {
    icon: Award,
    title: 'Excellence',
    description: 'We hold ourselves to the highest standards in everything we do.',
  },
  {
    icon: TrendingUp,
    title: 'Innovation',
    description: 'We constantly push boundaries to deliver cutting-edge solutions.',
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 pb-16 pt-24 lg:pb-24 lg:pt-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent via-background to-background" />
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              About Flowstas
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
              We are on a mission to help businesses of all sizes streamline their operations and achieve their goals.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border/40 bg-card py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-foreground md:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Our Story</h2>
            <div className="mt-8 space-y-6 text-lg leading-relaxed text-muted-foreground">
              <p>
                Flowstas was founded with a simple idea: make powerful business tools accessible to everyone. We saw too many businesses struggling with complex, expensive software that slowed them down instead of helping them grow.
              </p>
              <p>
                Our founding team came together with decades of combined experience in enterprise software, but with a shared frustration: why did business tools have to be so complicated?
              </p>
              <p>
                Today, we serve thousands of customers worldwide, from small startups to large enterprises. Our platform continues to evolve based on real feedback from real users, ensuring we always deliver exactly what businesses need.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-border/40 bg-card py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Our Values</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The principles that guide everything we do.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-2">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-border/60 bg-background p-8 shadow-premium transition-all duration-300 hover:-translate-y-1 hover:shadow-premium-lg"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-foreground/5">
                  <value.icon className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{value.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
