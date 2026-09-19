import React, { useEffect } from 'react';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';

export default function PrivacyPage({ onNavigateHome }) {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Privacy Policy — SmartSweep AI | Ransamie Technologies';
  }, []);

  return (
    <div className="legal-page-layout">
      {/* Background Mesh */}
      <div className="mesh-bg">
        <div className="mesh-orb orb-1"></div>
        <div className="mesh-orb orb-2"></div>
      </div>

      {/* Top Navigation */}
      <header className="legal-header">
        <div className="container legal-nav-container">
          <a href="/" onClick={onNavigateHome} className="logo" style={{ textDecoration: 'none' }}>
            <img src="/logo.png" alt="SmartSweep AI Logo" style={{ width: 32, height: 32, borderRadius: '8px', objectFit: 'contain' }} />
            <span>SmartSweep AI</span>
          </a>
          <div className="legal-nav-actions">
            <a href="/" onClick={onNavigateHome} className="btn btn-secondary legal-nav-back">
              <ArrowLeft size={16} /> Back to Home
            </a>
            <a href="/#download" onClick={(e) => { onNavigateHome(e); window.location.hash = '#download'; }} className="btn btn-primary">
              <Download size={16} /> Download
            </a>
          </div>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="container legal-container">
        <article className="legal-document glass-card">
          <div className="legal-doc-header">
            <div className="legal-breadcrumb">
              <a href="/" onClick={onNavigateHome}>Home</a>
              <span className="breadcrumb-separator">/</span>
              <span>Privacy Policy</span>
            </div>
            <h1 className="legal-doc-title">Privacy Policy</h1>
            <p className="legal-doc-meta">
              <strong>Entity:</strong> Ransamie Technologies &nbsp;·&nbsp; <strong>Product:</strong> SmartSweep AI &nbsp;·&nbsp; <strong>Last Updated:</strong> September 19, 2026
            </p>
          </div>

          <div className="legal-callout">
            <h2 className="legal-callout-title">Summary & Core Commitment</h2>
            <p>
              SmartSweep AI is developed by <strong>Ransamie Technologies</strong> as a local-first utility. All file scanning, cache indexing, registry inspection, and system junk cleanup take place exclusively on your local computer. We do not harvest, upload, share, or monetize your personal files, browser histories, or private documents.
            </p>
          </div>

          <div className="legal-content">
            <section className="legal-section">
              <h2>1. Introduction & Scope</h2>
              <p>
                This Privacy Policy describes how Ransamie Technologies ("we", "us", or "our") handles information in connection with the SmartSweep AI desktop applications for Windows, macOS, and Linux, as well as the official website located at <code>smartsweep.ransamie.online</code>.
              </p>
              <p>
                By downloading, installing, or using SmartSweep AI, or by accessing our website, you acknowledge the terms outlined in this document. If you do not agree with these terms, please do not use our software or web services.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Local-First Architecture Guarantee</h2>
              <p>
                SmartSweep AI is engineered from the ground up to respect user autonomy and privacy:
              </p>
              <ul>
                <li>
                  <strong>Local Scanning & Deletion:</strong> All disk scanning, temporary file detection, and removal operations execute entirely within your operating system's local environment.
                </li>
                <li>
                  <strong>No Remote Storage of Personal Files:</strong> We do not operate remote servers to index, read, or copy your personal files, photos, media, codebases, or documents.
                </li>
                <li>
                  <strong>Quarantine Directory:</strong> When safe removal is configured, files are moved into a local quarantine folder (<code>.smartsweep_quarantine</code>) located on your local drive, accessible only by you.
                </li>
                <li>
                  <strong>Local History Logs:</strong> Deletion history and optimization records are saved strictly on your local disk and can be purged at your discretion.
                </li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>3. System Cleaner & Privacy Shield Operations</h2>
              <p>
                SmartSweep AI provides dedicated optimization and cleaning modules. The data handling behavior for each module is as follows:
              </p>
              <ul>
                <li>
                  <strong>Browser Cache & Tracking Cleaners:</strong> Privacy Shield clears temporary cache stores, GPU shader caches, IndexedDB files, and tracker storage across Google Chrome, Microsoft Edge, Mozilla Firefox, Brave, and Opera.
                </li>
                <li>
                  <strong>Protection of Authentication Credentials:</strong> SmartSweep AI explicitly preserves protected authentication files, including saved passwords (such as Chrome's <code>Login Data</code>) and active bookmarks. Your saved logins and browser credentials remain intact.
                </li>
                <li>
                  <strong>System Temporary Files:</strong> Temporary system files (such as <code>%TEMP%</code>, crash dumps, and Windows Update installation staging caches) are identified and purged locally based on user selection.
                </li>
                <li>
                  <strong>Startup Program Inspection:</strong> Startup Optimizer inspects local OS registry keys and startup folders to list auto-starting applications, allowing you to disable unnecessary background processes locally.
                </li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Artificial Intelligence & Google Gemini API Disclosures</h2>
              <p>
                SmartSweep AI includes optional AI-assisted features powered by the Google Gemini API (such as natural-language directory summaries and startup program explanations):
              </p>
              <ul>
                <li>
                  <strong>Anonymized Structural Metadata Only:</strong> When an AI analysis request is initiated, the software transmits only non-sensitive structural metadata (for example: a generic directory name such as <code>AppData/Local/Temp</code> or an application executable name such as <code>spotify.exe</code>).
                </li>
                <li>
                  <strong>Strict Exclusion of Personal Content:</strong> Under no circumstances are your personal documents, document contents, private photos, source code files, or personally identifiable information (PII) transmitted to any AI service.
                </li>
                <li>
                  <strong>Third-Party Processing:</strong> AI API queries are transmitted securely via encrypted HTTPS connections to Google APIs and are processed in accordance with Google's API Privacy policies.
                </li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>5. Voluntary Donations & Payment Processing (Paystack)</h2>
              <p>
                SmartSweep AI is free and open source. Users who wish to support continued development may make voluntary donations:
              </p>
              <ul>
                <li>
                  <strong>Payment Processing via Paystack:</strong> All payment transactions and donations are processed externally by <strong>Paystack</strong> (a certified PCI-DSS Level 1 compliant payment processor).
                </li>
                <li>
                  <strong>No Card Data Stored:</strong> Ransamie Technologies does not collect, receive, process, or store credit card numbers, debit card numbers, expiration dates, or bank account credentials.
                </li>
                <li>
                  <strong>Processor Policy:</strong> Financial transactions are subject to Paystack's terms of service and privacy statement.
                </li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>6. Website Traffic & Software Distribution</h2>
              <p>
                Regarding your visits to <code>smartsweep.ransamie.online</code>:
              </p>
              <ul>
                <li>
                  <strong>No Tracking Cookies:</strong> We do not employ third-party advertising cookies, social media tracking pixels, or user-profiling analytics scripts on our website.
                </li>
                <li>
                  <strong>Distribution Infrastructure:</strong> Desktop installation binaries (<code>.exe</code>, <code>.dmg</code>, <code>.AppImage</code>, <code>.deb</code>) are delivered through GitHub Releases, a service provided by GitHub, Inc. Standard web server logs may record basic request data (such as IP addresses and user agents) for traffic routing and security monitoring.
                </li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>7. Data Sovereignty & User Rights (GDPR / CCPA)</h2>
              <p>
                Because SmartSweep AI does not maintain remote user accounts, cloud databases, or personal profiles:
              </p>
              <ul>
                <li>There is no personal data held on external servers to access, rectify, or erase.</li>
                <li>You retain full ownership and control over your computer's files at all times.</li>
                <li>Uninstalling the software or removing its local configuration directory permanently eliminates all application traces from your device.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>8. Security Measures</h2>
              <p>
                We implement industry-standard practices to protect software integrity:
              </p>
              <ul>
                <li>Official builds are compiled through automated, reproducible GitHub Actions CI/CD pipelines.</li>
                <li>Release binaries are published alongside cryptographic SHA-256 blockmaps and checksums to ensure file authenticity.</li>
                <li>All network communications (updates and voluntary donation redirection) strictly require encrypted Transport Layer Security (TLS/HTTPS).</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>9. Changes to This Privacy Policy</h2>
              <p>
                Ransamie Technologies reserves the right to update this Privacy Policy to reflect changes in software features, operational practices, or legal requirements. Any modifications will be posted to this page with an updated effective date.
              </p>
            </section>

            <section className="legal-section">
              <h2>10. Contact Information & Developer Entity</h2>
              <p>
                For questions, feedback, or legal inquiries regarding this Privacy Policy or SmartSweep AI, please contact:
              </p>
              <div className="legal-contact-card">
                <p><strong>Organization:</strong> Ransamie Technologies</p>
                <p><strong>Website:</strong> <a href="https://smartsweep.ransamie.online" target="_blank" rel="noopener noreferrer">https://smartsweep.ransamie.online</a></p>
                <p><strong>GitHub Repository:</strong> <a href="https://github.com/ransamie/smart-sweep-ai" target="_blank" rel="noopener noreferrer">github.com/ransamie/smart-sweep-ai</a></p>
                <p><strong>Email Support:</strong> <a href="mailto:ransamietechnologies@gmail.com">ransamietechnologies@gmail.com</a></p>
              </div>
            </section>
          </div>

          <div className="legal-doc-footer">
            <a href="/" onClick={onNavigateHome} className="btn btn-secondary">
              <ArrowLeft size={16} /> Return to Homepage
            </a>
            <a href="/#download" onClick={(e) => { onNavigateHome(e); window.location.hash = '#download'; }} className="btn btn-primary">
              <Download size={16} /> Get SmartSweep AI
            </a>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="footer-section">
        <div className="container footer-container">
          <div className="footer-brand">
            <img src="/logo.png" alt="SmartSweep AI Logo" style={{ width: 24, height: 24, borderRadius: '6px', objectFit: 'contain' }} />
            <span>SmartSweep AI</span>
          </div>
          <div className="footer-links">
            <span style={{ color: 'white', fontWeight: 600 }}>Privacy Policy</span>
            <a href="/#donate" onClick={onNavigateHome} className="footer-link-item footer-link-donate">
              Support Developer
            </a>
            <a href="https://github.com/ransamie/smart-sweep-ai" target="_blank" rel="noopener noreferrer" className="footer-link-item">
              GitHub
            </a>
            <span className="footer-copy">© {new Date().getFullYear()} Ransamie Technologies. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
