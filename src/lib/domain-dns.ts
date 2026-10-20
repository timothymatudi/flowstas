// The DNS targets a customer points their own domain at to go live on Flowstas.
// Flowstas-branded so the customer never sees the hosting provider underneath.
//
// Setup (one-time in your DNS zone):
//   connect.flowstas.com  CNAME  flowstas.fly.dev
//
// After running `fly ips allocate-v4 --shared` update DNS_A_RECORD with the
// IP printed by that command.
export const DNS_CNAME_TARGET = 'connect.flowstas.com'

// Fallback for apex/root domains that can't take a CNAME.
// Replace with your Fly.io dedicated IPv4: `fly ips allocate-v4 --shared`
export const DNS_A_RECORD = '66.241.124.212'
