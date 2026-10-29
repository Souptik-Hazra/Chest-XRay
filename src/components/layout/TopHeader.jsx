import './layout.css';


export default function TopHeader({ isBackendConnected = false }) {
  return (
    <header className="top-header">
      <div className="top-header__brand">
        <div>
          <div className="top-header__brand-line">
            <span className="top-header__brand-name">ChestX AI</span>
          </div>
          <p className="top-header__subtitle">Multi-Agent Analysis Platform</p>
        </div>
      </div>
      <div className="top-header__center">
        <h1 className="top-header__title">Multi-Agent AI for Chest X-Ray Analysis</h1>
        <span className="top-header__prototype">
          <span className="top-header__pulse" />
          Research Prototype
        </span>
      </div>
      <div className="top-header__status">
        <span className="top-header__status-dot" />
        <span>
          {isBackendConnected
            ? 'DenseNet121 AI Engine: Connected'
            : 'DenseNet121 AI Engine: Unavailable'}
        </span>
      </div>
    </header>
  );
}
