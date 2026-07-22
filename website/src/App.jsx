import React, { useState, useEffect } from 'react';
import { Shield, HardDrive, Sparkles, Download, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import './index.css';

// Using the same icons as the desktop app for consistency
const AppIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function App() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className="mesh-bg">
        <div className="mesh-orb orb-1"></div>
        <div className="mesh-orb orb-2"></div>
      </div>

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-container">
          <a href="#" className="logo">
            <img src="/logo.png" alt="SmartSweep AI Logo" style={{ width: 32, height: 32, borderRadius: '8px', objectFit: 'contain' }} />
            <span>SmartSweep AI</span>
          </a>
          <div className="nav-links">
            <a href="https://github.com/ransamie/smart-sweep-ai/releases/latest" className="btn btn-primary">
              <Download size={18} />
              Download
            </a>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="section" style={{ paddingTop: '10rem', textAlign: 'center' }}>
          <div className="container">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid var(--glass-border)', marginBottom: '2rem', fontSize: '0.875rem' }}>
              <Sparkles size={16} className="text-accent-primary" style={{ color: 'var(--accent-primary)' }} />
              <span>Powered by Google Gemini 2.5 AI</span>
            </div>
            
            <h1 style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', fontWeight: 800, marginBottom: '1.5rem' }}>
              The Intelligent Way to <br />
              <span className="gradient-text">Reclaim Your System</span>
            </h1>
            
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
              SmartSweep AI uses advanced machine learning to safely remove junk, protect your privacy, and optimize your system.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <a href="https://github.com/ransamie/smart-sweep-ai/releases/latest" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
                <Download size={20} />
                Download Now
              </a>
              <a href="#features" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
                View Features <ArrowRight size={20} />
              </a>
            </div>
            <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Available for Windows, macOS, and Linux
            </div>

            <div className="mockup-container">
              <div className="mockup-frame">
                <img src="/dashboard-mockup.png" alt="SmartSweep AI Dashboard" className="mockup-img" onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}/>
                <div style={{ display: 'none', width: '100%', height: '600px', background: '#0A0A0F', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                  [ Dashboard Screenshot Placeholder ]
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="section">
          <div className="container">
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '3rem', textAlign: 'center' }}>Everything you need. <br/><span style={{ color: 'var(--text-secondary)' }}>Nothing you don't.</span></h2>
            
            <div className="bento-grid">
              
              {/* Feature 1 */}
              <div className="bento-item bento-item-wide glass-card">
                <div style={{ background: 'rgba(139, 92, 246, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>
                  <Sparkles size={24} />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>AI System Summary</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Connect your Gemini API key to receive completely personalized, context-aware advice on what to clean based on your actual disk usage patterns.
                </p>
                <ul style={{ listStyle: 'none', display: 'grid', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} style={{ color: 'var(--accent-primary)' }}/> Context-aware deletion advice</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} style={{ color: 'var(--accent-primary)' }}/> Safe-to-remove guarantees</li>
                </ul>
              </div>

              {/* Feature 2 */}
              <div className="bento-item bento-item-narrow glass-card">
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--accent-secondary)' }}>
                  <Shield size={24} />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Privacy Shield</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Instantly sweep away tracking files and cache across Chrome, Edge, and Firefox without losing your active logins or cookies.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bento-item bento-item-half glass-card">
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#EF4444' }}>
                  <HardDrive size={24} />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Deep Space Analyzer</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Visually drill down into your hard drive to find the exact large files hoarding your storage space, sorted automatically by size.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bento-item bento-item-half glass-card">
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#22C55E' }}>
                  <Zap size={24} />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Smart Sweep Automation</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Set it and forget it. SmartSweep AI can automatically clean your system at a scheduled time every day while you are away from your desk.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section" style={{ textAlign: 'center' }}>
          <div className="container">
            <div className="glass-card" style={{ padding: '4rem 2rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(139,92,246,0.1) 100%)' }}>
              <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Ready to optimize your system?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', marginBottom: '2.5rem' }}>Download SmartSweep AI today and reclaim your gigabytes.</p>
              <a href="https://github.com/ransamie/smart-sweep-ai/releases/latest" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.25rem' }}>
                <Download size={24} />
                Download Now
              </a>
              <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Available for Windows, macOS, and Linux
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer style={{ borderTop: '1px solid var(--glass-border)', padding: '3rem 0', marginTop: '2rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AppIcon /> SmartSweep AI
          </div>
          <div>
            &copy; {new Date().getFullYear()} ransamie. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
