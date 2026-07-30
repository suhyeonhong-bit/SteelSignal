import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  INDICATOR_CSV_URL,
  useIndicatorData,
} from "../app/hooks/useIndicatorData";

const CSV =
  "month,korea_base_rate_percent,us_steel_ppi_index\n" +
  "2026-06,2.5,361.439\n";

function response(body: string): Response {
  return {
    ok: true,
    text: async () => body,
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useIndicatorData", () => {
  it("loads the public CSV without browser caching", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(CSV));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useIndicatorData());
    expect(result.current.status).toBe("loading");

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(fetchMock).toHaveBeenCalledWith(INDICATOR_CSV_URL, {
      cache: "no-store",
    });
    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rawCsv).toBe(CSV);
  });

  it("classifies network failures and succeeds after retry", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(response(CSV));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useIndicatorData());
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorKind).toBe("network");

    await act(async () => {
      await result.current.retry();
    });
    expect(result.current.status).toBe("success");
  });

  it("classifies invalid CSV separately", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response("wrong,csv")),
    );

    const { result } = renderHook(() => useIndicatorData());
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorKind).toBe("format");
  });
});
