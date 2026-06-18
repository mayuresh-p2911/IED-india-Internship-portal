import { CalendarCheck, CheckSquare, Award } from 'lucide-react';

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

      <section className="lp-section" id="lp-product">
        <div style={{ textAlign: 'center', maxWidth: '620px', margin: '0 auto' }}>
          <div className="lp-eyebrow">The platform</div>
          <h2>Everything the program needs, in one place</h2>
          <p className="lp-lead">
            Stop juggling spreadsheets, email threads, and chat groups. IED Interns brings the
            entire lifecycle together.
          </p>
        </div>
        <div className="lp-feature-grid">
          <div className="lp-feature">
            <div className="lp-ico">
              <CalendarCheck size={24} />
            </div>
            <h3>Attendance &amp; leave</h3>
            <p>
              Daily check-ins, monthly percentages, and a clean approval flow for casual, sick,
              and emergency leave.
            </p>
          </div>
          <div className="lp-feature">
            <div className="lp-ico">
              <CheckSquare size={24} />
            </div>
            <h3>Tasks &amp; reviews</h3>
            <p>
              Assign work with priorities and due dates, then review submissions with a single
              source of truth.
            </p>
          </div>
          <div className="lp-feature">
            <div className="lp-ico">
              <Award size={24} />
            </div>
            <h3>Performance &amp; certificates</h3>
            <p>
              Rate interns across parameters and auto-generate verifiable completion certificates
              at the end.
            </p>
          </div>
        </div>
      </section>

      <section className="lp-section" id="lp-pricing">
        <div className="lp-cta-band">
          <h2>Free for educational programs</h2>
          <p>
            No per-seat fees, no setup cost. Bring your whole cohort and start managing
            internships today.
          </p>
          <button className="lp-btn" id="landing-cta-band" onClick={onGoToLogin}>
            Get started — it's free
          </button>
        </div>
      </section>

      <footer className="lp-footer">© 2026 IED India · Internship Lifecycle Platform</footer>
    </div>
  );
}

export default LandingPage;
