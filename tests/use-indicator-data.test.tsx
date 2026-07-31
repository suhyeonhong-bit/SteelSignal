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

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
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

  it("keeps a newer retry result when the earlier request finishes later", async () => {
    const initial = deferred<Response>();
    const retry = deferred<Response>();
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(initial.promise)
      .mockReturnValueOnce(retry.promise);
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useIndicatorData());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    let retryPromise!: Promise<void>;
    act(() => {
      retryPromise = result.current.retry();
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    await act(async () => {
      retry.resolve(response(CSV));
      await retryPromise;
    });
    expect(result.current.rawCsv).toBe(CSV);

    await act(async () => {
      initial.resolve(
        response(
          "month,korea_base_rate_percent,us_steel_ppi_index\n" +
            "2026-05,2.0,350.000\n",
        ),
      );
      await initial.promise;
    });
    expect(result.current.rawCsv).toBe(CSV);
  });

  it("does not consume a request settled after unmount cleanup", async () => {
    const pending = deferred<Response>();
    const text = vi.fn().mockResolvedValue(CSV);
    const fetchMock = vi.fn().mockReturnValue(pending.promise);
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = renderHook(() => useIndicatorData());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    unmount();

    await act(async () => {
      pending.resolve({ ok: true, text } as Response);
      await pending.promise;
    });
    expect(text).not.toHaveBeenCalled();
  });
});
