import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button, Card, Typography, Space } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, CloseOutlined } from '@ant-design/icons';
import { TutorialStep } from '@/types/tutorial'; // Import from types/tutorial.ts

// Props for the TutorialDisplay component
interface TutorialDisplayProps {
  tutorialKey: string; // To fetch/select the correct tutorial data - not used yet, but for future
  steps: TutorialStep[];
  isVisible: boolean;
  onClose: () => void;
  onExecuteAction: (actionType: string, actionParams?: any) => void; // Callback to execute "Try It" actions
  // currentStepIndex and onSetCurrentStepIndex could be managed internally or passed if controlled from outside
}

const TutorialDisplay: React.FC<TutorialDisplayProps> = ({
  steps,
  isVisible,
  onClose,
  onExecuteAction,
  // tutorialKey prop is available but not used in this basic version
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // Reset to first step when visibility changes (e.g. tutorial is opened) or steps array changes
    if (isVisible) {
      setCurrentStepIndex(0);
    }
  }, [isVisible, steps]);

  if (!isVisible || !steps || steps.length === 0) {
    return null;
  }

  const currentStep = steps[currentStepIndex];

  const handleNext = () => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleTryIt = () => {
    if (currentStep.tryIt) {
      onExecuteAction(currentStep.tryIt.actionType, currentStep.tryIt.actionParams);
    }
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'move' }} className="drag-handle"> {/* Added drag-handle class if using react-draggable */}
          <Typography.Title level={4} style={{ margin: 0 }}>
            {/* Using currentStep.title directly; fallback can be added if title is optional and not always present */}
            {currentStep.title || `Tutorial: Step ${currentStepIndex + 1}`}
          </Typography.Title>
          <Button icon={<CloseOutlined />} onClick={onClose} type="text" />
        </div>
      }
      style={{
        position: 'fixed',
        right: '20px',
        top: '80px', // Adjusted top to avoid overlap with potential top navbars
        width: '350px',
        maxHeight: 'calc(100vh - 100px)', // Ensure it doesn't go off-screen
        overflowY: 'auto',
        zIndex: 1050, // Higher zIndex to be above most elements, but less than modals if needed
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
      bodyStyle={{padding: '16px'}}
    >
      <div style={{ marginBottom: '16px', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}> {/* Max height for content area */}
        <ReactMarkdown>{currentStep.content}</ReactMarkdown>
      </div>

      {currentStep.tryIt && (
        <Button type="primary" onClick={handleTryIt} style={{ marginBottom: '16px' }}>
          {currentStep.tryIt.buttonText}
        </Button>
      )}

      <Space style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <Typography.Text type="secondary">
          Step {currentStepIndex + 1} of {steps.length}
        </Typography.Text>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handlePrevious} disabled={currentStepIndex === 0}>
            Previous
          </Button>
          <Button icon={<ArrowRightOutlined />} onClick={handleNext} disabled={currentStepIndex === steps.length - 1}>
            Next
          </Button>
        </Space>
      </Space>
    </Card>
  );
};

export default TutorialDisplay;
