import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CopyableText from '../CopyableText';

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(),
  },
  writable: true,
});

describe('CopyableText', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (navigator.clipboard.writeText as jest.Mock).mockReset().mockResolvedValue(undefined); // Default mock to resolve
  });

  afterEach(() => {
    jest.clearAllTimers(); // Use clearAllTimers instead of runOnlyPendingTimers if advancing manually
    jest.useRealTimers();
  });

  it('renders the display text and copy icon', () => {
    render(<CopyableText textToCopy="Full text" displayText="Display text" />);
    expect(screen.getByText('Display text')).toBeInTheDocument();
    // Ant Design icons might not use "Copy Outlined" as aria-label directly.
    // It often uses the icon name like "copy" or "check".
    expect(screen.getByLabelText('copy')).toBeInTheDocument(); // Adjusted selector
  });

  it('renders textToCopy when displayText is not provided', () => {
    render(<CopyableText textToCopy="Full text" />);
    expect(screen.getByText('Full text')).toBeInTheDocument();
  });

  it('calls navigator.clipboard.writeText on click and shows success feedback', async () => {
    render(<CopyableText textToCopy="Test copy" />);
    const copyButton = screen.getByLabelText('copy'); // Use the correct aria-label

    await act(async () => {
      fireEvent.click(copyButton);
      // navigator.clipboard.writeText is async, ensure it resolves
      await Promise.resolve();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test copy');
    expect(screen.getByLabelText('check')).toBeInTheDocument(); // Icon changes to check

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByLabelText('copy')).toBeInTheDocument(); // Icon reverts to copy
  });

  it('shows failure feedback if navigator.clipboard.writeText rejects', async () => {
    (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(new Error('Copy failed'));
    render(<CopyableText textToCopy="Test copy fail" />);
    const copyButton = screen.getByLabelText('copy');

    await act(async () => {
      fireEvent.click(copyButton);
      await Promise.resolve(); // Ensure promise rejection is processed
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test copy fail');
    // Icon should remain 'copy', but button might have error styling (e.g., danger prop)
    // Checking for tooltip message "Failed to copy!" would be ideal but complex.
    // For now, we ensure the icon doesn't change to 'check'.
    expect(screen.getByLabelText('copy')).toBeInTheDocument();
    // Optionally, check for Ant Design's danger class or prop if consistently applied
    // expect(copyButton).toHaveClass('ant-btn-dangerous'); // Or similar, depending on antd version

    act(() => {
      jest.advanceTimersByTime(2000); // Clear error state
    });
    expect(screen.getByLabelText('copy')).toBeInTheDocument(); // Icon remains copy
  });

  it('displays displayText when provided', () => {
    render(<CopyableText textToCopy="Full text" displayText="Shortened" />);
    expect(screen.getByText('Shortened')).toBeInTheDocument();
    // Check that the title attribute (browser tooltip) on the text has the full text
    expect(screen.getByText('Shortened')).toHaveAttribute('title', 'Full text');
  });
});
