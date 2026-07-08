import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { meshApi } from '../services/meshApi';
import type { Transaction } from '../types';
import toast from 'react-hot-toast';

const REFRESH_INTERVAL = 30000;

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
      const data = await meshApi.getTransactions({ signal: controller.signal });
      if (!controller.signal.aborted) {
        setTransactions(data);
        hasDataRef.current = true;
      }
    } catch (err: unknown) {
      if (axios.isCancel(err)) return;
      const message = err instanceof Error ? err.message : 'Oops! We couldn\'t load the transaction history.';
      setError(message);
      if (isBackground) {
        toast.error('Unable to refresh transactions. The data shown may be outdated.');
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

  return { transactions, loading, refreshing, error, refetch };
}
