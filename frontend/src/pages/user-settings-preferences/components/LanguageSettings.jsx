import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const LanguageSettings = ({ currentLanguage, onLanguageChange, settings, onSettingsChange }) => {
 const [languageSettings, setLanguageSettings] = useState(settings);

 const languages = [
  { 
   value: 'en', 
   label: 'English', 
   nativeName: 'English',
   flag: '',
   description: 'Default language'
  },
  { 
   value: 'es', 
   label: 'Spanish', 
   nativeName: 'Español',
   flag: '',
   description: 'Spanish language support'
  },
  { 
   value: 'fr', 
   label: 'French', 
   nativeName: 'Français',
   flag: '',
   description: 'French language support'
  },
  { 
   value: 'de', 
   label: 'German', 
   nativeName: 'Deutsch',
   flag: '',
   description: 'German language support'
  },
  { 
   value: 'it', 
   label: 'Italian', 
   nativeName: 'Italiano',
   flag: '',
   description: 'Italian language support'
  },
  { 
   value: 'pt', 
   label: 'Portuguese', 
   nativeName: 'Português',
   flag: '',
   description: 'Portuguese language support'
  },
  { 
   value: 'ru', 
   label: 'Russian', 
   nativeName: 'Русский',
   flag: '',
   description: 'Russian language support'
  },
  { 
   value: 'ja', 
   label: 'Japanese', 
   nativeName: '日本語',
   flag: '',
   description: 'Japanese language support'
  },
  { 
   value: 'ko', 
   label: 'Korean', 
   nativeName: '한국어',
   flag: '',
   description: 'Korean language support'
  },
  { 
   value: 'zh', 
   label: 'Chinese', 
   nativeName: '中文',
   flag: '',
   description: 'Chinese language support'
  },
  { 
   value: 'ar', 
   label: 'Arabic', 
   nativeName: 'العربية',
   flag: '',
   description: 'Arabic language support'
  },
  { 
   value: 'hi', 
   label: 'Hindi', 
   nativeName: 'हिन्दी',
   flag: '',
   description: 'Hindi language support'
  }
 ];

 const dateFormatOptions = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', description: 'US format' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', description: 'European format' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', description: 'ISO format' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY', description: 'Long format' }
 ];

 const timeFormatOptions = [
  { value: '12h', label: '12-hour (AM/PM)', description: '3:30 PM' },
  { value: '24h', label: '24-hour', description: '15:30' }
 ];

 const numberFormatOptions = [
  { value: 'en-US', label: '1,234.56', description: 'US format' },
  { value: 'de-DE', label: '1.234,56', description: 'German format' },
  { value: 'fr-FR', label: '1 234,56', description: 'French format' },
  { value: 'en-IN', label: '1,23,456.78', description: 'Indian format' }
 ];

 const handleLanguageChange = (languageCode) => {
  onLanguageChange(languageCode);
  // Save to localStorage
  localStorage.setItem('ytdeluxe_language', languageCode);
 };

 const handleSettingChange = (key, value) => {
  const updated = { ...languageSettings, [key]: value };
  setLanguageSettings(updated);
  onSettingsChange(updated);
 };

 const getCurrentLanguage = () => {
  return languages?.find(lang => lang?.value === currentLanguage) || languages?.[0];
 };

 return (
  <div className="space-y-6">
   {/* Language Selection */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">Interface Language</h3>
     <p className="text-sm text-muted-foreground">Choose your preferred language for the application</p>
    </div>

    {/* Current Language Display */}
    <div className="mb-4 p-4 glass rounded-lg border border-border">
     <div className="flex items-center space-x-3">
      <span className="text-2xl">{getCurrentLanguage()?.flag}</span>
      <div>
       <h4 className="text-sm font-semibold text-foreground">
        {getCurrentLanguage()?.nativeName}
       </h4>
       <p className="text-xs text-muted-foreground">
        {getCurrentLanguage()?.label} - Currently selected
       </p>
      </div>
     </div>
    </div>

    {/* Language Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
     {languages?.map((language) => (
      <button
       key={language?.value}
       onClick={() => handleLanguageChange(language?.value)}
       className={`flex items-center space-x-3 p-3 rounded-lg text-left transition-all spring-smooth ${
        currentLanguage === language?.value
         ? 'bg-primary text-primary-foreground shadow-glass-sm'
         : 'glass hover:shadow-glass-md hover:bg-accent'
       }`}
      >
       <span className="text-lg">{language?.flag}</span>
       <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium truncate">
         {language?.nativeName}
        </h4>
        <p className="text-xs opacity-80 truncate">
         {language?.label}
        </p>
       </div>
       {currentLanguage === language?.value && (
        <Icon name="Check" size={16} />
       )}
      </button>
     ))}
    </div>
   </div>
   {/* Regional Settings */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">Regional Settings</h3>
     <p className="text-sm text-muted-foreground">Customize date, time, and number formats</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     <Select
      label="Date Format"
      description="How dates are displayed"
      options={dateFormatOptions}
      value={languageSettings?.dateFormat}
      onChange={(value) => handleSettingChange('dateFormat', value)}
     />

     <Select
      label="Time Format"
      description="12-hour or 24-hour time"
      options={timeFormatOptions}
      value={languageSettings?.timeFormat}
      onChange={(value) => handleSettingChange('timeFormat', value)}
     />

     <Select
      label="Number Format"
      description="How numbers are formatted"
      options={numberFormatOptions}
      value={languageSettings?.numberFormat}
      onChange={(value) => handleSettingChange('numberFormat', value)}
     />

     <div className="flex items-center space-x-4">
      <Checkbox
       label="Use system locale"
       description="Automatically detect regional settings"
       checked={languageSettings?.useSystemLocale}
       onChange={(e) => handleSettingChange('useSystemLocale', e?.target?.checked)}
      />
     </div>
    </div>
   </div>
   {/* Translation Settings */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">Translation & Content</h3>
     <p className="text-sm text-muted-foreground">Configure content translation preferences</p>
    </div>

    <div className="space-y-4">
     <Checkbox
      label="Auto-translate video titles"
      description="Automatically translate video titles to your language"
      checked={languageSettings?.autoTranslateTitles}
      onChange={(e) => handleSettingChange('autoTranslateTitles', e?.target?.checked)}
     />

     <Checkbox
      label="Auto-translate descriptions"
      description="Automatically translate video descriptions"
      checked={languageSettings?.autoTranslateDescriptions}
      onChange={(e) => handleSettingChange('autoTranslateDescriptions', e?.target?.checked)}
     />

     <Checkbox
      label="Show original text"
      description="Display original text alongside translations"
      checked={languageSettings?.showOriginalText}
      onChange={(e) => handleSettingChange('showOriginalText', e?.target?.checked)}
     />

     <Checkbox
      label="Prefer subtitles in selected language"
      description="Prioritize subtitles in your chosen language"
      checked={languageSettings?.preferSubtitlesInLanguage}
      onChange={(e) => handleSettingChange('preferSubtitlesInLanguage', e?.target?.checked)}
     />
    </div>
   </div>
   {/* Keyboard & Input */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">Keyboard & Input</h3>
     <p className="text-sm text-muted-foreground">Configure input method and keyboard shortcuts</p>
    </div>

    <div className="space-y-4">
     <Checkbox
      label="Enable right-to-left (RTL) layout"
      description="Use RTL layout for Arabic, Hebrew, and other RTL languages"
      checked={languageSettings?.rtlLayout}
      onChange={(e) => handleSettingChange('rtlLayout', e?.target?.checked)}
     />

     <Checkbox
      label="Show keyboard shortcuts in selected language"
      description="Display keyboard shortcuts using your language's key names"
      checked={languageSettings?.localizedShortcuts}
      onChange={(e) => handleSettingChange('localizedShortcuts', e?.target?.checked)}
     />

     <Checkbox
      label="Auto-detect input language"
      description="Automatically switch input methods based on content"
      checked={languageSettings?.autoDetectInput}
      onChange={(e) => handleSettingChange('autoDetectInput', e?.target?.checked)}
     />
    </div>
   </div>
   {/* Language Pack Info */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">Language Pack Information</h3>
     <p className="text-sm text-muted-foreground">Current language pack details and updates</p>
    </div>

    <div className="space-y-3">
     <div className="flex items-center justify-between p-3 glass rounded-lg">
      <div>
       <h4 className="text-sm font-medium text-foreground">
        {getCurrentLanguage()?.nativeName} Language Pack
       </h4>
       <p className="text-xs text-muted-foreground">Version 2.1.0 - Updated Jan 2025</p>
      </div>
      <div className="flex items-center space-x-2">
       <Icon name="CheckCircle" size={16} className="text-success" />
       <span className="text-xs text-success">Up to date</span>
      </div>
     </div>

     <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">Translation completeness</span>
      <div className="flex items-center space-x-2">
       <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-success rounded-full w-11/12"></div>
       </div>
       <span className="text-xs text-muted-foreground">92%</span>
      </div>
     </div>
    </div>
   </div>
  </div>
 );
};

export default LanguageSettings;