import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TrendChart, buildTooltipValues } from "../app/components/TrendChart";
import type { IndicatorRow } from "../app/lib/indicator-data";

const ROWS: IndicatorRow[] = [
  {
    month: "2026-05",
    koreaBaseRatePercent: null,
    usSteelPpiIndex: 349.023,
  },
  {
    month: "2026-06",
    koreaBaseRatePercent: 2.5,
    usSteelPpiIndex: 361.439,
  },
];

describe("TrendChart", () => {
  it("lets users toggle each series independently", async () => {
    const user = userEvent.setup();
    render(<TrendChart rows={ROWS} />);

    const ppi = screen.getByRole("button", { name: "철강 PPI" });
    const rate = screen.getByRole("button", { name: "한국 기준금리" });
    expect(ppi).toHaveAttribute("aria-pressed", "true");
    expect(rate).toHaveAttribute("aria-pressed", "true");

    await user.click(ppi);
    expect(ppi).toHaveAttribute("aria-pressed", "false");
    expect(rate).toHaveAttribute("aria-pressed", "true");
  });

  it("formats exact tooltip values and missing observations", () => {
    expect(buildTooltipValues(ROWS[0])).toEqual({
      month: "2026년 5월",
      ppi: "349.023",
      rate: "—",
    });
  });
});
