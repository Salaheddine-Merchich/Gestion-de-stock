import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';
import React from 'react';

describe('Button Component', () => {
  it('should render correctly with text', () => {
    render(<Button>Cliquez ici</Button>);
    expect(screen.getByText('Cliquez ici')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Bouton</Button>);
    
    fireEvent.click(screen.getByText('Bouton'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when the disabled prop is true', () => {
    render(<Button disabled>Bouton Désactivé</Button>);
    const button = screen.getByText('Bouton Désactivé');
    expect(button).toBeDisabled();
  });

  it('should apply variant classes correctly', () => {
    render(<Button variant="destructive">Supprimer</Button>);
    const button = screen.getByText('Supprimer');
    expect(button).toHaveClass('bg-destructive');
  });
});
