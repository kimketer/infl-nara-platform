import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-blue-600');
    expect(button).not.toBeDisabled();
  });

  it('renders with custom variant', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    
    const button = screen.getByRole('button', { name: /secondary button/i });
    expect(button).toHaveClass('bg-gray-600');
  });

  it('renders with custom size', () => {
    render(<Button size="lg">Large Button</Button>);
    
    const button = screen.getByRole('button', { name: /large button/i });
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('renders disabled state', () => {
    render(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByRole('button', { name: /disabled button/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('renders loading state', () => {
    render(<Button loading>Loading Button</Button>);
    
    const button = screen.getByRole('button', { name: /loading button/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable Button</Button>);
    
    const button = screen.getByRole('button', { name: /clickable button/i });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled Button</Button>);
    
    const button = screen.getByRole('button', { name: /disabled button/i });
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    
    const button = screen.getByRole('button', { name: /custom button/i });
    expect(button).toHaveClass('custom-class');
  });

  it('renders as link when href is provided', () => {
    render(<Button href="/test">Link Button</Button>);
    
    const link = screen.getByRole('link', { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('renders with icon', () => {
    const Icon = () => <span data-testid="icon">🚀</span>;
    render(<Button icon={<Icon />}>Icon Button</Button>);
    
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('🚀')).toBeInTheDocument();
  });

  it('renders with full width', () => {
    render(<Button fullWidth>Full Width Button</Button>);
    
    const button = screen.getByRole('button', { name: /full width button/i });
    expect(button).toHaveClass('w-full');
  });

  it('renders with outline variant', () => {
    render(<Button variant="outline">Outline Button</Button>);
    
    const button = screen.getByRole('button', { name: /outline button/i });
    expect(button).toHaveClass('border', 'border-blue-600', 'text-blue-600');
  });

  it('renders with danger variant', () => {
    render(<Button variant="danger">Danger Button</Button>);
    
    const button = screen.getByRole('button', { name: /danger button/i });
    expect(button).toHaveClass('bg-red-600');
  });

  it('renders with success variant', () => {
    render(<Button variant="success">Success Button</Button>);
    
    const button = screen.getByRole('button', { name: /success button/i });
    expect(button).toHaveClass('bg-green-600');
  });

  it('renders with warning variant', () => {
    render(<Button variant="warning">Warning Button</Button>);
    
    const button = screen.getByRole('button', { name: /warning button/i });
    expect(button).toHaveClass('bg-yellow-600');
  });

  it('renders with small size', () => {
    render(<Button size="sm">Small Button</Button>);
    
    const button = screen.getByRole('button', { name: /small button/i });
    expect(button).toHaveClass('px-3', 'py-1', 'text-sm');
  });

  it('renders with medium size', () => {
    render(<Button size="md">Medium Button</Button>);
    
    const button = screen.getByRole('button', { name: /medium button/i });
    expect(button).toHaveClass('px-4', 'py-2', 'text-base');
  });

  it('applies disabled styles to outline variant', () => {
    render(<Button variant="outline" disabled>Disabled Outline</Button>);
    
    const button = screen.getByRole('button', { name: /disabled outline/i });
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('applies disabled styles to danger variant', () => {
    render(<Button variant="danger" disabled>Disabled Danger</Button>);
    
    const button = screen.getByRole('button', { name: /disabled danger/i });
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });
}); 