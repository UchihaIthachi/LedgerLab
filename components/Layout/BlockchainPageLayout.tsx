import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import { Tabs, Typography, Button } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'next-i18next';
import { motion } from 'framer-motion'; // Import motion

import { TutorialStep } from '@/types/tutorial';
import MarkdownRenderer from '@/components/Common/MarkdownRenderer';
import TutorialDisplay from '@/components/Tutorial/TutorialDisplay';
import useMarkdownDoc from '@/hooks/useMarkdownDoc';
import useTutorialData from '@/hooks/useTutorialData';

export interface BlockchainPageLayoutProps {
  pageTitle: string;
  theoryDocPath: string;
  tutorialKey: string;
  children: React.ReactNode; // For the interactive demo tab content
  onExecuteTutorialAction: (actionType: string, actionParams?: any) => void;
  // Optional: A way to pass extra content or controls for the header, if needed later
  // headerExtra?: React.ReactNode;
}

const BlockchainPageLayout: React.FC<BlockchainPageLayoutProps> = (props) => {
  const { pageTitle, theoryDocPath, tutorialKey, children, onExecuteTutorialAction } = props;
  const { t } = useTranslation('common');

  const [activeTabKey, setActiveTabKey] = useState<string>("1");
  const [isTutorialVisible, setIsTutorialVisible] = useState<boolean>(false);

  const { content: theoryContent, isLoading: theoryIsLoading, error: theoryError } = useMarkdownDoc(theoryDocPath);
  const { steps: tutorialSteps, tutorialTitle, isLoading: tutorialDataIsLoading, error: tutorialDataError } = useTutorialData(tutorialKey);
  // Note: tutorialDataIsLoading and tutorialDataError are available from useTutorialData if needed for UI feedback

  const startTutorial = useCallback(() => {
    // Ensure steps are loaded before showing tutorial.
    // If tutorialKey is valid, useTutorialData will fetch steps.
    // We can rely on tutorialSteps.length > 0 in the conditional render of TutorialDisplay.
    setIsTutorialVisible(true);
  }, []);

  const closeTutorial = useCallback(() => {
    setIsTutorialVisible(false);
  }, []);

  return (
    <>
      <Head>
        <title>{pageTitle} - {String(t('BlockchainDemo', 'Blockchain Demo'))}</title>
      </Head>
      <div style={{ padding: '0 24px' }}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }} // Applied margin here for the whole header row
        >
          <Typography.Title level={1} style={{ margin: 0 }}> {/* Changed level and removed specific margin from here */}
            {pageTitle}
          </Typography.Title>
          <Button icon={<QuestionCircleOutlined />} onClick={startTutorial}>
            {t('StartTutorial', 'Start Tutorial')}
          </Button>
        </motion.div>

        <Tabs activeKey={activeTabKey} onChange={setActiveTabKey}>
          <Tabs.TabPane tab={t('InteractiveDemoTab', 'Interactive Demo')} key="1">
            {children}
          </Tabs.TabPane>
          <Tabs.TabPane tab={t('TheoryTab', 'Theory & Explanation')} key="2">
            <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '10px' }}>
              <MarkdownRenderer
                markdownContent={theoryContent}
                isLoading={theoryIsLoading}
                error={theoryError}
                className="tutorial-content-markdown" // Ensure this class provides necessary styling
                errorMessagePrefix={t('ErrorLoadingTheoryPrefix', 'Error loading content:')}
              />
            </div>
          </Tabs.TabPane>
        </Tabs>

        {isTutorialVisible && tutorialSteps.length > 0 && (
          <TutorialDisplay
            tutorialKey={tutorialKey} // Or use tutorialTitle from useTutorialData
            steps={tutorialSteps}
            isVisible={isTutorialVisible}
            onClose={closeTutorial}
            onExecuteAction={onExecuteTutorialAction}
          />
        )}
      </div>
    </>
  );
};

export default BlockchainPageLayout;
