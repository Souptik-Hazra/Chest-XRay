import './layout.css';

export default function TopHeader({ isModelReady = false, modelInfo = null }) {
  const architecture = modelInfo?.architecture || 'Chest X-ray model';
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
      </div>
      <div className="top-header__status">
        <span className="top-header__status-dot" />
        <span>
          {isModelReady
            ? `${architecture} AI Engine: Connected`
            : `${architecture} AI Engine: Unavailable`}
        </span>
      </div>
    </header>
  );
}