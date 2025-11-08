import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ToneSelect from "../ToneSelect"
import type { ToneOption } from "../ToneSelect"

describe("ToneSelect", () => {
  it("renders label and all tone options", () => {
    const handleChange = vi.fn()
    render(<ToneSelect value="casual" onChange={handleChange} />)
    expect(screen.getByText("Tone")).toBeInTheDocument()
    const select = screen.getByRole("combobox")
    expect(select).toBeInTheDocument()
    const options = screen.getAllByRole("option")
    expect(options.map((o) => o.textContent)).toEqual([
      "Casual",
      "Formal",
      "Humorous",
      "Professional",
      "Inspirational",
    ])
  })

  it("shows the correct selected value", () => {
    const handleChange = vi.fn()
    render(<ToneSelect value="formal" onChange={handleChange} />)
    const select = screen.getByRole("combobox") as HTMLSelectElement
    expect(select.value).toBe("formal")
  })

  it("calls onChange when a different tone is selected", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<ToneSelect value="casual" onChange={handleChange} />)
    const select = screen.getByRole("combobox")
    await user.selectOptions(select, "humorous")
    expect(handleChange).toHaveBeenCalledWith("humorous" as ToneOption)
  })
})
