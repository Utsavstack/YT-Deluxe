// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// API Service Class
class YTDeluxeAPI {
  // Search videos by keyword
  static async searchVideos(query) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
      const data = await handleResponse(response);
      if (data.results) {
        data.results = data.results.map(video => ({
          ...video,
          channel: typeof video.channel === 'string' || !video.channel ?
            { name: (video.channel || video.uploader || 'Unknown Channel').replace(/^@/, '') } :
            { ...video.channel, name: video.channel.name?.replace(/^@/, '') || 'Unknown Channel' }
        }));
      }
      return data;
    } catch (error) {
      console.error('Search API error:', error);
      throw error;
    }
  }

  // Get video details by URL
  static async getVideoDetails(url) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/video?url=${encodeURIComponent(url)}`);
      const data = await handleResponse(response);
      if (data.video) {
        const rawChannel = data.video.channel;
        data.video.channel = typeof rawChannel === 'string' || !rawChannel ?
          { name: (rawChannel || data.video.uploader || 'Unknown Channel').replace(/^@/, '') } :
          { ...rawChannel, name: rawChannel.name?.replace(/^@/, '') || 'Unknown Channel' };
      }
      return data;
    } catch (error) {
      console.error('Video details API error:', error);
      throw error;
    }
  }

  // Download video with options
  static async downloadVideo(downloadConfig) {
    try {
      const isDesktop = typeof window !== 'undefined' && window.pywebview !== undefined;
      const formData = new FormData();
      formData.append('url', downloadConfig.url);
      formData.append('is_desktop', isDesktop);

      if (downloadConfig.format_id) {
        formData.append('format_id', downloadConfig.format_id);
      }
      if (downloadConfig.quality) {
        formData.append('quality', downloadConfig.quality);
      }
      if (downloadConfig.format) {
        formData.append('format', downloadConfig.format);
      }
      if (downloadConfig.trim_start) {
        formData.append('trim_start', downloadConfig.trim_start);
      }
      if (downloadConfig.trim_end) {
        formData.append('trim_end', downloadConfig.trim_end);
      }
      if (downloadConfig.rename) {
        formData.append('rename', downloadConfig.rename);
      }
      if (downloadConfig.type) {
        formData.append('type', downloadConfig.type);
      }
      if (downloadConfig.channel) {
        formData.append('channel', downloadConfig.channel);
      }
      if (downloadConfig.thumbnail) {
        formData.append('thumbnail', downloadConfig.thumbnail);
      }
      if (downloadConfig.audio_format_id) {
        formData.append('audio_format_id', downloadConfig.audio_format_id);
      }
      if (downloadConfig.container) {
        formData.append('container', downloadConfig.container);
      }
      // Always send convert_to_mp3 (defaults false on backend)
      formData.append('convert_to_mp3', downloadConfig.convert_to_mp3 ? 'true' : 'false');

      const downloadPath = localStorage.getItem('ytdeluxe_download_path');
      if (downloadPath) {
        formData.append('download_path', downloadPath);
      }

      const response = await fetch(`${API_BASE_URL}/api/download`, {
        method: 'POST',
        body: formData,
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('Download API error:', error);
      throw error;
    }
  }

  // Get download progress
  static async getDownloadProgress(taskId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/progress/${taskId}`);
      return await handleResponse(response);
    } catch (error) {
      console.error('Progress API error:', error);
      throw error;
    }
  }

  // Batch download multiple videos
  static async batchDownload(urls, options = {}) {
    try {
      const isDesktop = typeof window !== 'undefined' && window.pywebview !== undefined;
      const formData = new FormData();
      formData.append('is_desktop', isDesktop);

      // Add URLs
      urls.forEach(url => {
        formData.append('urls', url);
      });

      // Add options
      if (options.quality) {
        formData.append('quality', options.quality);
      }
      if (options.format) {
        formData.append('format', options.format);
      }
      const downloadPath = localStorage.getItem('ytdeluxe_download_path');
      if (downloadPath) {
        formData.append('download_path', downloadPath);
      }

      const response = await fetch(`${API_BASE_URL}/api/batch-download`, {
        method: 'POST',
        body: formData,
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('Batch download API error:', error);
      throw error;
    }
  }

  // Get download history
  static async getDownloadHistory() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/history`);
      return await handleResponse(response);
    } catch (error) {
      console.error('History API error:', error);
      throw error;
    }
  }

  // Delete a single history item
  static async deleteHistoryItem(taskId, deleteFile = false) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${taskId}?delete_file=${deleteFile}`, {
        method: 'DELETE'
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Delete history API error:', error);
      throw error;
    }
  }

  // Batch delete history items
  static async batchDeleteHistory(ids, deleteFile = false) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/delete?delete_file=${deleteFile}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Batch delete history API error:', error);
      throw error;
    }
  }

  // Clear all history
  static async clearAllHistory(deleteFile = false) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/all?delete_file=${deleteFile}`, {
        method: 'DELETE'
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Clear all history API error:', error);
      throw error;
    }
  }

  // Get storage info
  static async getStorageInfo(downloadPath = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/system/storage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ download_path: downloadPath })
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Storage API error:', error);
      return null;
    }
  }

  // Submit feedback
  static async submitFeedback(feedback) {
    try {
      const formData = new FormData();
      formData.append('feedback', feedback);

      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        body: formData,
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('Feedback API error:', error);
      throw error;
    }
  }

  // Get legal disclaimer
  static async getLegalDisclaimer() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/legal`);
      return await handleResponse(response);
    } catch (error) {
      console.error('Legal API error:', error);
      throw error;
    }
  }

  // Download a file from the server
  static async downloadFile(filename) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/downloads/${filename}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      console.error('File download API error:', error);
      throw error;
    }
  }

  // Helper function to extract YouTube video ID from URL
  static extractVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  // Helper function to format video duration
  static formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  // Helper function to format file size
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper function to detect YouTube URL
  static isYouTubeUrl(query) {
    return (
      typeof query === 'string' &&
      (query.includes('youtube.com') || query.includes('youtu.be'))
    );
  }

  // Smart search: keyword or direct video URL
  static async smartSearchOrVideo(query) {
    if (this.isYouTubeUrl(query)) {
      // If it's a YouTube URL, get video details
      return this.getVideoDetails(query).then(res => ({ video: res.video }));
    } else {
      // Otherwise, do a keyword search
      return this.searchVideos(query);
    }
  }
}

export default YTDeluxeAPI; 