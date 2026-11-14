import React from 'react';
import { useSiteTexts } from '../integrations/useSiteTexts';
import { SiteTexts } from '../data/siteTexts';

interface EditableTextProps {
  textKey: keyof SiteTexts;
  className?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
  multiline?: boolean;
}

/**
 * Renders site copy managed via Google Sheets (`sitetext`) as clean typography.
 * Page copy is authored strictly in the master Google Sheet to avoid split-brain overrides.
 */
const EditableText: React.FC<EditableTextProps> = ({
  textKey,
  className = '',
  as: Component = 'span',
}) => {
  const { texts } = useSiteTexts();
  const content = texts[textKey] || '';

  return (
    <Component className={className}>
      {content.split('\n').map((line, i) => (
        <React.Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </React.Fragment>
      ))}
    </Component>
  );
};

export default EditableText;
