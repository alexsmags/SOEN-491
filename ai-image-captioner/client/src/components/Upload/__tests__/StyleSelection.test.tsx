import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { Voice, LengthPref } from '../types'
import StyleSection from '../StyleSelection'

function StubToneSelect<T>({ value, onChange }: { value: T; onChange: (v: T) => void }) {
return ( <div data-testid="tone-select"> <span data-testid="tone-value">{String(value)}</span>
<button onClick={() => onChange(('newTone' as unknown) as T)} data-testid="tone-change">change</button> </div>
)
}

function StubKeywordsInput(props: {
label: string
value: string[]
onChange: (v: string[]) => void
placeholder?: string
max?: number
}) {
return ( <div data-testid="keywords-input" data-label={props.label} data-placeholder={props.placeholder} data-max={props.max}> <span data-testid="keywords-value">{props.value.join(',')}</span>
<button onClick={() => props.onChange(['a','b'])} data-testid="keywords-change">add</button> </div>
)
}

describe('StyleSection', () => {
it('renders header and ToneSelect', () => {
render(
<StyleSection
tone="cool"
onToneChange={() => {}}
voice={'neutral' as Voice}
onVoiceChange={() => {}}
lengthPref={'medium' as LengthPref}
onLengthPrefChange={() => {}}
keywords={[]}
onKeywordsChange={() => {}}
ToneSelect={StubToneSelect}
KeywordsInput={StubKeywordsInput}
/>
)
expect(screen.getByText(/Style/i)).toBeInTheDocument()
expect(screen.getByTestId('tone-select')).toBeInTheDocument()
expect(screen.getByTestId('tone-value')).toHaveTextContent('cool')
})

it('emits onToneChange from stub', () => {
const onToneChange = vi.fn()
render(
<StyleSection
tone="t1"
onToneChange={onToneChange}
voice={'neutral' as Voice}
onVoiceChange={() => {}}
lengthPref={'short' as LengthPref}
onLengthPrefChange={() => {}}
keywords={[]}
onKeywordsChange={() => {}}
ToneSelect={StubToneSelect}
KeywordsInput={StubKeywordsInput}
/>
)
fireEvent.click(screen.getByTestId('tone-change'))
expect(onToneChange).toHaveBeenCalledWith('newTone')
})

it('changes voice select', () => {
const onVoiceChange = vi.fn()
render(
<StyleSection
tone="x"
onToneChange={() => {}}
voice={'neutral' as Voice}
onVoiceChange={onVoiceChange}
lengthPref={'short' as LengthPref}
onLengthPrefChange={() => {}}
keywords={[]}
onKeywordsChange={() => {}}
ToneSelect={StubToneSelect}
KeywordsInput={StubKeywordsInput}
/>
)
const voiceWrapper = screen.getByText(/Voice/i).closest('div') as HTMLElement
const voiceSelect = within(voiceWrapper).getByRole('combobox')
fireEvent.change(voiceSelect, { target: { value: 'we' } })
expect(onVoiceChange).toHaveBeenCalledWith('we')
})

it('changes length select', () => {
const onLengthPrefChange = vi.fn()
render(
<StyleSection
tone="x"
onToneChange={() => {}}
voice={'neutral' as Voice}
onVoiceChange={() => {}}
lengthPref={'short' as LengthPref}
onLengthPrefChange={onLengthPrefChange}
keywords={[]}
onKeywordsChange={() => {}}
ToneSelect={StubToneSelect}
KeywordsInput={StubKeywordsInput}
/>
)
const lengthWrapper = screen.getByText(/Length/i).closest('div') as HTMLElement
const lengthSelect = within(lengthWrapper).getByRole('combobox')
fireEvent.change(lengthSelect, { target: { value: 'long' } })
expect(onLengthPrefChange).toHaveBeenCalledWith('long')
})

it('renders and updates KeywordsInput', () => {
const onKeywordsChange = vi.fn()
render(
<StyleSection
tone="x"
onToneChange={() => {}}
voice={'neutral' as Voice}
onVoiceChange={() => {}}
lengthPref={'short' as LengthPref}
onLengthPrefChange={() => {}}
keywords={['k1']}
onKeywordsChange={onKeywordsChange}
ToneSelect={StubToneSelect}
KeywordsInput={StubKeywordsInput}
/>
)
const ki = screen.getByTestId('keywords-input')
expect(ki).toHaveAttribute('data-label', 'Keywords')
expect(ki).toHaveAttribute('data-placeholder', 'Add keywords and press Enter…')
expect(ki).toHaveAttribute('data-max', '8')
expect(screen.getByTestId('keywords-value')).toHaveTextContent('k1')
fireEvent.click(screen.getByTestId('keywords-change'))
expect(onKeywordsChange).toHaveBeenCalledWith(['a','b'])
})
})
