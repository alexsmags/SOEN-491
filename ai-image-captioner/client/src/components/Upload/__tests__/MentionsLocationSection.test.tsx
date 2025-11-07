import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { Placement } from '../types'
import MentionsLocationSection from '../MentionsLocationSection'

const placementStart = 'start' as unknown as Placement
const placementEnd = 'end' as unknown as Placement

vi.mock('../PlacementSelect', () => ({
default: ({ label, value, onChange }: { label: string; value: Placement; onChange: (v: Placement) => void }) => ( <div> <span data-testid="placement-label">{label}</span> <span data-testid="placement-value">{String(value)}</span>
<button onClick={() => onChange(placementEnd)} data-testid="placement-change">change</button> </div>
),
}))

function StubKeywordsInput(props: {
label: string
value: string[]
onChange: (v: string[]) => void
placeholder?: string
displayPrefix?: string
normalizeOnAdd?: (s: string) => string
max?: number
}) {
return ( <div data-testid="keywords-stub" data-label={props.label} data-displayprefix={props.displayPrefix} data-max={props.max} data-placeholder={props.placeholder}> <span data-testid="keywords-value">{props.value.join(',')}</span>
<button onClick={() => props.onChange(['a', 'b'])} data-testid="keywords-change">add</button> </div>
)
}

describe('MentionsLocationSection', () => {
it('renders header and checkbox, toggles includeMentions', () => {
const onIncludeMentionsChange = vi.fn()
render(
<MentionsLocationSection
includeMentions={false}
onIncludeMentionsChange={onIncludeMentionsChange}
handles={[]}
onHandlesChange={() => {}}
location=""
onLocationChange={() => {}}
placement={placementStart}
onPlacementChange={() => {}}
KeywordsInput={StubKeywordsInput}
/>
)
expect(screen.getByText(/Mentions & Location/i)).toBeInTheDocument()
const checkbox = screen.getByRole('checkbox')
fireEvent.click(checkbox)
expect(onIncludeMentionsChange).toHaveBeenCalledWith(true)
})

it('shows KeywordsInput when includeMentions is true and passes props', () => {
render(
<MentionsLocationSection
includeMentions
onIncludeMentionsChange={() => {}}
handles={['user1']}
onHandlesChange={() => {}}
location=""
onLocationChange={() => {}}
placement={placementStart}
onPlacementChange={() => {}}
KeywordsInput={StubKeywordsInput}
/>
)
const ki = screen.getByTestId('keywords-stub')
expect(ki).toBeInTheDocument()
expect(ki).toHaveAttribute('data-label', '@ Mentions')
expect(ki).toHaveAttribute('data-displayprefix', '@')
expect(ki).toHaveAttribute('data-max', '8')
expect(ki).toHaveAttribute('data-placeholder', 'Add usernames (no @ needed)…')
expect(screen.getByTestId('keywords-value')).toHaveTextContent('user1')
})

it('propagates handle changes via KeywordsInput', () => {
const onHandlesChange = vi.fn()
render(
<MentionsLocationSection
includeMentions
onIncludeMentionsChange={() => {}}
handles={[]}
onHandlesChange={onHandlesChange}
location=""
onLocationChange={() => {}}
placement={placementStart}
onPlacementChange={() => {}}
KeywordsInput={StubKeywordsInput}
/>
)
fireEvent.click(screen.getByTestId('keywords-change'))
expect(onHandlesChange).toHaveBeenCalledWith(['a', 'b'])
})

it('updates location input', () => {
const onLocationChange = vi.fn()
render(
<MentionsLocationSection
includeMentions={false}
onIncludeMentionsChange={() => {}}
handles={[]}
onHandlesChange={() => {}}
location="Toronto"
onLocationChange={onLocationChange}
placement={placementStart}
onPlacementChange={() => {}}
KeywordsInput={StubKeywordsInput}
/>
)
const input = screen.getByPlaceholderText(/e.g., Toronto, ON/i)
fireEvent.change(input, { target: { value: 'Montreal' } })
expect(onLocationChange).toHaveBeenCalledWith('Montreal')
})

it('changes placement via PlacementSelect', () => {
const onPlacementChange = vi.fn()
render(
<MentionsLocationSection
includeMentions={false}
onIncludeMentionsChange={() => {}}
handles={[]}
onHandlesChange={() => {}}
location=""
onLocationChange={() => {}}
placement={placementStart}
onPlacementChange={onPlacementChange}
KeywordsInput={StubKeywordsInput}
/>
)
expect(screen.getByTestId('placement-label')).toHaveTextContent('Mentions/Location placement')
expect(screen.getByTestId('placement-value')).toHaveTextContent(String(placementStart))
fireEvent.click(screen.getByTestId('placement-change'))
expect(onPlacementChange).toHaveBeenCalledWith(placementEnd)
})
})
