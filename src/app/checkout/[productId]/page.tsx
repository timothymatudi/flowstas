import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { PRODUCTS } from '@/lib/products'
import Checkout from '@/components/checkout'

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ productId: string }>
}) {
  const { productId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const product = PRODUCTS.find(p => p.id === productId)
  
  if (!product) {
    redirect('/pricing')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pricing">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to pricing
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Subscribe to {product.name}</h1>
            <p className="text-muted-foreground">
              Complete your purchase to get started with Flowstas.
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">{product.name}</h2>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  ${(product.priceInCents / 100).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">per {product.interval}</p>
              </div>
            </div>
          </div>

          <Checkout productId={productId} />
        </div>
      </main>
    </div>
  )
}
