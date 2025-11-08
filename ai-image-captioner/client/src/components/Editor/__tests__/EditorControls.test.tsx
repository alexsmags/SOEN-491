import { useState, type ComponentProps } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import EditorControls from '../EditorControls'

function setup(overrides: Partial<ComponentProps<typeof EditorControls>> = {}) {
  const setCaptionSpy = vi.fn()
  const setFontFamily = vi.fn()
  const setFontSize = vi.fn()
  const setTextColor = vi.fn()
  const applyAlign = vi.fn()
  const setShowBgSpy = vi.fn()
  const setBgColor = vi.fn()
  const setBgOpacity = vi.fn()
  const nudge = vi.fn()
  const centerPosition = vi.fn()
  const onSave = vi.fn()
  const onSaveImage = vi.fn()

  function Harness() {
    const [caption, setCaptionState] = useState(overrides.caption ?? 'Hello')
    const [showBg, setShowBgState] = useState(overrides.showBg ?? false)
    const [textColorState, setTextColorState] = useState(overrides.textColor ?? '#000000')
    const [bgColorState, setBgColorState] = useState(overrides.bgColor ?? '#ffffff')
    const [fontFamilyState, setFontFamilyState] = useState(overrides.fontFamily ?? 'Arial')
    const [fontSizeState, setFontSizeState] = useState(overrides.fontSize ?? 16)

    return (
      <EditorControls
        caption={caption}
        setCaption={(v) => {
          setCaptionSpy(v)
          setCaptionState(v)
        }}
        fontFamily={fontFamilyState}
        setFontFamily={(v) => {
          setFontFamily(v)
          setFontFamilyState(v)
        }}
        fontSize={fontSizeState}
        setFontSize={(v) => {
          setFontSize(v)
          setFontSizeState(v)
        }}
        textColor={textColorState}
        setTextColor={(v) => {
          setTextColor(v)
          setTextColorState(v)
        }}
        align={overrides.align ?? 'left'}
        applyAlign={applyAlign}
        showBg={showBg}
        setShowBg={(v) => {
          setShowBgSpy(v)
          setShowBgState(v)
        }}
        bgColor={bgColorState}
        setBgColor={(v) => {
          setBgColor(v)
          setBgColorState(v)
        }}
        bgOpacity={overrides.bgOpacity ?? 0.5}
        setBgOpacity={setBgOpacity}
        nudge={nudge}
        centerPosition={centerPosition}
        NUDGE={overrides.NUDGE ?? 2}
        onSave={onSave}
        saving={overrides.saving ?? false}
        saveSuccess={overrides.saveSuccess ?? false}
        showSaveImage={overrides.showSaveImage ?? false}
        onSaveImage={onSaveImage}
        savingImage={overrides.savingImage ?? false}
        saveImageSuccess={overrides.saveImageSuccess ?? false}
      />
    )
  }

  const utils = render(<Harness />)
  return {
    setCaptionSpy,
    setFontFamily,
    setFontSize,
    setTextColor,
    applyAlign,
    setShowBgSpy,
    setBgColor,
    setBgOpacity,
    nudge,
    centerPosition,
    onSave,
    onSaveImage,
    ...utils,
  }
}

it('renders and updates caption text', async () => {
  const user = userEvent.setup()
  const { setCaptionSpy } = setup()
  const textarea = screen.getByTestId('editor-caption-input') as HTMLTextAreaElement
  await user.clear(textarea)
  await user.type(textarea, 'New caption')
  expect(textarea.value).toBe('New caption')
  expect(setCaptionSpy).toHaveBeenLastCalledWith('New caption')
})

it('changes font family and size', async () => {
  const user = userEvent.setup()
  const { setFontFamily, setFontSize } = setup()
  await user.selectOptions(screen.getByTestId('editor-font-select'), 'Inter')
  expect(setFontFamily).toHaveBeenCalledWith('Inter')
  const range = screen.getByTestId('editor-fontsize-range') as HTMLInputElement
  fireEvent.input(range, { target: { value: '24' } })
  expect(setFontSize).toHaveBeenLastCalledWith(24)
})

it('selects a text color via input', async () => {
  const user = userEvent.setup()
  const { setTextColor } = setup()
  const input = screen.getByTestId('editor-color-input') as HTMLInputElement
  await user.clear(input)
  await user.type(input, '#ff0000')
  expect(setTextColor).toHaveBeenLastCalledWith('#ff0000')
})

it('applies text alignment', async () => {
  const user = userEvent.setup()
  const { applyAlign } = setup()
  await user.click(screen.getByTestId('editor-align-center'))
  expect(applyAlign).toHaveBeenCalledWith('center')
})

it('toggles caption background, adjusts opacity, and changes bg color via input', async () => {
  const user = userEvent.setup()
  const { setShowBgSpy, setBgOpacity, setBgColor } = setup()
  await user.click(screen.getByTestId('editor-toggle-bg'))
  expect(setShowBgSpy).toHaveBeenCalledWith(true)
  const opacity = await screen.findByTestId('editor-bg-opacity')
  fireEvent.input(opacity, { target: { value: '0.8' } })
  expect(setBgOpacity).toHaveBeenLastCalledWith(0.8)
  const bgInput = screen.getByTestId('editor-bg-input') as HTMLInputElement
  await user.clear(bgInput)
  await user.type(bgInput, '#00ff00')
  expect(setBgColor).toHaveBeenLastCalledWith('#00ff00')
})

it('triggers save action', async () => {
  const user = userEvent.setup()
  const { onSave } = setup()
  await user.click(screen.getByTestId('editor-save-btn'))
  expect(onSave).toHaveBeenCalled()
})

it('shows and uses save image action when enabled', async () => {
  const user = userEvent.setup()
  const { onSaveImage, rerender } = setup({ showSaveImage: true })
  expect(screen.getByTestId('editor-save-image-btn')).toBeInTheDocument()
  await user.click(screen.getByTestId('editor-save-image-btn'))
  expect(onSaveImage).toHaveBeenCalled()
  rerender(<div />)
})
