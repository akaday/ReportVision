import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import { UploadHeader } from '../Header';

describe('UploadHeader component', () => {
  it('renders the header with correct structure', () => {
    render(<UploadHeader />);

    // Check for the main header element
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveStyle({ height: '50px', padding: '8px' });

    // Check for the Close button with the icon
    const closeButton = screen.getByTestId('close-button');
    expect(closeButton).toBeInTheDocument();

    // Check for the heading
    const heading = screen.getByRole('heading', { name: /annotate new template/i });
    expect(heading).toBeInTheDocument();

    // Check for the Back button
    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveStyle({
      height: '40px',
      color: '#adadad',
    });

    // Check for the Submit button
    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveStyle({
      height: '40px',
    });
  });

  it('renders all buttons with correct text', () => {
    render(<UploadHeader />);

    const backButton = screen.getByRole('button', { name: /back/i });
    const submitButton = screen.getByRole('button', { name: /submit/i });

    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveTextContent('Back');

    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveTextContent('Submit');
  });
});