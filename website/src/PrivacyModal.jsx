import React, { useEffect } from 'react';
import { Shield, Lock, Cpu, CreditCard, CheckCircle2, X, Mail, ArrowLeft, FileText, Globe } from 'lucide-react';

export default function PrivacyModal({ isOpen, onClose }) {
  // Close on Escape key press and prevent background scrolling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="privacy-modal-overlay" 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div className="privacy-modal-container glass-card">
        {/* Header */}
        <div className="privacy-modal-header">
          <div className="privacy-modal-header-left">
            <div className="privacy-icon-pill">
              <Shield size={22} className="text-accent" />
            </div>
            <div>
              <h2 id="privacy-modal-title" className="privacy-title">Privacy Policy</h2>
              <p className="privacy-subtitle">Ransamie Technologies · Effective Date: September 2026</p>
            </div>
          </div>
          <button 
            type="button" 
            className="privacy-close-btn" 
            onClick={onClose}
            aria-label="Close Privacy Policy"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="privacy-modal-body">
          {/* Quick Summary Card */}
          <div className="privacy-summary-card">
            <h3 className="privacy-section-title" style={{ marginTop: 0 }}>
              <CheckCircle2 size={18} className="text-emerald" /> Quick Summary
            </h3>
            <ul className="privacy-summary-list">
              <li><strong>100% Local Processing:</strong> System scans, junk clearing, and log maintenance occur entirely on your local computer.</li>
              <li><strong>Zero Personal File Uploads:</strong> We never read, transmit, or store your private documents, photos, or personal folders.</li>
              <li><strong>Preserved Credentials:</strong> Browser cache cleaning strictly protects your passwords, session tokens, and saved bookmarks.</li>
              <li><strong>Secure Payments:</strong> Donations are handled through Paystack; we never see or store your payment details.</li>
              <li><strong>No Third-Party Ad Trackers:</strong> Our website and desktop apps contain zero telemetry trackers or data-brokering scripts.</li>
            </ul>
          </div>

          {/* Section 1 */}
          <section className="privacy-section">
            <div className="privacy-section-header">
              <Lock size={20} className="privacy-section-icon" />
              <h3>1. Our Core Privacy Guarantee: Local-First</h3>
            </div>
            <p>
              SmartSweep AI, engineered by <strong>Ransamie Technologies</strong>, is designed with a fundamental commitment to user privacy. Unlike traditional utilities that bundle background trackers, SmartSweep AI operates as an offline, local-first utility.
            </p>
            <p>
              All system indexing, junk file discovery, cache calculation, and file removals execute strictly inside your local operating system environment. Your files never leave your device.
            </p>
          </section>

          {/* Section 2 */}
          <section className="privacy-section">
            <div className="privacy-section-header">
              <Shield size={20} className="privacy-section-icon" />
              <h3>2. System Cleaner & Privacy Shield Operations</h3>
            </div>
            <p>SmartSweep AI includes specialized tools designed to enhance privacy and recover drive storage:</p>
            <ul className="privacy-detail-list">
              <li>
                <strong>Browser Cache & Tracking Files:</strong> Privacy Shield cleans cache files, GPU shaders, IndexedDB files, and tracker storage across Google Chrome, Microsoft Edge, Mozilla Firefox, Brave, and Opera.
              </li>
              <li>
                <strong>Saved Logins & Passwords Protected:</strong> Our engine explicitly preserves sensitive browser files such as <code>Login Data</code> and <code>Bookmarks</code>. You stay logged in to your favorite websites while junk files are swept away.
              </li>
              <li>
                <strong>System Temporary Files:</strong> Temporary system files, Windows Update download caches, and crash dumps are permanently cleaned or safely moved to a local hidden quarantine directory (<code>.smartsweep_quarantine</code>).
              </li>
              <li>
                <strong>Activity Logs:</strong> Deletion logs and history remain exclusively on your local machine and can be inspected or purged at any time.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="privacy-section">
            <div className="privacy-section-header">
              <Cpu size={20} className="privacy-section-icon" />
              <h3>3. Artificial Intelligence Features (Gemini AI)</h3>
            </div>
            <p>
              SmartSweep AI offers intelligent folder descriptions and boot startup evaluations using Google Gemini API:
            </p>
            <ul className="privacy-detail-list">
              <li>
                <strong>Anonymized Metadata Only:</strong> Queries sent to the AI API are strictly limited to anonymized structural metadata (such as general folder names like <code>AppData/Local/Temp</code> or executable names like <code>discord.exe</code>).
              </li>
              <li>
                <strong>No Document Scanning:</strong> Under no circumstances are your personal documents, image files, spreadsheets, private codebases, or sensitive file contents uploaded or analyzed by AI models.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="privacy-section">
            <div className="privacy-section-header">
              <CreditCard size={20} className="privacy-section-icon" />
              <h3>4. Voluntary Donations & Payments (Paystack)</h3>
            </div>
            <p>
              SmartSweep AI is completely free and open source. If you choose to support our independent development through voluntary donations:
            </p>
            <ul className="privacy-detail-list">
              <li>
                Donations are processed externally through <strong>Paystack</strong> (a licensed, PCI-DSS Level 1 compliant payment gateway).
              </li>
              <li>
                Ransamie Technologies does not collect, receive, or store your credit card numbers, debit card details, CVVs, or bank account credentials.
              </li>
              <li>
                Payment transactions are governed by Paystack's official privacy and security standards.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="privacy-section">
            <div className="privacy-section-header">
              <Globe size={20} className="privacy-section-icon" />
              <h3>5. Website & Software Distribution</h3>
            </div>
            <p>
              When you visit <code>smartsweep.ransamie.online</code>:
            </p>
            <ul className="privacy-detail-list">
              <li>
                <strong>No Tracking Cookies:</strong> We do not use persistent marketing cookies, pixel tags, or behavioral advertising trackers on this site.
              </li>
              <li>
                <strong>Direct GitHub Releases:</strong> Application downloads for Windows (<code>.exe</code>), macOS (<code>.dmg</code>), and Linux (<code>.AppImage</code>, <code>.deb</code>) are hosted directly on GitHub Releases, ensuring verified checksums and cryptographic integrity.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="privacy-section">
            <div className="privacy-section-header">
              <FileText size={20} className="privacy-section-icon" />
              <h3>6. Data Retention & User Rights (GDPR / CCPA)</h3>
            </div>
            <p>
              Because SmartSweep AI does not create remote accounts or harvest your data on cloud servers:
            </p>
            <ul className="privacy-detail-list">
              <li>There is no cloud profile, advertising ID, or online database entry linked to you.</li>
              <li>Uninstalling SmartSweep AI or deleting your local application folder permanently removes all local configuration files and history from your computer.</li>
              <li>You maintain absolute sovereignty and full control over your storage and data at all times.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="privacy-section" style={{ borderBottom: 'none' }}>
            <div className="privacy-section-header">
              <Mail size={20} className="privacy-section-icon" />
              <h3>7. Contact & Publisher Inquiries</h3>
            </div>
            <p>
              If you have any questions, suggestions, or concerns regarding this Privacy Policy or data safety practices, please contact:
            </p>
            <div className="privacy-contact-box">
              <p><strong>Ransamie Technologies</strong></p>
              <p>Official Website: <a href="https://smartsweep.ransamie.online" target="_blank" rel="noopener noreferrer">https://smartsweep.ransamie.online</a></p>
              <p>Source Code & Issues: <a href="https://github.com/ransamie/smart-sweep-ai" target="_blank" rel="noopener noreferrer">github.com/ransamie/smart-sweep-ai</a></p>
              <p>Support Email: <a href="mailto:ransamietechnologies@gmail.com">ransamietechnologies@gmail.com</a></p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="privacy-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}>
            <ArrowLeft size={16} /> Back to Website
          </button>
          <a href="#download" onClick={onClose} className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}>
            Download SmartSweep AI
          </a>
        </div>
      </div>
    </div>
  );
}
