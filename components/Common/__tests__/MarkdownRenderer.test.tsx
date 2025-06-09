import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MarkdownRenderer from '../MarkdownRenderer';

// Mock ReactMarkdown as its rendering is not the focus here
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: jest.fn(({ children }) => <div data-testid="react-markdown-mock">{children}</div>),
}));

// Mock Ant Design Skeleton component
jest.mock('antd', () => {
  const antd = jest.requireActual('antd'); // Import and retain default Ant Design components
  return {
    ...antd,
    Skeleton: jest.fn(() => <div data-testid="skeleton-mock" />),
  };
});

describe('MarkdownRenderer', () => {
  it('renders Skeleton when isLoading is true', () => {
    render(<MarkdownRenderer markdownContent={null} isLoading={true} />);
    expect(screen.getByTestId('skeleton-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('react-markdown-mock')).not.toBeInTheDocument();
    expect(screen.queryByText(/Error loading content:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No content available./i)).not.toBeInTheDocument();
  });

  it('renders ReactMarkdown when markdownContent is provided and not loading', () => {
    const testMarkdown = '# Hello World';
    render(<MarkdownRenderer markdownContent={testMarkdown} isLoading={false} />);

    const markdownMock = screen.getByTestId('react-markdown-mock');
    expect(markdownMock).toBeInTheDocument();
    expect(markdownMock).toHaveTextContent(testMarkdown);

    expect(screen.queryByTestId('skeleton-mock')).not.toBeInTheDocument();
    expect(screen.queryByText(/Error loading content:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No content available./i)).not.toBeInTheDocument();
  });

  it('renders error message when error is present', () => {
    const errorMessage = 'Failed to fetch';
    render(<MarkdownRenderer markdownContent={null} error={errorMessage} />);

    expect(screen.getByText(`Error loading content: ${errorMessage}`)).toBeInTheDocument();
    expect(screen.queryByTestId('skeleton-mock')).not.toBeInTheDocument();
    expect(screen.queryByTestId('react-markdown-mock')).not.toBeInTheDocument();
    expect(screen.queryByText(/No content available./i)).not.toBeInTheDocument();
  });

  it('renders "No content available" when no content, not loading, and no error', () => {
    render(<MarkdownRenderer markdownContent={null} isLoading={false} error={null} />);
    expect(screen.getByText('No content available.')).toBeInTheDocument();
    expect(screen.queryByTestId('skeleton-mock')).not.toBeInTheDocument();
    expect(screen.queryByTestId('react-markdown-mock')).not.toBeInTheDocument();
    expect(screen.queryByText(/Error loading content:/i)).not.toBeInTheDocument();
  });

  it('renders empty string content correctly', () => {
    render(<MarkdownRenderer markdownContent="" isLoading={false} />);
    const markdownMock = screen.getByTestId('react-markdown-mock');
    expect(markdownMock).toBeInTheDocument();
    expect(markdownMock).toHaveTextContent(''); // Empty content
    expect(screen.queryByText(/No content available./i)).not.toBeInTheDocument();
  });

  it('uses custom errorMessagePrefix if provided', () => {
    const errorMessage = 'Network issue';
    const prefix = 'Custom Error:';
    render(<MarkdownRenderer markdownContent={null} error={errorMessage} errorMessagePrefix={prefix} />);
    expect(screen.getByText(`${prefix} ${errorMessage}`)).toBeInTheDocument();
  });

  it('applies custom className to the container', () => {
    const testMarkdown = 'Some content';
    const customClass = 'my-custom-markdown-styles';
    render(<MarkdownRenderer markdownContent={testMarkdown} className={customClass} />);
    // The rendered div by ReactMarkdown mock is inside the container
    const markdownMock = screen.getByTestId('react-markdown-mock');
    expect(markdownMock.parentElement).toHaveClass('tutorial-content-markdown');
    expect(markdownMock.parentElement).toHaveClass(customClass);
  });
});
