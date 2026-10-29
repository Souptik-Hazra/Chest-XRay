import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { Card } from '../shared/index.js';
import { PREPARATION_VIEWS } from '../../data/preparationViews.js';
import './upload.css';

export default function ImagePreparationPanel({ filePreviewUrl = null, selectedViewId, onSelectView = () => {}, isCompact = false }) {
  const [internalView, setInternalView] = useState('original');
  const currentView = selectedViewId ?? internalView;
  const handleSelect = view => { setInternalView(view.id); onSelectView(view); };
  const activeView = PREPARATION_VIEWS.find(view => view.id === currentView) || PREPARATION_VIEWS[0];
  const renderPreview = (view, thumbnail = false) => <div className="preparation-preview" style={{filter:view.filter !== 'none' && !view.filter.includes('scale') ? view.filter : undefined,transform:view.filter.includes('scale') ? (thumbnail ? 'scale(1.2)' : 'scale(1.25)') : undefined}}>
    {filePreviewUrl ? <img src={filePreviewUrl} alt={thumbnail ? view.name : 'Prepared radiograph'} className={thumbnail ? 'preparation-image preparation-image--cover' : 'preparation-image'}/> : <div className="preparation-empty">Upload a radiograph to preview preprocessing</div>}
  </div>;
  return <Card padding={isCompact ? 'card-padding-compact' : 'card-padding-lg-gap'} className="preparation-panel">
    <div className="preparation-heading"><div><h3><Layers/>Image Preprocessing Views</h3>{!isCompact && <p>Preview the selected image transform. These views are not an independent model ensemble.</p>}</div><span className="preparation-badge">Input sensitivity</span></div>
    {!isCompact && <div className="preparation-main-preview">{renderPreview(activeView)}<div className="preparation-caption">{activeView.name} — {activeView.desc}</div></div>}
    <div><div className="preparation-views-label"><span>Available preprocessing views</span><span>Select a view to preview</span></div><div className="preparation-thumbnails">{PREPARATION_VIEWS.map(view => {
      const isSelected = currentView === view.id;
      return <button key={view.id} type="button" onClick={()=>handleSelect(view)} className={`preparation-thumb ${isSelected?'preparation-thumb--selected':''}`}><div className="preparation-thumb-image">{renderPreview(view,true)}</div><span>{view.name.split(' ')[0]}</span></button>;
    })}</div></div>
    {!isCompact && <div className="preparation-footnote">These are visual previews of input transforms. They do not demonstrate model accuracy or guarantee a clinical benefit.</div>}
  </Card>;
}
