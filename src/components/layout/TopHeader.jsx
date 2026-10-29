import './layout.css';

export function LungIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v7" /><path d="M12 11l-3 3c-2 2-3 4-3 6.5 0 1.5 1 2.5 3 2.5 2 0 3-1 3-3V11" /><path d="M12 11l3 3c2 2 3 4 3 6.5 0 1.5-1 2.5-3 2.5-2 0-3-1-3-3V11" /><path d="M9 3h6" />
    </svg>
  );
}

export default function TopHeader({ isBackendConnected = false }) {
  return (
    <header className="top-header">
      <div className="top-header__brand">
        <div className="top-header__logo"><LungIcon /></div>
        <div>
          <div className="top-header__brand-line"><span className="top-header__brand-name">ChestX AI</span><span className="top-header__version">v1.0</span></div>
          <p className="top-header__subtitle">Multi-Agent Analysis Platform</p>
        </div>
      </div>
      <div className="top-header__center">
        <h1 className="top-header__title">Multi-Agent AI for Chest X-Ray Analysis</h1>
        <span className="top-header__prototype"><span className="top-header__pulse" />Research Prototype</span>
      </div>
      <div className="top-header__status">
        <span className="top-header__status-dot" />
        <span>{isBackendConnected ? 'DenseNet121 AI Engine: Connected' : 'DenseNet121 AI Engine: Unavailable'}</span>
      </div>
    </header>
  );
}
