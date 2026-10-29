import { useCallback, useEffect, useState } from 'react';
import { getAnalysisHistory } from '../services/analysisService.js';

export function useAnalysisHistory(limit) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAnalysisHistory(limit ? { limit } : {});
      setRecords(Array.isArray(result) ? result : []);
      setError('');
    } catch (err) {
      setRecords([]);
      setError(err.message || 'Could not load analysis history.');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { refresh(); }, [refresh]);
  return { records, loading, error, refresh };
}
