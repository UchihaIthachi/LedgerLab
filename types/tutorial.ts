export interface TryItAction {
  buttonText: string;
  actionType: string; // e.g., NAVIGATE_TO_PAGE, FOCUS_ELEMENT, OPEN_BLOCK_MODAL_AND_FOCUS_DATA
  actionParams?: any;
}

export interface TutorialStep {
  id: string;
  pagePath?: string | string[]; // Path(s) where this step is relevant
  title?: string;
  content: string;
  uiElementSelector?: string; // For highlighting elements related to the step
  tryIt?: TryItAction;
}

export interface TutorialSection {
  id: string;
  title: string;
  steps: TutorialStep[];
}

export interface TutorialData {
  [tutorialKey: string]: { // e.g., "blockchainTutorial"
    title: string;
    description: string;
    sections: TutorialSection[];
  };
}
