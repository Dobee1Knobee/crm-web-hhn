import React from 'react'
import { render, screen } from '@testing-library/react'
import Skeleton, { OrderCardSkeleton, FormSkeleton, TableSkeleton, BufferSkeleton } from '../Skeleton'

describe('Skeleton Component', () => {
  it('renders basic skeleton with custom props', () => {
    render(<Skeleton width={100} height={50} rounded="full" data-testid="skeleton" />)
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveStyle({ width: '100px', height: '50px' })
    expect(skeleton).toHaveClass('rounded-full')
  })

  it('applies default classes correctly', () => {
    render(<Skeleton data-testid="skeleton" />)
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('bg-gray-200', 'rounded-md', 'animate-pulse')
  })

  it('disables animation when animate is false', () => {
    render(<Skeleton animate={false} data-testid="skeleton" />)
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).not.toHaveClass('animate-pulse')
  })

  it('renders OrderCardSkeleton correctly', () => {
    render(<OrderCardSkeleton />)
    
    // Check if skeleton elements are rendered
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
    
    // Check if the container has correct classes
    const container = skeletons[0].closest('.bg-white')
    expect(container).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm')
  })

  it('renders FormSkeleton correctly', () => {
    render(<FormSkeleton />)
    
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
    
    // Check grid layout
    const gridContainer = skeletons[0].closest('.grid')
    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2')
  })

  it('renders TableSkeleton correctly', () => {
    render(<TableSkeleton />)
    
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
    
    // Check if we have multiple rows
    const container = skeletons[0].closest('.space-y-3')
    expect(container).toBeInTheDocument()
    expect(container?.children.length).toBe(5) // 5 rows as defined in the component
  })

  it('renders BufferSkeleton correctly', () => {
    render(<BufferSkeleton />)
    
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
    
    // Check if we have multiple buffer items
    const container = skeletons[0].closest('.space-y-3')
    expect(container).toBeInTheDocument()
    expect(container?.children.length).toBe(3) // 3 items as defined in the component
  })
})
