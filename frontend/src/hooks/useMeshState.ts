import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { meshApi } from '../services/meshApi';
import type { MeshState } from '../types';
import toast from 'react-hot-toast';

const REFRESH_INTERVAL = 30000;

const EMPTY_STATE: MeshState = { devices: [], idempotencyCacheSize: 0 };

export function useMeshState() {
  const [meshState, setMeshState] = useState<MeshState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasDataRef = useRef(false);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const isBackground = hasDataRef.current;

    if (isBackground) {
      setRefreshing(true);
    }
    if (!hasDataRef.current) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await meshApi.getMeshState({ signal: controller.signal });
      if (!controller.signal.aborted) {
        setMeshState(data);
        hasDataRef.current = true;
      }
    } catch (err: unknown) {
      if (axios.isCancel(err)) return;
      const message = err instanceof Error ? err.message : 'Oops! We couldn\'t reach the mesh network.';
      setError(message);
      if (isBackground) {
        toast.error('Unable to refresh mesh state. The data shown may be outdated.');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);
    return () => {
      abortRef.current?.abort();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return { meshState, loading, refreshing, error, refetch };
}
