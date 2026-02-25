import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SearchBar = ({ onSearch, onVoiceSearch, recentSearches, onClearRecentSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

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
    // Simulate clipboard detection
    const handlePaste = async () => {
      try {
        const text = await navigator.clipboard?.readText();
        if (text?.includes('youtube.com') || text?.includes('youtu.be')) {
          setSearchQuery(text);
        }
      } catch (err) {
        // Clipboard access denied or not supported
      }
    };

    // Check clipboard on focus
    const handleFocus = () => {
      handlePaste();
    };

    const searchInput = searchRef?.current?.querySelector('input');
    if (searchInput) {
      searchInput?.addEventListener('focus', handleFocus);
      return () => searchInput?.removeEventListener('focus', handleFocus);
    }
  }, []);

  const handleInputChange = (e) => {
    const value = e?.target?.value;
    setSearchQuery(value);

    if (value?.trim()) {
      // Filter suggestions based on input
      const filtered = mockSuggestions?.filter(suggestion =>
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

      // Add to recent searches
      const recent = JSON.parse(localStorage.getItem('ytdeluxe_recent_searches') || '[]');
      const updatedRecent = [query?.trim(), ...recent?.filter(item => item !== query?.trim())]?.slice(0, 10);
      localStorage.setItem('ytdeluxe_recent_searches', JSON.stringify(updatedRecent));
    }
  };

  const handleKeyPress = (e) => {
    if (e?.key === 'Enter') {
      handleSearch();
    }
  };

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        setSearchQuery(transcript);
        handleSearch(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition?.start();
    } else {
      onVoiceSearch?.();
    }
  };

  const isYouTubeUrl = (url) => {
    return url?.includes('youtube.com') || url?.includes('youtu.be');
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Main Search Bar */}
      <div ref={searchRef} className="relative">
        <div className="glass-card shadow-glass-lg">
          <div className="flex items-center p-2 sm:p-4">
            <div className="flex-1 flex items-center border border-muted-foreground/30 rounded-[40px] px-3 sm:px-4 py-1 sm:py-1.5 mr-1 sm:mr-3 focus-within:ring-2 focus-within:ring-primary/50 transition-all bg-transparent text-foreground">
              <Icon name="Search" size={18} className="text-muted-foreground mr-2 sm:mr-3 flex-shrink-0" />

              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Search videos or paste YouTube URL..."
                className="flex-1 bg-transparent text-foreground placeholder-muted-foreground outline-none text-sm sm:text-base min-w-0 py-1 border-none focus:ring-0"
              />

              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 sm:w-8 sm:h-8 ml-1 sm:ml-2 flex-shrink-0 rounded-full"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                >
                  <Icon name="X" size={14} />
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className={`w-8 h-8 mr-1 sm:mr-2 flex-shrink-0 ${isListening ? 'text-error animate-pulse' : 'text-muted-foreground'}`}
              onClick={handleVoiceSearch}
              disabled={isListening}
            >
              <Icon name="Mic" size={18} />
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => handleSearch()}
              disabled={!searchQuery?.trim()}
              className="flex-shrink-0 rounded-[40px] px-3 sm:px-6 text-sm"
            >
              <span className="hidden sm:inline">{isYouTubeUrl(searchQuery) ? 'Download' : 'Search'}</span>
              <span className="sm:hidden">{isYouTubeUrl(searchQuery) ? 'Get' : 'Go'}</span>
            </Button>
          </div>
        </div>
      </div>
      {/* Auto-suggestions Dropdown */}
      {showSuggestions && suggestions?.length > 0 && (
        <div ref={suggestionsRef} className="absolute top-full left-0 right-0 mt-2 glass-card shadow-glass-lg z-50 animate-slide-down">
          <div className="p-2">
            <div className="text-xs text-muted-foreground px-3 py-2 font-medium">Suggestions</div>
            {suggestions?.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSearch(suggestion)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm text-foreground flex items-center space-x-2"
              >
                <Icon name="Search" size={14} className="text-muted-foreground flex-shrink-0" />
                <span className="truncate">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Recent Searches */}
      {recentSearches?.length > 0 && !showSuggestions && !searchQuery && (
        <div className="mt-4">
          <div className="text-sm text-muted-foreground mb-2 font-medium">Recent Searches</div>
          <div className="flex flex-wrap gap-2">
            {recentSearches?.slice(0, 6)?.map((search, index) => (
              <div
                key={index}
                className="glass-card px-3 py-1.5 text-sm text-foreground flex items-center space-x-2 group"
              >
                <button
                  onClick={() => handleSearch(search)}
                  className="truncate max-w-32 hover:text-primary transition-colors"
                >
                  {search}
                </button>
                <button
                  onClick={() => onClearRecentSearch(search)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Icon name="X" size={12} className="text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Voice Search Indicator */}
      {isListening && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-card shadow-glass-lg p-4 text-center animate-slide-down">
          <div className="flex items-center justify-center space-x-2 text-error">
            <div className="w-2 h-2 bg-error rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Listening...</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Speak now to search</p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;