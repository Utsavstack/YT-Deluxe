import { useState, useEffect } from 'react';
import YTDeluxeAPI from '../utils/api';
import { YTDeluxeStorage } from '../utils/storage';

const UPDATE_NOTIFY_KEY = 'ytdeluxe_update_notify';
const UPDATE_MUTED_KEY = 'ytdeluxe_update_muted_version';
const INSTALLED_VER_KEY = 'ytdeluxe_installed_version';
const UNSEEN_UPDATE_KEY = 'ytdeluxe_unseen_update_version';

export function useUpdateCheck() {
  const [hasUnseenUpdate, setHasUnseenUpdate] = useState(false);
  const [updateData, setUpdateData] = useState(null);

  useEffect(() => {
    let mounted = true;

    const checkUpdate = async () => {
      const notifyEnabled = localStorage.getItem(UPDATE_NOTIFY_KEY) !== '0';
      if (!notifyEnabled) return;

      const installedVer = localStorage.getItem(INSTALLED_VER_KEY) || 'v1.0.0-beta';
      const result = await YTDeluxeAPI.checkForUpdateOnce(installedVer);
      if (!result || !mounted) return;

      const mutedVersion = localStorage.getItem(UPDATE_MUTED_KEY) || '';
      const isMuted = YTDeluxeAPI.normalizeVersion(mutedVersion) === YTDeluxeAPI.normalizeVersion(result.version);

      if (result.hasUpdate && !isMuted) {
        setUpdateData(result);
        // Check if user has already seen this specific version by opening the Updates tab
        const seenData = await YTDeluxeStorage.getItem(UNSEEN_UPDATE_KEY, null);
        if (seenData !== result.version) {
          setHasUnseenUpdate(true);
        } else {
          setHasUnseenUpdate(false);
        }
      } else {
        setHasUnseenUpdate(false);
        setUpdateData(null);
      }
    };

    checkUpdate();

    // Since localStorage/YTDeluxeStorage isn't easily reactive across the whole app,
    // we can listen for a custom event or periodically check if we want,
    // but running it once on mount per component is usually enough since
    // the updates page will mark it seen and state updates on refresh.
    // However, to make the dot disappear instantly when the Settings tab is clicked,
    // we'll listen for a custom event dispatched by ChangelogAndFaq.
    const handleUpdateSeen = (e) => {
      if (mounted) {
        setHasUnseenUpdate(false);
      }
    };
    
    window.addEventListener('ytdeluxe_update_seen', handleUpdateSeen);
    
    return () => {
      mounted = false;
      window.removeEventListener('ytdeluxe_update_seen', handleUpdateSeen);
    };
  }, []);

  return { hasUnseenUpdate, updateData };
}
