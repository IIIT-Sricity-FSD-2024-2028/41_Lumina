import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth.service';
import Footer from '../components/Footer';
import styles from './Landing.module.css';

export default function Landing() {
  const { isAuthenticated, role } = useAuth();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'annual'

  // Pricing calculation (20% discount on annual)
  const isAnnual = billingCycle === 'annual';
  const prices = {
    starter: isAnnual ? '1,199' : '1,499',
    campus: isAnnual ? '3,199' : '3,999',
    enterprise: isAnnual ? '7,199' : '8,999',
  };

  const dashboardRoute = authService.getDashboardRoute(role);

  return (
    <div className={styles.pageWrapper}>
      {/* 1. Header Navigation */}
      <header className={styles.siteHeader}>
        <div className={styles.logoGroup}>
          <img src="/assets/icons/logo.svg" alt="Lumina" className={styles.logoIcon} />
          <span>Lumina</span>
        </div>

        <nav className={styles.mainNav}>
          <a href="#">Home</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing & Plans</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>

        <div>
          {isAuthenticated ? (
            <Link to={dashboardRoute} className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.875rem' }}>
              Go to Dashboard
            </Link>
          ) : (
            <Link to="/login" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.875rem' }}>
              Login
            </Link>
          )}
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.statusBadge}>ENTERPRISE ACADEMIC SAAS PLATFORM</div>
        <h1 className={styles.heroTitle}>
          Intelligent Academic<br />Planning & Enrollment.
        </h1>
        <p className={styles.heroSubtitle}>
          Empowering universities with multi-term visual roadmaps, collision-free timetable allocation,
          dynamic policy governance, and seamless student registration.
        </p>
        <div className={styles.heroActions}>
          <Link to={isAuthenticated ? dashboardRoute : '/login'} className="btn-primary">
            {isAuthenticated ? 'Go to Dashboard' : 'Login to Portal'}
          </Link>
          <a href="#pricing" className="btn-outline">
            Explore SaaS Plans
          </a>
        </div>
      </section>

      {/* 3. Features Section */}
      <section id="features" className={styles.featuresSection}>
        <h2 className={styles.sectionTitle}>Take Control of Your Academic Journey</h2>
        <p className={styles.sectionSubtitle}>
          Advanced tools designed for student success and institutional clarity.
        </p>

        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <img src="/assets/icons/compass.svg" alt="Roadmaps" className={styles.featureIcon} />
            <h3>Multi-Term Roadmaps</h3>
            <p>
              Navigate your entire degree with a clear visual compass. Plan prerequisites and balance workloads across multiple semesters.
            </p>
          </div>

          <div className={styles.featureCard}>
            <img src="/assets/icons/tick.svg" alt="Enrollment" className={styles.featureIcon} />
            <h3>Frictionless Enrollment</h3>
            <p>
              Register for classes with a single click. Our system handles prerequisite validation in real-time to ensure zero friction during peak registration.
            </p>
          </div>

          <div className={styles.featureCard}>
            <img src="/assets/icons/logo.svg" alt="Degree Audit" className={styles.featureIcon} />
            <h3>Real-Time Degree Audit</h3>
            <p>
              Monitor progress toward graduation with automated requirement checking. Know exactly what credits are needed to complete your degree.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Pricing Section */}
      <section id="pricing" className={styles.pricingSection}>
        <h2 className={styles.sectionTitle}>Institutional Licensing & Pricing</h2>
        <p className={styles.sectionSubtitle}>
          Flexible, scalable SaaS tiers engineered for universities and multi-campus institutes.
        </p>

        {/* Toggle Switch */}
        <div className={styles.pricingToggleWrapper}>
          <button
            className={`${styles.pricingToggleBtn} ${!isAnnual ? styles.active : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly Billing
          </button>
          <button
            className={`${styles.pricingToggleBtn} ${isAnnual ? styles.active : ''}`}
            onClick={() => setBillingCycle('annual')}
          >
            Annual Billing <span className={styles.discountBadge}>Save 20%</span>
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div className={styles.pricingGrid}>
          {/* Tier 1: Starter College */}
          <div className={styles.pricingCard}>
            <div className={styles.pricingCardHeader}>
              <h3>Starter College</h3>
              <p className={styles.pricingTagline}>Core course catalog & enrollment for regional colleges.</p>
            </div>
            <div className={styles.priceDisplay}>
              <span className={styles.priceCurrency}>$</span>
              <span className={styles.priceAmount}>{prices.starter}</span>
              <span className={styles.pricePeriod}>/ month</span>
            </div>
            <div className={styles.capacityBadge}>👥 Up to 2,500 Enrolled Students</div>
            <ul className={styles.featuresList}>
              <li>Course Catalog & Prerequisite Engine</li>
              <li>Student Course Registration & Rosters</li>
              <li>Faculty Grade Entry & Submission</li>
              <li>Departmental Course Announcements</li>
              <li>Student Tuition Ledger & Fee Status</li>
            </ul>
            <Link to="/login" className={styles.pricingCtaBtn}>Get Started</Link>
          </div>

          {/* Tier 2: University Campus (Featured) */}
          <div className={`${styles.pricingCard} ${styles.featured}`}>
            <div className={styles.featuredPill}>Most Popular for Universities</div>
            <div className={styles.pricingCardHeader}>
              <h3>University Campus</h3>
              <p className={styles.pricingTagline}>Full academic governance, timetable scheduling & policy administration.</p>
            </div>
            <div className={styles.priceDisplay}>
              <span className={styles.priceCurrency}>$</span>
              <span className={styles.priceAmount}>{prices.campus}</span>
              <span className={styles.pricePeriod}>/ month</span>
            </div>
            <div className={styles.capacityBadge}>👥 Up to 15,000 Enrolled Students</div>
            <ul className={styles.featuresList}>
              <li>Everything in Starter College, plus:</li>
              <li>Assistant Dean 1: Slot & Room Timetable Allocator</li>
              <li>Assistant Dean 2: Enrollment Phases & Policy Engine</li>
              <li>Dean: Override Request Approval Pipeline</li>
              <li>Multi-Term Visual Degree Roadmaps</li>
              <li>Syllabus PDF Upload System</li>
            </ul>
            <Link to="/login" className={styles.pricingCtaBtn} style={{ backgroundColor: 'var(--accent-blue)' }}>
              Deploy Campus Plan
            </Link>
          </div>

          {/* Tier 3: Multi-Campus Enterprise */}
          <div className={styles.pricingCard}>
            <div className={styles.pricingCardHeader}>
              <h3>Multi-Campus Enterprise</h3>
              <p className={styles.pricingTagline}>Full Lumina platform suite with Super User console & dedicated SPOC.</p>
            </div>
            <div className={styles.priceDisplay}>
              <span className={styles.priceCurrency}>$</span>
              <span className={styles.priceAmount}>{prices.enterprise}</span>
              <span className={styles.pricePeriod}>/ month</span>
            </div>
            <div className={styles.capacityBadge}>👥 Unlimited Students & Campuses</div>
            <ul className={styles.featuresList}>
              <li>All University Campus Modules Included</li>
              <li>Super User Root Entity CRUD (8 Datasets)</li>
              <li>Live Multi-Stream System Logs (Access, Error, Auth)</li>
              <li>Automated Log Archival & Maintenance</li>
              <li>Dedicated Lumina Admin Team (Institute SPOC)</li>
              <li>Institutional Revenue & Tuition Collection Analytics</li>
            </ul>
            <Link to="/login" className={styles.pricingCtaBtn}>Contact Enterprise Team</Link>
          </div>
        </div>
      </section>

            {/* 5. About Section (Dark Navy) */}
      <section id="about" className={styles.aboutSection}>
        <div className={styles.aboutContainer}>
          <h2>About Lumina</h2>
          <p className={styles.aboutLead}>
            Empowering Academic Journeys Through <strong>Intelligent Architecture</strong>.<br />
            Lumina is more than a portal; it's the backbone of modern education management.
          </p>

          <div className={styles.aboutList}>
            <div className={styles.aboutItem}>
              <h3>Automated Degree Audits</h3>
              <p>
                Algorithmic checking of degree requirements against student transcripts for instantaneous progress tracking.
              </p>
            </div>

            <div className={styles.aboutItem}>
              <h3>Faculty Tools</h3>
              <p>
                Powerful dashboards for advisors to monitor student health and approve course deviations efficiently.
              </p>
            </div>

            <div className={styles.aboutItem}>
              <h3>Institution Compliance</h3>
              <p>
                Built-in safeguards to ensure all academic registrations meet university and state regulatory standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Contact Section (2-Column with Inquiry Form) */}
      <section id="contact" className={styles.contactSection}>
        <div className={styles.contactContainer}>
          {/* Left: Contact Info */}
          <div className={styles.contactInfo}>
            <h2>Get in Touch</h2>
            <p className={styles.contactSubtitle}>
              Have questions about institutional onboarding, subscription plans, or custom academic integrations? Our enterprise team is here to assist.
            </p>

            <div className={styles.contactMethods}>
              <div className={styles.contactMethod}>
                <img src="/assets/icons/location.svg" alt="Location" className={styles.contactIcon} />
                <div>
                  <strong>Platform Headquarters</strong>
                  <p>Lumina EdTech Suite, Cyber Gateway, Hi-Tech City</p>
                </div>
              </div>

              <div className={styles.contactMethod}>
                <img src="/assets/icons/mail.svg" alt="Email" className={styles.contactIcon} />
                <div>
                  <strong>Institutional Inquiries</strong>
                  <p>contact@lumina-platform.com</p>
                </div>
              </div>

              <div className={styles.contactMethod}>
                <img src="/assets/icons/telephone.svg" alt="Phone" className={styles.contactIcon} />
                <div>
                  <strong>Enterprise Help Desk</strong>
                  <p>+91 (080) 4567 8900</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Inquiry Form Card */}
          <div className={styles.inquiryCard}>
            <form onSubmit={(e) => { e.preventDefault(); alert('Message received! Our team will get back to you shortly.'); }}>
              <div className={styles.formRow}>
                <div className={styles.formField} style={{ marginBottom: 0 }}>
                  <label htmlFor="fullName">Full Name</label>
                  <input id="fullName" type="text" placeholder="Dr. Arvind Sharma" required />
                </div>
                <div className={styles.formField} style={{ marginBottom: 0 }}>
                  <label htmlFor="institute">Institute / University Name</label>
                  <input id="institute" type="text" placeholder="e.g. National Institute of Technology" required />
                </div>
              </div>

              <div className={styles.formField}>
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  placeholder="Tell us about your university requirements, enrollment size, or questions..."
                  required
                />
              </div>

              <button type="submit" className={`btn-primary ${styles.sendBtn}`}>
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>


      {/* 7. Reusable Footer */}
      <Footer />
    </div>
  );
}
