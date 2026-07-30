"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  IndicatorDataError,
  type IndicatorRow,
  parseIndicatorCsv,
} from "../lib/indicator-data";

export const INDICATOR_CSV_URL =
  "https://raw.githubusercontent.com/suhyeonhong-bit/ToSuhyeon/main/data/processed/monthly_indicators.csv";

type LoadingState = {
  status: "loading";
  rows: [];
  rawCsv: "";
  errorKind: null;
};

type SuccessState = {
  status: "success";
  rows: IndicatorRow[];
  rawCsv: string;
  errorKind: null;
};

type ErrorState = {
  status: "error";
  rows: [];
  rawCsv: "";
  errorKind: "network" | "format";
};

export type IndicatorDataState = LoadingState | SuccessState | ErrorState;

const LOADING: LoadingState = {
  status: "loading",
  rows: [],
  rawCsv: "",
  errorKind: null,
};

export function useIndicatorData(): IndicatorDataState & {
  retry: () => Promise<void>;
} {
  const [state, setState] = useState<IndicatorDataState>(LOADING);
  const isMounted = useRef(false);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!isMounted.current) return;

    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;
    const isCurrentRequest = () =>
      isMounted.current && requestId.current === currentRequestId;

    setState(LOADING);
    try {
      const response = await fetch(INDICATOR_CSV_URL, { cache: "no-store" });
      if (!isCurrentRequest()) return;
      if (!response.ok) throw new Error("network");
      const rawCsv = await response.text();
      if (!isCurrentRequest()) return;
      const rows = parseIndicatorCsv(rawCsv);
      if (!isCurrentRequest()) return;
      setState({ status: "success", rows, rawCsv, errorKind: null });
    } catch (error) {
      if (!isCurrentRequest()) return;
      setState({
        status: "error",
        rows: [],
        rawCsv: "",
        errorKind: error instanceof IndicatorDataError ? "format" : "network",
      });
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    void load();
    return () => {
      isMounted.current = false;
      requestId.current += 1;
    };
  }, [load]);

  return { ...state, retry: load };
}
