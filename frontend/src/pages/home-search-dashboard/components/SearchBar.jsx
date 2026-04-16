import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import './SearchBar.css';

const isYouTubeUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

const SearchBar = ({ onSearch, onVoiceSearch, recentSearches, onClearRecentSearch, isSticky = false }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [clipboardLink, setClipboardLink] = useState('');

  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);
  const recognitionRef = useRef(null);

  // Mock auto-suggestions
  const mockSuggestions = [
    "React tutorial for beginners",
    "JavaScript ES6 features",
    "CSS Grid layout guide",
    "Node.js crash course",
    "Python data science",
    "Machine learning basics",
    "Web development 2024",
    "TypeScript fundamentals"
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef?.current &&
        !searchRef?.current?.contains(event.target) &&
        suggestionsRef?.current &&
        !suggestionsRef?.current?.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const text = await navigator.clipboard?.readText();
        if (isYouTubeUrl(text)) {
          setClipboardLink(text);
        } else {
          setClipboardLink('');
        }
      } catch (err) {
        // Clipboard access denied or not supported
      }
    };

    // Check initially
    checkClipboard();

    // Check when window gets focus
    const handleFocus = () => {
      checkClipboard();
    };

    // Check when something is copied inside the app
    const handleCopy = () => {
      // Small delay to allow clipboard to update
      setTimeout(checkClipboard, 100);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('copy', handleCopy);
    
    // Also check periodically in case of background updates
    const intervalId = setInterval(checkClipboard, 1000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('copy', handleCopy);
      clearInterval(intervalId);
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e?.target?.value;
    setSearchQuery(value);

    if (value?.trim()) {
      const filtered = mockSuggestions?.filter((suggestion) =>
        suggestion?.toLowerCase()?.includes(value?.toLowerCase())
      );
      setSuggestions(filtered?.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearch = (query = searchQuery) => {
    if (query?.trim()) {
      onSearch(query?.trim());
      setShowSuggestions(false);

      const recent = JSON.parse(localStorage.getItem('ytdeluxe_recent_searches') || '[]');
      const updatedRecent = [query?.trim(), ...recent?.filter((item) => item !== query?.trim())]?.slice(0, 10);
      localStorage.setItem('ytdeluxe_recent_searches', JSON.stringify(updatedRecent));
    }
  };

  const handleKeyPress = (e) => {
    if (e?.key === 'Enter') {
      handleSearch();
    }
  };

  const typeTextAndSearch = (text, autoSearch = false) => {
    setSearchQuery('');
    let i = 0;
    const interval = setInterval(() => {
      setSearchQuery(text.substring(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        if (autoSearch) {
          setTimeout(() => handleSearch(text), 300);
        }
      }
    }, 20);
  };

  const handleVoiceSearch = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => { setIsListening(true); };

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          typeTextAndSearch(transcript, true);
        }
      };

      recognition.onerror = () => { setIsListening(false); };
      recognition.onend = () => { setIsListening(false); };

      recognition?.start();
    } else {
      onVoiceSearch?.();
    }
  };

  return (
    <div className={`search-bar-wrapper ${isSticky ? 'is-sticky' : ''}`}>
      {/* Main Search Bar */}
      <div ref={searchRef} className="relative z-10 w-full max-w-2xl mx-auto">
        <div className="search-theme-container">
          <div className="search-inner-container">
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={t("homeSearchDashboard.searchVideosOrPaste")}
              className="search-input-field"
            />

            <div className="flex items-center">
              {/* Clear Button */}
              {searchQuery && (
                <button
                  className="search-action-btn"
                  title="Clear"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}>
                  <Icon name="X" size={18} />
                </button>
              )}

              {/* Paste from Clipboard */}
              {!searchQuery && clipboardLink && (
                <button
                  className="search-action-btn animate-pop-in text-primary"
                  title="Paste copied link"
                  onClick={() => {
                    typeTextAndSearch(clipboardLink, false);
                    setClipboardLink('');
                  }}>
                  <Icon name="ClipboardPaste" size={18} />
                </button>
              )}

              {/* Voice Search / Mic Button */}
              <button
                className={`search-action-btn ${isListening ? 'mic-listening text-error' : ''}`}
                title={isListening ? "Stop listening" : "Voice search"}
                onClick={handleVoiceSearch}
              >
                <Icon name={isListening ? "Square" : "Mic"} size={18} />
              </button>

              {/* Search Submit Icon */}
              <div
                className="search__icon-custom"
                onClick={() => handleSearch()}
                title="Search"
              >
                <svg viewBox="0 0 24 24">
                  <g>
                    <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-suggestions Dropdown — hidden for now, will implement later */}
        {false && showSuggestions && suggestions?.length > 0 && (
          <div ref={suggestionsRef} className="search-suggestions-container animate-slide-down">
            <div className="text-xs text-muted-foreground px-3 py-2 font-medium uppercase tracking-wider">
              {t("homeSearchDashboard.suggestions")}
            </div>
            {suggestions?.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSearch(suggestion)}
                className="search-suggestion-item">
                <Icon name="Search" size={16} className="suggestion-icon" />
                <span className="truncate">{suggestion}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Searches — hidden when sticky */}
      <div
        className="recent-searches-section"
        style={{
          maxHeight: isSticky ? '0px' : '200px',
          opacity: isSticky ? 0 : 1,
          pointerEvents: isSticky ? 'none' : 'auto',
          overflow: 'hidden',
          transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
        }}
      >
        {recentSearches?.length > 0 && !showSuggestions && !searchQuery && (
          <div className="mt-8 flex flex-col items-center">
            <div className="text-sm text-foreground/70 mb-3 font-medium bg-card/40 backdrop-blur-md px-4 py-1 rounded-full border border-border/50 animate-stagger-item">
              {t("homeSearchDashboard.recentSearches")}
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
              {recentSearches?.slice(0, 6)?.map((search, index) => (
                <div
                  key={index}
                  className="glass-card shadow-glass-md px-4 py-2 text-sm text-foreground flex items-center space-x-1 group recent-search-hover rounded-full cursor-pointer animate-stagger-item border border-transparent"
                  style={{ animationDelay: `${index * 50 + 100}ms` }}
                  onClick={(e) => {
                    if (e.target.closest('button')) return;
                    handleSearch(search);
                  }}>
                  <Icon name="Clock" size={12} className="text-muted-foreground/50 mr-1" />
                  <span className="truncate max-w-32 hover:text-primary transition-colors">
                    {search}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onClearRecentSearch(search); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 bg-muted/40 rounded-full p-1 hover:bg-destructive/10 hover:text-destructive">
                    <Icon name="X" size={12} className="text-muted-foreground hover:text-destructive transition-colors" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voice Search Indicator */}
        {isListening && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-12 glass-card shadow-glass-xl p-4 rounded-xl text-center animate-slide-down flex flex-col items-center min-w-[250px] border border-primary/20">
            <div className="flex items-center space-x-2 text-error mb-2">
              <div className="w-3 h-3 bg-error rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.7)]" />
              <span className="font-semibold">{t("homeSearchDashboard.listening")}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t("homeSearchDashboard.speakNowToSearch")}</p>
            <div className="flex gap-1 mt-3">
              {[0, 150, 300, 450, 600].map((delay, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full bg-error animate-bounce ${['h-3', 'h-4', 'h-5', 'h-4', 'h-3'][i]} ${['opacity-40', 'opacity-60', 'opacity-100', 'opacity-60', 'opacity-40'][i]}`}
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;