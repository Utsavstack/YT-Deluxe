import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';


const ThemeCustomization = ({ currentTheme, onThemeChange, currentAccentColor, onAccentColorChange }) => {
 const [selectedTheme, setSelectedTheme] = useState(currentTheme);
 const [selectedAccentColor, setSelectedAccentColor] = useState(currentAccentColor);

 const themePresets = [
  {
   id: 'classic',
   name: 'Classic YTD',
   description: 'Traditional YouTube downloader look',
   colors: {
    primary: '#FF0000',
    secondary: '#282828',
    accent: '#FFFFFF'
   },
   preview: 'bg-gradient-to-br from-red-500 to-gray-800'
  },
  {
   id: 'neon',
   name: 'Neon',
   description: 'Vibrant cyberpunk aesthetic',
   colors: {
    primary: '#00FF88',
    secondary: '#FF0080',
    accent: '#00FFFF'
   },
   preview: 'bg-gradient-to-br from-green-400 via-pink-500 to-cyan-400'
  },
  {
   id: 'pastel',
   name: 'Pastel',
   description: 'Soft and gentle colors',
   colors: {
    primary: '#FFB3E6',
    secondary: '#B3E5FF',
    accent: '#E6FFB3'
   },
   preview: 'bg-gradient-to-br from-pink-200 via-blue-200 to-green-200'
  },
  {
   id: 'minimal',
   name: 'Minimal',
   description: 'Clean monochrome design',
   colors: {
    primary: '#000000',
    secondary: '#FFFFFF',
    accent: '#808080'
   },
   preview: 'bg-gradient-to-br from-gray-900 via-gray-500 to-gray-100'
  }
 ];

 const accentColors = [
  { name: 'Blue', value: '#2C5DA9', class: 'bg-blue-600' },
  { name: 'Purple', value: '#7C3AED', class: 'bg-purple-600' },
  { name: 'Green', value: '#059669', class: 'bg-emerald-600' },
  { name: 'Orange', value: '#EA580C', class: 'bg-orange-600' },
  { name: 'Pink', value: '#DB2777', class: 'bg-pink-600' },
  { name: 'Teal', value: '#0D9488', class: 'bg-teal-600' },
  { name: 'Red', value: '#DC2626', class: 'bg-red-600' },
  { name: 'Indigo', value: '#4F46E5', class: 'bg-indigo-600' }
 ];

 const handleThemeSelect = (themeId) => {
  setSelectedTheme(themeId);
  onThemeChange(themeId);
 };

 const handleAccentColorSelect = (color) => {
  setSelectedAccentColor(color);
  onAccentColorChange(color);
 };

 return (
  <div className="space-y-6">
   {/* Dark/Light Mode Toggle */}
   <div className="glass-card p-6">
    <div className="flex items-center justify-between mb-4">
     <div>
      <h3 className="text-lg font-semibold text-foreground">Appearance Mode</h3>
      <p className="text-sm text-muted-foreground">Choose between light and dark themes</p>
     </div>
     <div className="flex items-center space-x-2 glass-nav p-1">
      <button
       onClick={() => handleThemeSelect('light')}
       className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all spring-smooth ${
        selectedTheme === 'light' ?'bg-primary text-primary-foreground shadow-glass-sm' :'text-foreground hover:bg-accent'
       }`}
      >
       <Icon name="Sun" size={16} />
       <span>Light</span>
      </button>
      <button
       onClick={() => handleThemeSelect('dark')}
       className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all spring-smooth ${
        selectedTheme === 'dark' ?'bg-primary text-primary-foreground shadow-glass-sm' :'text-foreground hover:bg-accent'
       }`}
      >
       <Icon name="Moon" size={16} />
       <span>Dark</span>
      </button>
     </div>
    </div>

    {/* Live Preview */}
    <div className="glass rounded-lg p-4 border border-border">
     <div className="flex items-center space-x-3 mb-3">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
       <Icon name="Play" size={16} color="white" />
      </div>
      <div>
       <h4 className="text-sm font-medium text-foreground">YT Deluxe</h4>
       <p className="text-xs text-muted-foreground">Live Preview</p>
      </div>
     </div>
     <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div className="h-full bg-primary rounded-full w-3/4 transition-all duration-300"></div>
     </div>
    </div>
   </div>
   {/* Theme Presets */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">Theme Presets</h3>
     <p className="text-sm text-muted-foreground">Choose from pre-designed color schemes</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
     {themePresets?.map((preset) => (
      <button
       key={preset?.id}
       onClick={() => handleThemeSelect(preset?.id)}
       className={`glass rounded-lg p-4 text-left transition-all spring-smooth hover:shadow-glass-md ${
        selectedTheme === preset?.id ? 'ring-2 ring-primary' : ''
       }`}
      >
       <div className={`w-full h-16 rounded-lg mb-3 ${preset?.preview}`}></div>
       <h4 className="text-sm font-semibold text-foreground">{preset?.name}</h4>
       <p className="text-xs text-muted-foreground">{preset?.description}</p>
      </button>
     ))}
    </div>
   </div>
   {/* Accent Color Picker */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">Accent Color</h3>
     <p className="text-sm text-muted-foreground">Customize the primary accent color</p>
    </div>

    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
     {accentColors?.map((color) => (
      <button
       key={color?.value}
       onClick={() => handleAccentColorSelect(color?.value)}
       className={`w-12 h-12 rounded-lg ${color?.class} transition-all spring-smooth hover:scale-110 ${
        selectedAccentColor === color?.value ? 'ring-2 ring-foreground ring-offset-2' : ''
       }`}
       title={color?.name}
      >
       {selectedAccentColor === color?.value && (
        <Icon name="Check" size={16} color="white" className="mx-auto" />
       )}
      </button>
     ))}
    </div>

    {/* Custom Color Input */}
    <div className="mt-4 pt-4 border-t border-border">
     <label className="block text-sm font-medium text-foreground mb-2">
      Custom Color
     </label>
     <div className="flex items-center space-x-3">
      <input
       type="color"
       value={selectedAccentColor}
       onChange={(e) => handleAccentColorSelect(e?.target?.value)}
       className="w-12 h-10 rounded-lg border border-border cursor-pointer"
      />
      <input
       type="text"
       value={selectedAccentColor}
       onChange={(e) => handleAccentColorSelect(e?.target?.value)}
       className="flex-1 px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
       placeholder="#2C5DA9"
      />
     </div>
    </div>
   </div>
  </div>
 );
};

export default ThemeCustomization;