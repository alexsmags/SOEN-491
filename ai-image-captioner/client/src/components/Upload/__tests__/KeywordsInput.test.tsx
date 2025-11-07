import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import KeywordsInput from '../KeywordsInput'

describe('KeywordsInput', () => {
it('renders label and placeholder', () => {
render(<KeywordsInput value={[]} onChange={() => {}} label="Tags" placeholder="Add tag" />)
expect(screen.getByText('Tags')).toBeInTheDocument()
expect(screen.getByPlaceholderText('Add tag')).toBeInTheDocument()
})

it('adds a keyword on Enter', () => {
const onChange = vi.fn()
render(<KeywordsInput value={[]} onChange={onChange} />)
const input = screen.getByPlaceholderText(/type and press enter/i)
fireEvent.change(input, { target: { value: 'hello' } })
fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
expect(onChange).toHaveBeenCalledWith(['hello'])
})

it('adds a keyword on comma key', () => {
const onChange = vi.fn()
render(<KeywordsInput value={[]} onChange={onChange} />)
const input = screen.getByPlaceholderText(/type and press enter/i)
fireEvent.change(input, { target: { value: 'world,' } })
fireEvent.keyDown(input, { key: ',', code: 'Comma' })
expect(onChange).toHaveBeenCalledWith(['world'])
})

it('does not add empty or duplicate keywords', () => {
const onChange = vi.fn()
render(<KeywordsInput value={['One']} onChange={onChange} />)
const input = screen.getByPlaceholderText(/type and press enter/i)
fireEvent.change(input, { target: { value: '  ' } })
fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
expect(onChange).not.toHaveBeenCalled()
fireEvent.change(input, { target: { value: 'one' } })
fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
expect(onChange).not.toHaveBeenCalled()
})

it('removes a keyword when clicking X', () => {
const onChange = vi.fn()
render(<KeywordsInput value={['alpha', 'beta']} onChange={onChange} />)
const removeButtons = screen.getAllByRole('button', { name: /remove/i })
fireEvent.click(removeButtons[0])
expect(onChange).toHaveBeenCalledWith(['beta'])
})

it('shows count when max is provided', () => {
render(<KeywordsInput value={['a', 'b']} onChange={() => {}} max={5} />)
expect(screen.getByText('2/5')).toBeInTheDocument()
})

it('applies displayPrefix and normalizeOnAdd correctly', () => {
const normalize = (s: string) => s.toUpperCase()
const onChange = vi.fn()
render(
<KeywordsInput
value={['foo']}
onChange={onChange}
displayPrefix="#"
normalizeOnAdd={normalize}
/>
)
expect(screen.getByText('#foo')).toBeInTheDocument()
const input = screen.getByPlaceholderText(/type and press enter/i)
fireEvent.change(input, { target: { value: 'bar' } })
fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
expect(onChange).toHaveBeenCalledWith(['foo', 'BAR'])
})

it('removes last item when Backspace pressed on empty input', () => {
const onChange = vi.fn()
render(<KeywordsInput value={['last']} onChange={onChange} />)
const input = screen.getByPlaceholderText(/type and press enter/i)
fireEvent.keyDown(input, { key: 'Backspace', code: 'Backspace' })
expect(onChange).toHaveBeenCalledWith([])
})
})
