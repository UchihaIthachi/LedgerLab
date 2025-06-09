import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Typography, Skeleton } from 'antd'; // For loading/error states, added Skeleton

interface MarkdownRendererProps {
  markdownContent: string | null | undefined;
  isLoading?: boolean;
  error?: string | null;
  errorMessagePrefix?: string;
  className?: string; // To allow passing custom classes for styling container
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  markdownContent,
  isLoading = false,
  error = null,
  errorMessagePrefix = "Error loading content:",
  className = "markdown-content-container" // Default class for styling
}) => {
  // Combine the passed className with tutorial-content-markdown
  const containerClassName = `tutorial-content-markdown ${className}`.trim();

  if (isLoading) {
    return <Skeleton active title paragraph={{ rows: 5 }} />;
  }

  if (error) {
    return <Typography.Text type="danger">{errorMessagePrefix} {error}</Typography.Text>;
  }

  if (markdownContent === null || markdownContent === undefined) {
    // Consider if "No content available" should only show if not loading and no error.
    // If markdownContent can legitimately be an empty string for valid content, this might need adjustment.
    // For typical markdown fetching, null/undefined usually means not loaded or error.
    return <Typography.Text type="secondary">No content available.</Typography.Text>;
  }

  return (
    <div className={containerClassName}>
      <ReactMarkdown>{markdownContent}</ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
