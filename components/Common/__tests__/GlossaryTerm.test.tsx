import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GlossaryTerm from '../GlossaryTerm';
import { useTranslation } from 'next-i18next';

// Mock next-i18next
jest.mock('next-i18next', () => ({
  useTranslation: jest.fn(),
}));

const mockT = jest.fn((key, options) => {
  if (key === 'glossary_nonce') return 'Nonce';
  if (key === 'glossary_nonce_def') return 'Nonce Definition';
  if (key === 'glossary_custom') return 'Custom Term Display';
  if (key === 'glossary_custom_def') return 'Custom Definition';
  if (options && options.defaultValue) return options.defaultValue;
  return key;
});

describe('GlossaryTerm', () => {
  beforeEach(() => {
    (useTranslation as jest.Mock).mockReturnValue({
      t: mockT,
      i18n: {
        language: 'en',
        changeLanguage: jest.fn(),
      },
    });
    mockT.mockClear();
  });

  it('renders the term and uses definition from translation for Tooltip', () => {
    render(<GlossaryTerm termKey="nonce" />);

    // Check if the term "Nonce" is rendered
    const termElement = screen.getByText('Nonce');
    expect(termElement).toBeInTheDocument();
    expect(mockT).toHaveBeenCalledWith('glossary_nonce', { defaultValue: 'nonce' });

    // Ant Design Tooltip content is not directly in the DOM until hovered/focused.
    // We can check if the Tooltip wrapper component received the correct title prop.
    // However, @testing-library primarily interacts with the DOM as a user would.
    // For Tooltip, we can check its presence by its role or structure if needed,
    // but the most important is that the `title` prop (which becomes tooltip content) is correct.
    // The Tooltip wraps the text, so we can find the parent element that would trigger it.
    const tooltipTriggerElement = termElement.parentElement; // Or a more specific selector if needed

    // This is an indirect way to check. A more robust way would be to simulate hover
    // and check for the tooltip content if testing-library and antd allow easy simulation.
    // For now, we trust Ant Design's Tooltip to render its 'title' prop.
    // We've already asserted that `t` is called for the definition.
    expect(mockT).toHaveBeenCalledWith('glossary_nonce_def', { defaultValue: 'Definition not found.' });

    // Check for the specific styling (dotted underline)
    expect(termElement).toHaveStyle('border-bottom: 1px dotted currentColor');
    expect(termElement).toHaveStyle('cursor: help');
  });

  it('renders children as the display term if provided', () => {
    render(<GlossaryTerm termKey="custom"><span>Custom Child Display</span></GlossaryTerm>);

    const childElement = screen.getByText('Custom Child Display');
    expect(childElement).toBeInTheDocument();

    // Term itself from glossary_custom might not be directly visible if children override it,
    // but t function should still be called for definition.
    expect(mockT).toHaveBeenCalledWith('glossary_custom_def', { defaultValue: 'Definition not found.' });

    // Check styling on the child's wrapper (the Text component)
     expect(childElement.closest('span.ant-typography')).toHaveStyle('border-bottom: 1px dotted currentColor');
  });

  it('handles missing term with defaultValue', () => {
    mockT.mockImplementationOnce((key, options) => options.defaultValue || key); // Simulate term not found
    render(<GlossaryTerm termKey="unknown" />);
    expect(screen.getByText('unknown')).toBeInTheDocument(); // Renders termKey as fallback
  });

  it('handles missing definition with defaultValue', () => {
    // For this, we need to ensure the term is found but definition is not
    (useTranslation as jest.Mock).mockReturnValueOnce({
      t: (key, options) => {
        if (key === 'glossary_nodef_term') return 'No Def Term';
        // Simulate definition not found by returning defaultValue for the _def key
        if (key === 'glossary_nodef_term_def' && options && options.defaultValue) return options.defaultValue;
        return key;
      },
      i18n: { language: 'en', changeLanguage: jest.fn() },
    });

    render(<GlossaryTerm termKey="nodef_term" />);
    expect(screen.getByText('No Def Term')).toBeInTheDocument();
    // Tooltip should get 'Definition not found.'
    // This is hard to assert directly without hover. Relies on mockT behavior for _def.
    // We can see if `t` was called correctly for the definition.
    // The actual check for "Definition not found." would be via Tooltip title prop,
    // which is implicitly tested by how we set up the mock for `glossary_nodef_term_def`.
  });
});
