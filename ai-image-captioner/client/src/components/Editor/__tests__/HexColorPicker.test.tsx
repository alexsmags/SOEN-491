import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import ColorPickerField from "../HexColorPicker"

describe("ColorPickerField", () => {
  it("renders label and color input", () => {
    const handleChange = vi.fn()
    render(<ColorPickerField label="Pick Color" color="#ff0000" onChange={handleChange} inputTestId="color-input" />)
    expect(screen.getByText("Pick Color")).toBeInTheDocument()
    expect(screen.getByTestId("color-input")).toHaveValue("#ff0000")
  })

  it("calls onChange when input value changes", () => {
    const handleChange = vi.fn()
    render(<ColorPickerField label="Color" color="#000000" onChange={handleChange} inputTestId="color-input" />)
    const input = screen.getByTestId("color-input")
    fireEvent.change(input, { target: { value: "#123456" } })
    expect(handleChange).toHaveBeenCalledWith("#123456")
  })

  it("shows color preview with correct background", () => {
    const handleChange = vi.fn()
    render(<ColorPickerField label="Preview" color="#abcdef" onChange={handleChange} />)
    const colorBox = document.querySelector('div[style]') as HTMLElement
    expect(colorBox).toBeTruthy()
    expect(colorBox.style.backgroundColor.toLowerCase()).toContain("rgb")
  })
})
