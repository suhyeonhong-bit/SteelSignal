"use client";

import { useCallback, useEffect, useState } from "react";
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

  const load = useCallback(async () => {
    setState(LOADING);
    try {
      const response = await fetch(INDICATOR_CSV_URL, { cache: "no-store" });
      if (!response.ok) throw new Error("network");
      const rawCsv = await response.text();
      const rows = parseIndicatorCsv(rawCsv);
      setState({ status: "success", rows, rawCsv, errorKind: null });
    } catch (error) {
      setState({
        status: "error",
        rows: [],
        rawCsv: "",
        errorKind: error instanceof IndicatorDataError ? "format" : "network",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, retry: load };
}
