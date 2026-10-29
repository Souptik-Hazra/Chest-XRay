import { useCallback, useEffect, useState } from 'react';
import { fetchSampleImages, fetchSampleFile } from '../services/analysisService.js';

export function useSampleRadiographs() {
  const [samples, setSamples] = useState([]);
  const [loadingSamples, setLoadingSamples] = useState(true);
  const [sampleError, setSampleError] = useState('');

  const refreshSamples = useCallback(async () => {
    setLoadingSamples(true);
    try {
      const data = await fetchSampleImages();
      setSamples(Array.isArray(data) ? data : []);
      setSampleError('');
    } catch (error) {
      setSamples([]);
      setSampleError(error.message || 'Could not load sample radiographs.');
    } finally {
      setLoadingSamples(false);
    }
  }, []);

  useEffect(() => { refreshSamples(); }, [refreshSamples]);

  const loadRandomSample = useCallback(async () => {
    if (!samples.length) {
      throw new Error(sampleError || 'No sample radiographs are available from the backend.');
    }
    const file = await fetchSampleFile(samples[Math.floor(Math.random() * samples.length)]);
    setSampleError('');
    return file;
  }, [samples, sampleError]);

  return { samples, loadingSamples, sampleError, setSampleError, loadRandomSample, refreshSamples };
}
