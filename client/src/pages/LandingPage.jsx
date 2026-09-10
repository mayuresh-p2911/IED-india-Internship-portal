import { CalendarCheck, CheckSquare, Award, BookOpen, ShoppingBag, TrendingUp, Globe, ArrowRight } from 'lucide-react';

export function LandingPage({ onGoToLogin }) {
  return (
    <div id="landing-page" className="landing-page">
      <header className="lp-header">
        <img className="lp-mark brand-img" src="/img/bluelogo.png" alt="IED India" />
        <div className="lp-brand">IED Interns</div>
        <div style={{ flex: 1 }}></div>
        <nav className="lp-nav">
          <a className="lp-nav-link" href="#lp-product">
            Product
          </a>
          <a className="lp-nav-link" href="#lp-mentors">
            Mentors
          </a>
          <a className="lp-nav-link" href="#lp-pricing">
            Pricing
          </a>
          <a className="lp-signin" id="landing-signin" onClick={onGoToLogin} style={{ cursor: 'pointer' }}>
            Sign in
          </a>
          <button className="lp-btn lp-btn-sm" id="landing-get-started" onClick={onGoToLogin}>
            Get started
          </button>
        </nav>
      </header>

      <section className="lp-hero">
        <div>
          <div className="lp-pill">
            <span></span>IED India · Internship Lifecycle Platform
          </div>
          <h1>Run your internship program end to end.</h1>
          <p className="lp-sub">
            From application to certificate — track attendance, assign tasks, review performance,
            and manage mentors for every intern in one warm, simple workspace.
          </p>
          <div className="lp-cta">
            <button className="lp-btn" id="landing-hero-cta" onClick={onGoToLogin}>
              Get started — it's free
            </button>
            <button className="lp-btn-ghost" id="landing-hero-demo" onClick={onGoToLogin}>
              Watch demo
            </button>
          </div>
        </div>
        <div className="lp-hero-img">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80"
            alt="Team"
          />
        </div>
      </section>

      <section className="lp-section" id="lp-about" style={{ paddingBottom: '40px' }}>
        <div className="lp-about-grid">
          <div className="lp-about-content">
            <div className="lp-eyebrow">About IED India</div>
            <h2>Learn Skills. Sell Products.<br />Earn Rewards.</h2>
            <p className="lp-lead" style={{ marginBottom: '24px' }}>
              IED India is a unified ecosystem designed for growth. Beyond internships, we provide a complete platform to build skills through expert-led courses, sell products in a trusted marketplace, and earn rewards through our referral network.
            </p>
            <ul className="lp-check-list">
              <li><BookOpen size={20} className="text-info" /> <span><b>Build Skills:</b> Master in-demand skills with our expert-led courses.</span></li>
              <li><ShoppingBag size={20} className="text-info" /> <span><b>Trusted Marketplace:</b> Sell and buy innovative products seamlessly.</span></li>
              <li><TrendingUp size={20} className="text-info" /> <span><b>Earn Rewards:</b> Grow your income through our robust referral network.</span></li>
            </ul>
            <a href="https://www.iedindiaofficial.com/" target="_blank" rel="noreferrer" className="lp-btn-outline" style={{ marginTop: '32px', display: 'inline-flex' }}>
              Explore IED India <ArrowRight size={18} />
            </a>
          </div>
          <div className="lp-about-visual">
            <div className="glass-card about-card-main">
              <Globe size={48} className="text-info" style={{ marginBottom: '16px' }} />
              <h3>Join Our Ecosystem</h3>
              <p>Thousands of learners, sellers, and earners are already building their future with us today.</p>
              <div className="about-stats">
                <div className="stat"><b>10K+</b><span>Active Users</span></div>
                <div className="stat"><b>50+</b><span>Courses</span></div>
              </div>
            </div>
            <div className="about-decor-circle"></div>
          </div>
        </div>
      </section>

      <section className="lp-section" id="lp-product" style={{ paddingTop: '60px' }}>
        <div style={{ textAlign: 'center', maxWidth: '620px', margin: '0 auto' }}>
          <div className="lp-eyebrow">Internship Platform</div>
          <h2>Everything the program needs, in one place</h2>
          <p className="lp-lead">
            Stop juggling spreadsheets, email threads, and chat groups. IED Interns brings the
            entire lifecycle together in a warm, intuitive workspace.
          </p>
        </div>

        <div className="lp-bento-grid">
          <div className="lp-bento-card bento-large">
            <div className="lp-bento-ico">
              <CalendarCheck size={28} />
            </div>
            <div className="lp-bento-text">
              <h3>Attendance & leave</h3>
              <p>
                Keep track of daily check-ins, monthly percentages, and manage a clean approval flow for casual, sick, and emergency leave. Forget the spreadsheets.
              </p>
            </div>
            <div className="bento-bg-glow glow-1"></div>
          </div>

          <div className="lp-bento-card">
            <div className="lp-bento-ico">
              <CheckSquare size={28} />
            </div>
            <div className="lp-bento-text">
              <h3>Tasks & reviews</h3>
              <p>
                Assign work with priorities and due dates, then review submissions with a single source of truth.
              </p>
            </div>
            <div className="bento-bg-glow glow-2"></div>
          </div>

          <div className="lp-bento-card">
            <div className="lp-bento-ico">
              <Award size={28} />
            </div>
            <div className="lp-bento-text">
              <h3>Performance</h3>
              <p>
                Rate interns across parameters and auto-generate verifiable completion certificates.
              </p>
            </div>
            <div className="bento-bg-glow glow-3"></div>
          </div>
        </div>
      </section>

      <section className="lp-section" id="lp-pricing">
        <div className="lp-cta-band">
          <div className="lp-decor-orb-1"></div>
          <div className="lp-decor-orb-2"></div>

          <div className="content-relative">
            <h2>Free for educational programs</h2>
            <p>
              No per-seat fees, no setup cost. Bring your whole cohort and start managing
              internships today.
            </p>
            <button className="lp-btn" id="landing-cta-band" onClick={onGoToLogin}>
              Get started — it's free <span>→</span>
            </button>
          </div>
        </div>
      </section>

      <footer className="lp-footer">© 2026 IED India · Internship Lifecycle Platform</footer>
    </div>
  );
}

export default LandingPage;
