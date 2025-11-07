import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { Placement } from '../types'
import PlacementSelect from '../PlacementSelect'

describe('PlacementSelect', () => {
it('renders label and options', () => {
render(<PlacementSelect label="Placement" value={'beginning' as Placement} onChange={() => {}} />)
expect(screen.getByText('Placement')).toBeInTheDocument()
expect(screen.getByRole('option', { name: 'Beginning' })).toBeInTheDocument()
expect(screen.getByRole('option', { name: 'Middle' })).toBeInTheDocument()
expect(screen.getByRole('option', { name: 'End' })).toBeInTheDocument()
})

it('shows current value', () => {
render(<PlacementSelect label="x" value={'middle' as Placement} onChange={() => {}} />)
const select = screen.getByRole('combobox') as HTMLSelectElement
expect(select.value).toBe('middle')
})

it('calls onChange with new placement', () => {
const onChange = vi.fn()
render(<PlacementSelect label="x" value={'beginning' as Placement} onChange={onChange} />)
const select = screen.getByRole('combobox')
fireEvent.change(select, { target: { value: 'end' } })
expect(onChange).toHaveBeenCalledWith('end')
})
})
