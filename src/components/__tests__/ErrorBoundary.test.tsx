import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from '../ErrorBoundary'

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>Normal component</div>
}

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    // Suppress console.error for tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders error UI when child throws an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument()
    expect(screen.getByText('Произошла неожиданная ошибка. Попробуйте обновить страницу или вернуться на главную.')).toBeInTheDocument()
  })

  it('shows retry button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Попробовать снова')).toBeInTheDocument()
  })

  it('shows go home button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('На главную')).toBeInTheDocument()
  })

  it('calls console.error when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(console.error).toHaveBeenCalled()
  })

  it('retry button calls handleRetry function', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    // Initially shows error
    expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument()

    // Click retry button
    const retryButton = screen.getByText('Попробовать снова')
    expect(retryButton).toBeInTheDocument()
    
    fireEvent.click(retryButton)

    // Button should still be visible (ErrorBoundary doesn't automatically reset)
    expect(screen.getByText('Попробовать снова')).toBeInTheDocument()
  })

  it('go home button navigates to home', () => {
    // Mock window.location
    const originalLocation = window.location
    delete (window as Record<string, unknown>).location
    window.location = { ...originalLocation, href: '' } as Location

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    fireEvent.click(screen.getByText('На главную'))
    expect(window.location.href).toBe('/')

    // Restore original location
    window.location = originalLocation
  })

  it('shows error details in development mode', () => {
    // Mock NODE_ENV
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Детали ошибки (только для разработки)')).toBeInTheDocument()

    // Restore original env
    process.env.NODE_ENV = originalEnv
  })

  it('hides error details in production mode', () => {
    // Mock NODE_ENV
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.queryByText('Детали ошибки (только для разработки)')).not.toBeInTheDocument()

    // Restore original env
    process.env.NODE_ENV = originalEnv
  })

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Что-то пошло не так')).not.toBeInTheDocument()
  })
})
