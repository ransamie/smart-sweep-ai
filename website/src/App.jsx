import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Download, ArrowRight, CheckCircle2, Trash2, History } from 'lucide-react';
import './index.css';


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
        <section className="section hero-section">
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
            
            <div className="hero-buttons">
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
                <div className="mockup-glare"></div>
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
                  <Trash2 size={24} />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>System Cleaner</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Instantly reclaim gigabytes of hidden system cache, temporary files, and orphaned logs that are silently hoarding your valuable storage space.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bento-item bento-item-half glass-card">
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#22C55E' }}>
                  <History size={24} />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Activity Logs & History</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Total transparency. Keep a detailed, exportable history of every single file deleted during optimization, ensuring you always know exactly what was removed.
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
        <div className="container footer-container" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/logo.png" alt="SmartSweep AI Logo" style={{ width: 24, height: 24, borderRadius: '6px', objectFit: 'contain' }} /> SmartSweep AI
          </div>
          <div>
            &copy; {new Date().getFullYear()} Ran Technologies. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
