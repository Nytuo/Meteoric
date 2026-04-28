import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './i18n/en.json';
import fr from './i18n/fr.json';
import de from './i18n/de.json';
import es from './i18n/es.json';
import it from './i18n/it.json';
import dev from './i18n/dev.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    de: { translation: de },
    es: { translation: es },
    it: { translation: it },
    dev: { translation: dev },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
