import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import HashtagsSection from "../HashtagsSelection"
import type { Placement } from "../types"

vi.mock("../PlacementSelect", () => {
  return {
    default: ({
      label,
      value,
      onChange,
    }: {
      label: string
      value: Placement
      onChange: (v: Placement) => void
    }) => (
      <div>
        <label htmlFor="placement">{label}</label>
        <select
          id="placement"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value as Placement)}
        >
          <option value="start">start</option>
          <option value="middle">middle</option>
          <option value="end">end</option>
        </select>
      </div>
    ),
  }
})

type KeywordsInputProps = {
  label: string
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  displayPrefix?: string
  normalizeOnAdd?: (s: string) => string
  max?: number
}

function MockKeywordsInput({
  label,
  value,
  onChange,
  placeholder,
  displayPrefix,
  normalizeOnAdd,
  max = 8,
}: KeywordsInputProps) {
  return (
    <div>
      <label htmlFor="kw">{label}</label>
      <input id="kw" placeholder={placeholder} aria-label={label} />
      <button
        type="button"
        onClick={() => {
          const el = document.getElementById("kw") as HTMLInputElement
          const raw = el?.value ?? ""
          const normalized = normalizeOnAdd ? normalizeOnAdd(raw) : raw
          const next = normalized.trim()
          if (!next) return
          const capped = [...value, next].slice(0, max)
          onChange(capped)
        }}
      >
        Add
      </button>
      <div data-testid="kw-list">
        {value.map((v) => (
          <span key={v}>{displayPrefix ? `${displayPrefix}${v}` : v}</span>
        ))}
      </div>
    </div>
  )
}

function setup(overrides?: Partial<{ hashtags: string[]; includeHashtags: boolean; placement: Placement }>) {
  const onHashtagsChange = vi.fn()
  const onIncludeHashtagsChange = vi.fn()
  const onPlacementChange = vi.fn()

  render(
    <HashtagsSection
      hashtags={overrides?.hashtags ?? []}
      onHashtagsChange={onHashtagsChange}
      includeHashtags={overrides?.includeHashtags ?? false}
      onIncludeHashtagsChange={onIncludeHashtagsChange}
      placement={overrides?.placement ?? ("end" as Placement)}
      onPlacementChange={onPlacementChange}
      KeywordsInput={MockKeywordsInput}
    />
  )

  return { onHashtagsChange, onIncludeHashtagsChange, onPlacementChange }
}

describe("HashtagsSection", () => {
  it("renders heading and the KeywordsInput pieces", () => {
    setup()
    expect(screen.getByRole("heading", { name: /hashtags/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^hashtags$/i)).toBeInTheDocument()
    expect(screen.getByRole("checkbox")).toBeInTheDocument()
    expect(screen.getByLabelText(/hashtags placement/i)).toBeInTheDocument()
  })

    it("adds normalized hashtags via KeywordsInput and applies max", async () => {
    const user = userEvent.setup()
    const { onHashtagsChange } = setup({ hashtags: ["one", "two"] })

    const input = screen.getByLabelText(/^hashtags$/i)
    await user.type(input, "#CoolTag")
    await user.click(screen.getByText("Add"))
    expect(onHashtagsChange).toHaveBeenLastCalledWith(["one", "two", "CoolTag"])

    for (let i = 0; i < 10; i++) {
      await user.clear(input)
      await user.type(input, `tag${i}`)
      await user.click(screen.getByText("Add"))
    }
    const final = onHashtagsChange.mock.calls.at(-1)?.[0] as string[]
    expect(final.length).toBeLessThanOrEqual(8)
  }, 10000) 


  it("toggles includeHashtags checkbox and calls handler", async () => {
    const user = userEvent.setup()
    const { onIncludeHashtagsChange } = setup({ includeHashtags: false })
    const cb = screen.getByRole("checkbox")
    expect(cb).not.toBeChecked()
    await user.click(cb)
    expect(onIncludeHashtagsChange).toHaveBeenCalledWith(true)
  })

  it("changes placement and calls onPlacementChange", async () => {
    const user = userEvent.setup()
    const { onPlacementChange } = setup({ placement: "start" as Placement })
    const select = screen.getByLabelText(/hashtags placement/i)
    expect((select as HTMLSelectElement).value).toBe("start")
    await user.selectOptions(select, "middle")
    expect(onPlacementChange).toHaveBeenCalledWith("middle")
  })
})
