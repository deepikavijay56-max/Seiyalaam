import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ta';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

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
  ta: {
    'nav.inventory':   'சேமிப்பு',
    'nav.suggestions': 'பரிந்துரைகள்',
    'nav.teardown':    'பிரிக்கும் வழிகாட்டி',
    'nav.community':   'சமூகம்',
    'nav.dashboard':   'டாஷ்போர்டு',
    'nav.profile':     'சுயவிவரம்',
    'nav.login':       'உள்நுழைக',
    'nav.logout':      'வெளியேறு',
    'nav.signup':      'பதிவு செய்க',

    'landing.hero.title':    'பழைய தொழில்நுட்பத்திற்கு புதிய நோக்கம்',
    'landing.hero.subtitle': 'உங்கள் பழைய மின்னணுவியல் பொருட்களை பட்டியலிட்டு, மறுபயன்பாட்டு திட்டங்களை கண்டறியுங்கள்.',
    'landing.hero.cta1':     'தொடங்குங்கள்',
    'landing.hero.cta2':     'திட்டங்களை காணுங்கள்',

    'inventory.title':       'என் சேமிப்பு',
    'inventory.add':         'கூறு சேர்க்க',
    'inventory.empty':       'உங்கள் சேமிப்பு காலியாக உள்ளது.',

    'suggestions.title':     'திட்ட பரிந்துரைகள்',
    'suggestions.empty':     'பரிந்துரைகளைக் காண கூறுகளை சேர்க்கவும்.',

    'teardown.title':        'பிரிக்கும் வழிகாட்டி',
    'auth.login':            'உள்நுழைக',
    'auth.signup':           'கணக்கு உருவாக்கு',
    'auth.email':            'மின்னஞ்சல் முகவரி',
    'auth.password':         'கடவுச்சொல்',
    'auth.displayName':      'காட்சி பெயர்',
    'auth.forgot':           'கடவுச்சொல் மறந்தீர்களா?',
    'auth.noAccount':        'கணக்கு இல்லையா?',
    'auth.hasAccount':       'ஏற்கனவே கணக்கு உள்ளதா?',

    'impact.title':          'தாக்க டாஷ்போர்டு',
    'impact.diverted':       'திசைதிருப்பிய மின்கழிவு',
    'impact.projects':       'சாத்தியமான திட்டங்கள்',
    'impact.co2':            'தவிர்க்கப்பட்ட CO₂',

    'class.A': 'முழுமையாக வேலை செய்கிறது',
    'class.B': 'பகுதியாக வேலை செய்கிறது',
    'class.C': 'சரிசெய்யக்கூடிய குறைபாடு',
    'class.D': 'பாகங்களுக்கு மட்டும்',
    'class.E': 'பாதுகாப்பற்றது – மறுசுழற்சி மட்டும்',

    'difficulty.easy':   'எளிய',
    'difficulty.medium': 'நடுத்தர',
    'difficulty.hard':   'கடினம்',

    'category.educational': 'கல்வி',
    'category.creative':    'படைப்பு',
    'category.practical':   'நடைமுறை',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('seiyalaam-lang') as Language) ?? 'en';
  });

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    localStorage.setItem('seiyalaam-lang', lang);
    document.documentElement.lang = lang;
  }

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  function t(key: string): string {
    return translations[language][key] ?? translations['en'][key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
