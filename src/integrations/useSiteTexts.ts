import { useContext } from 'react';
import { SiteTextsContext } from './SiteTextsContext';

export const useSiteTexts = () => {
    return useContext(SiteTextsContext);
};
