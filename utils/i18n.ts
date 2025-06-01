import fr from '../i18n/fr.json';
import fon from '../i18n/fon.json';
import { useLanguage } from '../contexts/LanguageContext';

const translations: Record<string, Record<string, any>> = { fr, fon };

function getNested(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Retourne la traduction pour une clé imbriquée et une langue donnée.
 * Fallback en français si la clé n'existe pas en fon.
 */
export function t(key: string, lang: 'fr' | 'fon' = 'fr'): string {
  return (
    getNested(translations[lang], key) ||
    getNested(translations['fr'], key) ||
    key
  );
}

/**
 * Hook personnalisé pour utiliser les traductions avec la langue actuelle
 */
export function useTranslation() {
  const { language } = useLanguage();

  const translate = (key: string, params?: Record<string, string | number>): string => {
    let translation = t(key, language);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        translation = translation.replace(`{${key}}`, String(value));
      });
    }
    
    return translation;
  };

  return { t: translate, language };
}
