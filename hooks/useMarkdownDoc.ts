import { useState, useEffect } from 'react';

interface UseMarkdownDocReturn {
  content: string;
  isLoading: boolean;
  error: string | null;
}

const useMarkdownDoc = (docPath: string): UseMarkdownDocReturn => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docPath) {
      setIsLoading(false);
      setContent('');
      setError('Document path is not provided.');
      return;
    }

    setIsLoading(true);
    setError(null);
    fetch(docPath)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status} - ${await res.text()}`);
        }
        return res.text();
      })
      .then((text) => {
        setContent(text);
      })
      .catch((err) => {
        console.error(`Failed to fetch markdown from ${docPath}:`, err);
        setError(err.message || 'Failed to load content.');
        setContent('');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [docPath]); // Re-run effect if docPath changes

  return { content, isLoading, error };
};

export default useMarkdownDoc;
