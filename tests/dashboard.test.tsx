import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SteelSignalDashboard } from "../app/components/SteelSignalDashboard";
import { useIndicatorData } from "../app/hooks/useIndicatorData";

vi.mock("../app/hooks/useIndicatorData", async () => {
  const actual = await vi.importActual<
    typeof import("../app/hooks/useIndicatorData")
  >("../app/hooks/useIndicatorData");
  return { ...actual, useIndicatorData: vi.fn() };
});

vi.mock("../app/components/TrendChart", () => ({
  TrendChart: () => <div data-testid="trend-chart">chart</div>,
}));

const mockedUseIndicatorData = vi.mocked(useIndicatorData);
const ROWS = [
  {
    month: "2026-05",
    koreaBaseRatePercent: 2.5,
    usSteelPpiIndex: 349.023,
  },
  {
    month: "2026-06",
    koreaBaseRatePercent: 2.5,
    usSteelPpiIndex: 361.439,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("SteelSignalDashboard", () => {
  it("shows the product shell and loading status", () => {
    mockedUseIndicatorData.mockReturnValue({
      status: "loading",
      rows: [],
      rawCsv: "",
      errorKind: null,
      retry: vi.fn(),
    });
    render(<SteelSignalDashboard />);
    expect(
      screen.getByRole("link", { name: "STEEL SIGNAL" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("최신 데이터를 불러오고 있습니다."),
    ).toBeInTheDocument();
  });

  it("shows a plain-language format error and retries", async () => {
    const user = userEvent.setup();
    const retry = vi.fn().mockResolvedValue(undefined);
    mockedUseIndicatorData.mockReturnValue({
      status: "error",
      rows: [],
      rawCsv: "",
      errorKind: "format",
      retry,
    });
    render(<SteelSignalDashboard />);
    expect(
      screen.getByText("데이터 형식을 확인할 수 없습니다"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("shows a plain-language network error and source fallback", () => {
    mockedUseIndicatorData.mockReturnValue({
      status: "error",
      rows: [],
      rawCsv: "",
      errorKind: "network",
      retry: vi.fn(),
    });
    render(<SteelSignalDashboard />);
    expect(screen.getByText("데이터를 불러오지 못했습니다")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "GitHub 원본 CSV" }),
    ).toHaveAttribute(
      "href",
      "https://raw.githubusercontent.com/suhyeonhong-bit/ToSuhyeon/main/data/processed/monthly_indicators.csv",
    );
  });

  it("shows latest metrics, newest-first table and public sources", () => {
    mockedUseIndicatorData.mockReturnValue({
      status: "success",
      rows: ROWS,
      rawCsv: "csv",
      errorKind: null,
      retry: vi.fn(),
    });
    render(<SteelSignalDashboard />);

    expect(screen.getByText("2026년 6월 데이터 기준")).toBeInTheDocument();
    const latestMetrics = screen.getByRole("region", { name: "최신 지표" });
    expect(within(latestMetrics).getByText("2.50%")).toBeInTheDocument();
    expect(within(latestMetrics).getByText("361.439")).toBeInTheDocument();
    expect(screen.getByTestId("trend-chart")).toBeInTheDocument();
    const tableRows = screen.getAllByRole("row");
    expect(tableRows[1]).toHaveTextContent("2026-06");
    expect(tableRows[2]).toHaveTextContent("2026-05");
    expect(
      screen.getByRole("link", { name: "한국은행 ECOS" }),
    ).toHaveAttribute("href", "https://ecos.bok.or.kr/");
    expect(screen.getByRole("link", { name: "미국 FRED" })).toHaveAttribute(
      "href",
      "https://fred.stlouisfed.org/series/WPU1017",
    );
  });

  it("downloads the exact fetched CSV", async () => {
    const user = userEvent.setup();
    const rawCsv =
      "month,korea_base_rate_percent,us_steel_ppi_index\n" +
      "2026-06,2.5,361.439\n";
    const createObjectUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:test-download");
    const revokeObjectUrl = vi.spyOn(URL, "revokeObjectURL");
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    mockedUseIndicatorData.mockReturnValue({
      status: "success",
      rows: ROWS,
      rawCsv,
      errorKind: null,
      retry: vi.fn(),
    });

    render(<SteelSignalDashboard />);
    await user.click(screen.getByRole("button", { name: "CSV 내려받기" }));

    expect(createObjectUrl).toHaveBeenCalledOnce();
    const blob = createObjectUrl.mock.calls[0][0];
    expect(await blob.text()).toBe(rawCsv);
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:test-download");
  });
});
