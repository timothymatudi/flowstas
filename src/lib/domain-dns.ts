// The DNS targets a customer points their own domain at to go live on Flowstas.
// These are Flowstas-branded on purpose: the customer never sees the hosting
// provider underneath. For this to work, the flowstas.com DNS zone must have a
// one-time record:  connect.flowstas.com  CNAME  cname.vercel-dns.com
// (set up once by us — see the custom-domains note).
export const DNS_CNAME_TARGET = 'connect.flowstas.com'

// Fallback for apex/root domains that can't take a CNAME. Plain IP, no branding.
export const DNS_A_RECORD = '76.76.21.21'
