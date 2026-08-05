import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Download, ArrowRight, CheckCircle2, Trash2, History, ExternalLink, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import './index.css';

// GitHub icon (not available in older lucide-react)
const Github = ({ size = 24 }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

// SVG Platform Logos
const WindowsLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
  </svg>
);

const AppleLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
  </svg>
);

const LinuxLogo = () => (
  <svg viewBox="0 0 448 512" fill="currentColor" width="28" height="28">
    <path d="M220.8 123.3c1 .5 1.8 1.7 3 1.7 1.1 0 2.8-.4 2.9-1.5.2-1.4-1.9-2.3-3.2-2.9-1.7-.7-3.9-1-5.5-.1-.4.2-.8.7-.6 1.1.3 1.3 2.3 1.1 3.4 1.7zm-21.9 1.7c1.2 0 2-1.2 3-1.7 1.1-.6 3.1-.4 3.5-1.6.2-.4-.2-.9-.6-1.1-1.6-.9-3.8-.6-5.5.1-1.3.6-3.4 1.5-3.2 2.9.1 1 1.8 1.5 2.8 1.4zM420 403.8c-3.6-4-5.3-11.6-7.2-19.7-1.8-8.1-3.9-16.8-10.5-22.4-1.3-1.1-2.6-2.1-4-2.9-1.3-.8-2.7-1.5-4.1-2 9.2-27.3 5.6-54.5-3.7-79.1-11.4-30.1-31.3-56.4-46.5-74.4-17.1-21.5-33.7-41.9-33.4-72C311.1 85.4 315.7.1 234.8 0 132.4-.2 158 103.4 156.9 135.2c-1.7 23.4-6.4 41.8-22.5 64.7-18.9 22.5-45.5 58.8-58.1 96.7-6 17.9-8.8 36.1-6.2 53.3-6.5 5.8-11.4 14.7-16.6 20.2-4.2 4.3-10.3 5.9-17 8.3s-14 6-18.5 14.5c-2.1 3.9-2.8 8.1-2.8 12.4 0 3.9.6 7.9 1.2 11.8 1.2 8.1 2.5 15.7.8 20.8-5.2 14.4-5.9 24.4-2.2 31.7 3.8 7.3 11.4 10.5 20.1 12.3 17.3 3.6 40.8 2.7 59.3 12.5 19.8 10.4 39.9 14.1 55.9 10.4 11.6-2.6 21.1-9.6 25.9-20.2 12.5-.1 26.3-5.4 48.3-6.6 14.9-1.2 33.6 5.3 55.1 4.1.6 2.3 1.4 4.6 2.5 6.7v.1c8.3 16.7 23.8 24.3 40.3 23 16.6-1.3 34.1-11 48.3-27.9 13.6-16.4 36-23.2 50.9-32.2 7.4-4.5 13.4-10.1 13.9-18.3.4-8.2-4.4-17.3-15.5-29.7zM223.7 87.3c9.8-22.2 34.2-21.8 44-.4 6.5 14.2 3.6 30.9-4.3 40.4-1.6-.8-5.9-2.6-12.6-4.9 1.1-1.2 3.1-2.7 3.9-4.6 4.8-11.8-.2-27-9.1-27.3-7.3-.5-13.9 10.8-11.8 23-4.1-2-9.4-3.5-13-4.4-1-6.9-.3-14.6 2.9-21.8zM183 75.8c10.1 0 20.8 14.2 19.1 33.5-3.5 1-7.1 2.5-10.2 4.6 1.2-8.9-3.3-20.1-9.6-19.6-8.4.7-9.8 21.2-1.8 28.1 1 .8 1.9-.2-5.9 5.5-15.6-14.6-10.5-52.1 8.4-52.1zm-13.6 60.7c6.2-4.6 13.6-10 14.1-10.5 4.7-4.4 13.5-14.2 27.9-14.2 7.1 0 15.6 2.3 23.3 7 1.9 1.1 3.4 2.6 5.3 3.7.8.5 1.9.9 2.7 1.4.9.6 1.7 1.2 2.6 1.8 3.5 2.4 6.8 5.4 9.6 9 6 7.7 8.3 17.6 6.3 26.6-.7 3.2-2.2 6.3-4.1 9.1-3.6 5.4-9.3 9.4-15.7 10.7-6.4 1.3-13.3 0-19.1-3.3-6.5-3.7-11.8-9.7-14.7-16.8-2.6-6.4-3.2-13.7-1.8-20.5.7-3.4 2.2-6.6 4.3-9.4z" />
  </svg>
);

