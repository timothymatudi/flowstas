import Header from '@/components/header'
import Footer from '@/components/footer'
import { IntroOverlay } from '@/components/intro-overlay'

// Runs synchronously before the app paints: on the homepage, if the visitor
// hasn't seen the intro (or forced it with ?intro=1), mark <html> so the static
// cover paints immediately — no flash of the app before the intro launches.
const introBootstrap = `(function(){try{
  if(location.pathname!=='/')return;
  var force=/[?&]intro=/.test(location.search);
  var seen=false;try{seen=localStorage.getItem('flowstas-intro-seen')==='1'}catch(e){}
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(force||(!seen&&!reduce)){
    document.documentElement.classList.add('intro-active');
    // Record "seen" right now (before paint) so repeat visits skip the intro
    // even if the visitor navigates away before it finishes. A forced replay
    // (?intro=) does not consume the flag.
    if(!force){try{localStorage.setItem('flowstas-intro-seen','1')}catch(e){}}
  }
}catch(e){}})();`

// Layout for public marketing + auth pages (/, /pricing, /about, /contact,
// /privacy, /terms, /success, /cancel, /auth/*). These keep the marketing
// header/footer; logged-in product pages live under app/(app) and get the
// dashboard shell instead.
export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      {/* Runs before the rest of the body paints (see introBootstrap), then an
          instant dark cover so the app never flashes in front of the intro. */}
      <script dangerouslySetInnerHTML={{ __html: introBootstrap }} />
      <div id="intro-precover" aria-hidden="true" />
      <IntroOverlay />
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  )
}
