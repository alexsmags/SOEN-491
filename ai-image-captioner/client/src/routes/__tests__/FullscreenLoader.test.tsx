import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import FullscreenLoader from "../FullscreenLoader";

describe("FullscreenLoader", () => {
  it("renders the loader message", () => {
    render(<FullscreenLoader />);
    expect(screen.getByText(/checking session/i)).toBeInTheDocument();
  });

  it("applies correct container classes", () => {
    render(<FullscreenLoader />);
    const container = screen.getByTestId("fullscreen-loader-container");
    expect(container).toHaveClass("min-h-screen");
    expect(container).toHaveClass("grid");
    expect(container).toHaveClass("place-items-center");
    expect(container).toHaveClass("bg-black");
  });
});
