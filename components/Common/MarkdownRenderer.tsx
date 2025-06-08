import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Typography } from 'antd'; // For loading/error states

interface MarkdownRendererProps {
  markdownContent: string | null | undefined;
  isLoading?: boolean;
  error?: string | null;
  loadingMessage?: string;
  errorMessagePrefix?: string;
  className?: string; // To allow passing custom classes for styling container
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  markdownContent,
  isLoading = false,
  error = null,
  loadingMessage = "Loading content...",
  errorMessagePrefix = "Error loading content:",
  className = "markdown-content-container" // Default class for styling
}) => {
  if (isLoading) {
    return <Typography.Text>{loadingMessage}</Typography.Text>;
  }

  if (error) {
    return <Typography.Text type="danger">{errorMessagePrefix} {error}</Typography.Text>;
  }

  if (!markdownContent) {
    // Consider if "No content available" should only show if not loading and no error.
    // If markdownContent can legitimately be an empty string for valid content, this might need adjustment.
    // For typical markdown fetching, null/undefined usually means not loaded or error.
    return <Typography.Text type="secondary">No content available.</Typography.Text>;
  }

  return (
    <div className={className}>
      <ReactMarkdown>{markdownContent}</ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