const REPO = 'ransamie/smart-sweep-ai';
const GITHUB_API = `https://api.github.com/repos/${REPO}/releases`;
const GITHUB_REPO_URL = `https://github.com/${REPO}`;

function getAssetsByPlatform(assets) {
  const windows = assets.find(a => a.name.endsWith('.exe') && !a.name.endsWith('.blockmap'));
  const mac = assets.find(a => a.name.endsWith('.dmg') && !a.name.endsWith('.blockmap'));
  const linuxAppImage = assets.find(a => a.name.endsWith('.AppImage'));
  const linuxDeb = assets.find(a => a.name.endsWith('.deb'));
  return { windows, mac, linuxAppImage, linuxDeb };
}

function formatBytes(bytes) {
  if (!bytes) return '';
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(0)} MB`;
}

function PlatformCard({ logo, platform, label, asset, accent }) {
  if (!asset) return null;
  return (
    <a
      href={asset.browser_download_url}
      download
      className="platform-card"
      style={{ '--accent': accent }}
    >
      <div className="platform-card-icon" style={{ background: `${accent}18`, color: accent }}>
        {logo}
      </div>
      <div className="platform-card-body">
        <span className="platform-card-platform">{platform}</span>
        <span className="platform-card-label">{label}</span>
        <span className="platform-card-size">{formatBytes(asset.size)}</span>
      </div>
      <div className="platform-card-download-icon" style={{ color: accent }}>
        <Download size={20} />
      </div>
    </a>
  );
}

function ReleaseRow({ release, isLatest }) {
  const [open, setOpen] = useState(false);
  const { windows, mac, linuxAppImage, linuxDeb } = getAssetsByPlatform(release.assets || []);
  const hasAssets = windows || mac || linuxAppImage || linuxDeb;

  return (
    <div className={`release-row ${isLatest ? 'release-row-latest' : ''}`}>
      <button className="release-row-header" onClick={() => setOpen(o => !o)} disabled={!hasAssets}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isLatest && <span className="badge-latest">Latest</span>}
          <span className="release-row-version">{release.tag_name}</span>
          <span className="release-row-date">
            {new Date(release.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        {hasAssets && (
          <span className="release-row-toggle">
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        )}
      </button>
      {open && hasAssets && (
        <div className="release-row-assets">
          {windows && (
            <a href={windows.browser_download_url} download className="asset-link">
              <WindowsLogo /> <span>Windows</span> <span className="asset-size">{formatBytes(windows.size)}</span>
            </a>
          )}
          {mac && (
            <a href={mac.browser_download_url} download className="asset-link">
              <AppleLogo /> <span>macOS</span> <span className="asset-size">{formatBytes(mac.size)}</span>
            </a>
          )}
          {linuxAppImage && (
            <a href={linuxAppImage.browser_download_url} download className="asset-link">
              <LinuxLogo /> <span>Linux AppImage</span> <span className="asset-size">{formatBytes(linuxAppImage.size)}</span>
            </a>
          )}
          {linuxDeb && (
            <a href={linuxDeb.browser_download_url} download className="asset-link">
              <LinuxLogo /> <span>Linux .deb</span> <span className="asset-size">{formatBytes(linuxDeb.size)}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function DownloadsSection() {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch(`${GITHUB_API}?per_page=10`)
      .then(r => r.json())
      .then(data => {
        const published = data.filter(r => !r.draft && !r.prerelease);
        setReleases(published);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load releases. Please try again later.');
        setLoading(false);
      });
  }, []);

  const latest = releases[0];
  const older = releases.slice(1);
  const latestAssets = latest ? getAssetsByPlatform(latest.assets || []) : {};

  return (
    <section id="download" className="section">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Download <span className="gradient-text-accent">SmartSweep AI</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            Free and open source. Available for every major platform.
          </p>
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', padding: '3rem' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Loading latest release...</span>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>{error}</div>
        )}

        {!loading && !error && latest && (
          <>
            {/* Latest version hero download */}
            <div className="downloads-hero glass-card" style={{ marginBottom: '1.5rem' }}>
              <div className="downloads-hero-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span className="badge-latest">Latest</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{latest.tag_name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Released {new Date(latest.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '480px' }}>
                    The most recent stable build — recommended for all users.
                  </p>
                </div>
                <a
                  href={GITHUB_REPO_URL + '/releases/tag/' + latest.tag_name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ whiteSpace: 'nowrap', gap: '0.5rem' }}
                >
                  <Github size={18} /> View on GitHub <ExternalLink size={14} />
                </a>
              </div>

              <div className="platform-cards-grid">
                <PlatformCard
                  logo={<WindowsLogo />}
                  platform="Windows"
                  label=".exe Installer"
                  asset={latestAssets.windows}
                  accent="#3B82F6"
                />
                <PlatformCard
                  logo={<AppleLogo />}
                  platform="macOS"
                  label=".dmg (Apple Silicon)"
                  asset={latestAssets.mac}
                  accent="#A78BFA"
                />
                <PlatformCard
                  logo={<LinuxLogo />}
                  platform="Linux"
                  label=".AppImage"
                  asset={latestAssets.linuxAppImage}
                  accent="#F59E0B"
                />
                <PlatformCard
                  logo={<LinuxLogo />}
                  platform="Linux"
                  label=".deb (Debian/Ubuntu)"
                  asset={latestAssets.linuxDeb}
                  accent="#F59E0B"
                />
              </div>

              <div style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span>⚠️ <strong style={{ color: 'var(--text-primary)' }}>Windows users:</strong> You may see a SmartScreen prompt — click <em>More info → Run anyway</em>. The app is safe; it is unsigned pending a code signing certificate.</span>
                <span>🍎 <strong style={{ color: 'var(--text-primary)' }}>macOS users:</strong> Right-click the .dmg and select <em>Open</em> on first launch.</span>
              </div>
            </div>

            {/* Previous versions */}
            {older.length > 0 && (
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Previous Versions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {(showAll ? older : older.slice(0, 3)).map((release, i) => (
                    <ReleaseRow key={release.id} release={release} isLatest={false} />
                  ))}
                </div>
                {older.length > 3 && (
                  <button
                    className="btn btn-secondary"
                    style={{ marginTop: '1rem', width: '100%', justifyContent: 'center', borderRadius: '0.75rem' }}
                    onClick={() => setShowAll(o => !o)}
                  >
                    {showAll ? 'Show fewer' : `Show all ${older.length} older versions`}
                    {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

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
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <a href="#features" className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
              Features
            </a>
            <a href="#download" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
              <Download size={16} />
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
              <a href="#download" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
                <Download size={20} />
                Download Now
              </a>
              <a href="#features" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
                View Features <ArrowRight size={20} />
              </a>
            </div>
            <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Free & Open Source · Windows · macOS · Linux
            </div>

            <div className="mockup-container">
              <div className="mockup-frame">
                <img src="/dashboard-mockup.png" alt="SmartSweep AI Dashboard" className="mockup-img" onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'none';
                  e.target.nextSibling.nextSibling.style.display = 'flex';
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

        {/* Downloads Section */}
        <DownloadsSection />

        {/* CTA Section */}
        <section className="section" style={{ textAlign: 'center', paddingTop: 0 }}>
          <div className="container">
            <div className="glass-card" style={{ padding: '4rem 2rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(139,92,246,0.1) 100%)' }}>
              <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Ready to optimize your system?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', marginBottom: '2.5rem' }}>Download SmartSweep AI today and reclaim your gigabytes.</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="#download" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.25rem' }}>
                  <Download size={24} />
                  Download Now
                </a>
                <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
                  <Github size={20} /> View Source Code <ExternalLink size={16} />
                </a>
              </div>
              <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Free & Open Source · Windows, macOS & Linux
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
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
              <Github size={16} /> GitHub
            </a>
            <span>© {new Date().getFullYear()} Ran Technologies. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
