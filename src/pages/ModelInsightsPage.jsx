import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { PageLayout, PageHeader, Card, TabNav } from '../components/shared/index.js';
import { INSIGHTS_TABS } from '../data/insightsData.js';
import {
  OverviewTab,
  ClassificationTab,
  MultiViewTab,
  CalibrationTab,
  OODTab,
} from '../components/insights/index.js';

const TAB_COMPONENTS = {
  overview: OverviewTab,
  classification: ClassificationTab,
  multiview: MultiViewTab,
  calibration: CalibrationTab,
  ood: OODTab,
};

export default function ModelInsightsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const ActiveTabContent = TAB_COMPONENTS[activeTab] || OverviewTab;

  return (
    <PageLayout>
      {/* Header */}
      <PageHeader
        title="DenseNet121 Evaluation & Metrics"
        badge="EMPIRICAL TEST BENCHMARKS (587 EVALUATED IMAGES)"
        subtitle="Validation benchmarks evaluated across test splits with multi-view ensemble integration"
      >
        <TabNav
          tabs={INSIGHTS_TABS}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />
      </PageHeader>

      {/* Main Content Area */}
      <Card padding="p-4" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <ActiveTabContent />
      </Card>

      {/* Footer Caveat */}
      <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
          <span>
            <strong>Dissertation Benchmark:</strong> Checkpoint weights fine-tuned on pediatric radiograph cohorts; evaluated on 587 held-out test scans.
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-400">
          PyTorch 2.x • DenseNet121 • 3-Class Head
        </span>
      </div>
    </PageLayout>
  );
}
