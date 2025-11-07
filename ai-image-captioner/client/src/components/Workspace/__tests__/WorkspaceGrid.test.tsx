import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WorkspaceGrid from "../WorkspaceGrid";
import type { MediaItem } from "../../../types/media";
import type { ShareTarget } from "../../../data/shareTargets";

vi.mock("../MediaCard", () => {
  return {
    default: ({
      item,
      shareTargets,
      onShareTarget,
      onEdit,
      onMore,
      disabled,
    }: any) => (
      <div
        data-testid="media-card"
        data-align={item.align}
        data-disabled={disabled ? "true" : "false"}
      >
        <div>MC:{item.id}</div>
        <button onClick={() => onEdit?.()} aria-label={`edit-${item.id}`}>
          Edit
        </button>
        <button onClick={() => onMore?.()} aria-label={`delete-${item.id}`}>
          Delete
        </button>
        <button
          onClick={() => onShareTarget?.(shareTargets?.[0]?.id ?? "none")}
          aria-label={`share-${item.id}`}
        >
          ShareFirst
        </button>
      </div>
    ),
  };
});

function makeItems(): MediaItem[] {
  const base: Partial<MediaItem> = {
    imageUrl: "http://img/a.jpg",
    caption: "Cap",
    createdAt: new Date().toISOString(),
    fontFamily: "Inter",
    fontSize: 22,
    textColor: "#fff",
    showBg: true,
    bgColor: "#333",
    bgOpacity: 0.8,
    posX: 100,
    posY: 120,
    align: "left",
  };
  return [
    { ...base, id: "a" } as MediaItem,
    { ...base, id: "b", align: "right" } as MediaItem,
  ];
}

function makeTargets(): ShareTarget[] {
  return [
    { id: "x", name: "X", icon: "x" } as any,
    { id: "ig", name: "Instagram", icon: "ig" } as any,
  ];
}

describe("WorkspaceGrid", () => {
  it("renders media items and passes normalized props to MediaCard", () => {
    const items = makeItems();
    render(
      <WorkspaceGrid
        items={items}
        shareTargets={makeTargets()}
      />
    );

    const grid = screen.getByTestId("workspace-grid");
    expect(grid).toBeInTheDocument();

    const cards = screen.getAllByTestId("workspace-card");
    expect(cards).toHaveLength(2);

    const mc = screen.getAllByTestId("media-card");
    expect(mc).toHaveLength(2);
    expect(mc[0]).toHaveAttribute("data-align", "left");
    expect(mc[1]).toHaveAttribute("data-align", "right");
  });

  it("normalizes invalid align to center", () => {
    const bad: MediaItem = {
      id: "bad",
      imageUrl: "http://img/bad.jpg",
      caption: "Bad",
      align: "nope" as any,
    } as MediaItem;

    render(
      <WorkspaceGrid
        items={[bad]}
        shareTargets={makeTargets()}
      />
    );

    const mc = screen.getByTestId("media-card");
    expect(mc).toHaveAttribute("data-align", "center");
  });

  it("fires onEdit, onDelete, and onShareTarget with the correct item", async () => {
    const user = userEvent.setup();
    const items = makeItems();

    const onShareTarget = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <WorkspaceGrid
        items={items}
        shareTargets={makeTargets()}
        onShareTarget={onShareTarget}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByLabelText("edit-a"));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));

    await user.click(screen.getByLabelText("delete-b"));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: "b" }));

    await user.click(screen.getByLabelText("share-a"));
    expect(onShareTarget).toHaveBeenCalledTimes(1);
    expect(onShareTarget).toHaveBeenCalledWith("x", expect.objectContaining({ id: "a" }));
  });

  it("when selectionMode is true, MediaCard is inert and overlay select triggers onSelect", async () => {
    const user = userEvent.setup();
    const items = makeItems();
    const onSelect = vi.fn();

    render(
      <WorkspaceGrid
        items={items}
        shareTargets={makeTargets()}
        selectionMode
        onSelect={onSelect}
      />
    );

    const inertWrappers = screen
      .getAllByTestId("workspace-card")
      .map((card) => card.querySelector("[aria-hidden='true']") as HTMLElement);

    inertWrappers.forEach((w) => {
      expect(w).toBeInTheDocument();
      expect(w.className).toMatch(/pointer-events-none/);
    });

    const cards = screen.getAllByTestId("workspace-card");
    const overlayBtn = cards[1].querySelector(
      "[data-testid='workspace-card-select']"
    ) as HTMLButtonElement;

    expect(overlayBtn).toBeInTheDocument();
    await user.click(overlayBtn);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "b" }));
  });
});
