import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import NotFound from '../NotFound';

describe('NotFound Component', () => {
  it('renders the 404 circuit message and navigation links', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    expect(screen.getByText(/404 · CIRCUIT NOT FOUND/i)).toBeInTheDocument();
    expect(screen.getByText(/This Trace Leads Nowhere/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Return Home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /Browse Projects/i })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('link', { name: /My Inventory/i })).toHaveAttribute('href', '/inventory');
  });
});
