import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScriptPanel } from "@/components/ScriptPanel";

describe("ScriptPanel", () => {
  it("shows empty-state alert and no entries when transcriptError is set", () => {
    render(
      <ScriptPanel
        transcript={[]}
        activeIndex={-1}
        onClickEntry={vi.fn()}
        transcriptError="이 영상에는 자막이 없습니다"
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /자막이 없어 학습할 수 없어요/
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders transcript entries when there is no error", () => {
    render(
      <ScriptPanel
        transcript={[{ text: "こんにちは", start: 0, duration: 2 }]}
        activeIndex={0}
        onClickEntry={vi.fn()}
      />
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /こんにちは/ })
    ).toBeInTheDocument();
  });
});
