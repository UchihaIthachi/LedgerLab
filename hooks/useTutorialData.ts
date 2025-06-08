import { useState, useEffect } from 'react';
import { TutorialStep } from '@/types/tutorial'; // Assuming this path is correct

interface TutorialSection {
  title: string;
  steps: TutorialStep[];
}

interface TutorialFileFormat {
  title: string;
  sections: TutorialSection[];
}

interface UseTutorialDataReturn {
  steps: TutorialStep[];
  tutorialTitle: string;
  isLoading: boolean;
  error: string | null;
  // rawData: TutorialFileFormat | null; // Optional: if direct access to raw structure is needed elsewhere
}

const useTutorialData = (tutorialKey: string): UseTutorialDataReturn => {
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [tutorialTitle, setTutorialTitle] = useState<string>('');
  // const [rawData, setRawData] = useState<TutorialFileFormat | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tutorialKey) {
      setIsLoading(false);
      setSteps([]);
      setTutorialTitle('');
      setError('Tutorial key is not provided.');
      return;
    }

    const path = `/data/tutorials/${tutorialKey}_tutorial_en.json`; // Construct path
    setIsLoading(true);
    setError(null);

    fetch(path)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status} - ${await res.text()}`);
        }
        return res.json();
      })
      .then((data: TutorialFileFormat) => {
        // setRawData(data);
        setTutorialTitle(data.title || '');
        const flattenedSteps = data.sections?.reduce(
          (acc: TutorialStep[], section: TutorialSection) => acc.concat(section.steps),
          []
        ) || [];
        setSteps(flattenedSteps);
      })
      .catch((err) => {
        console.error(`Failed to fetch tutorial data from ${path}:`, err);
        setError(err.message || 'Failed to load tutorial.');
        setSteps([]);
        setTutorialTitle('');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [tutorialKey]); // Re-run effect if tutorialKey changes

  return { steps, tutorialTitle, isLoading, error };
};

export default useTutorialData;
