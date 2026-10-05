import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { LanguageContext, type Language, type LanguageContextValue } from './languageContextDef';

export type { Language, LanguageContextValue };

// Inline translations (kept minimal for Phase 1; expanded in later phases)
const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.inventory':   'Inventory',
    'nav.suggestions': 'Suggestions',
    'nav.teardown':    'Teardown',
    'nav.community':   'Community',
    'nav.dashboard':   'Dashboard',
    'nav.profile':     'Profile',
    'nav.login':       'Login',
    'nav.logout':      'Logout',
    'nav.signup':      'Sign Up',

    'landing.hero.title':    'Give Old Tech a New Purpose',
    'landing.hero.subtitle': 'Log your unused electronics, discover reuse projects, and track the e-waste you divert from landfill.',
    'landing.hero.cta1':     'Start building',
    'landing.hero.cta2':     'Browse projects',

    'inventory.title':       'My Inventory',
    'inventory.add':         'Add component',
    'inventory.empty':       'Your inventory is empty. Add components to get started.',

    'suggestions.title':     'Project Suggestions',
    'suggestions.empty':     'Add components to your inventory to see project suggestions.',

    'teardown.title':        'Teardown Guide',
    'auth.login':            'Log in',
    'auth.signup':           'Create account',
    'auth.email':            'Email address',
    'auth.password':         'Password',
    'auth.displayName':      'Display name',
    'auth.forgot':           'Forgot password?',
    'auth.noAccount':        'Don\'t have an account?',
    'auth.hasAccount':       'Already have an account?',

    'impact.title':          'Impact Dashboard',
    'impact.diverted':       'E-waste Diverted',
    'impact.projects':       'Projects Feasible',
    'impact.co2':            'CO₂ Avoided',

    'class.A': 'Fully Working',
    'class.B': 'Partly Working',
    'class.C': 'Repairable Fault',
    'class.D': 'Salvage Only',
    'class.E': 'Unsafe – Recycle Only',

    'difficulty.easy':   'Easy',
    'difficulty.medium': 'Medium',
    'difficulty.hard':   'Hard',

    'category.educational': 'Educational',
    'category.creative':    'Creative',
    'category.practical':   'Practical',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language: Language = 'en';

  function setLanguage(_lang: Language) {
    // No-op preserved for type safety
    document.documentElement.lang = 'en';
  }

  useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

  function t(key: string): string {
    return translations.en[key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

