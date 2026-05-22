import { useContext } from 'react';
import { SiteTextsContext } from '../context/SiteTextsContext';

export const useSiteTexts = () => {
    return useContext(SiteTextsContext);
};

