import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UpdateCheckResult, UpdateProgress } from '@/types/update';
import { updateService } from '@/services/updateService';

interface UpdateNotificationProps {
  className?: string;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ className }) => {
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Check for updates when app starts
    checkForUpdates();

    // Register Electron update event listeners
    if (window.electronAPI && 'onUpdateStatus' in window.electronAPI) {
      (window.electronAPI as any).onUpdateStatus((data: any) => {
        console.log('Update status:', data);
        if (data.status === 'downloading') {
          setIsDownloading(true);
        } else if (data.status === 'downloaded') {
          setIsDownloading(false);
        }
      });

      (window.electronAPI as any).onUpdateProgress((data: any) => {
        console.log('Update progress:', data);
        setUpdateProgress(data);
        if (data.status === 'downloading') {
          setIsDownloading(true);
        }
      });
    }

    // Start automatic update checking
    updateService.startAutoUpdateCheck();

    return () => {
      updateService.stopAutoUpdateCheck();
    };
  }, []);

  const checkForUpdates = async () => {
    setIsChecking(true);
    try {
      const result = await updateService.manualUpdateCheck();
      setUpdateResult(result);
      
      // Show force update dialog if update is required and forced
      if (result.forceUpdate || !result.isSupported) {
        showForceUpdateDialog(result);
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const showForceUpdateDialog = (updateResult: UpdateCheckResult) => {
    if (window.electronAPI && 'updateAvailable' in window.electronAPI) {
      (window.electronAPI as any).updateAvailable(updateResult);
    }
  };

  const handleManualUpdate = async () => {
    if (!updateResult?.downloadUrl) return;

    try {
      setIsDownloading(true);
      
      if (window.electronAPI && 'downloadUpdate' in window.electronAPI) {
        await (window.electronAPI as any).downloadUpdate();
      }
    } catch (error) {
      console.error('Failed to start update download:', error);
      setIsDownloading(false);
    }
  };

  const handleInstallUpdate = async () => {
    if (window.electronAPI && 'installUpdate' in window.electronAPI) {
      await (window.electronAPI as any).installUpdate();
    }
  };

  if (!updateResult || (!updateResult.hasUpdate && updateResult.isSupported)) {
    return null;
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-900">
            {updateResult.forceUpdate ? 'Force Update Required' : 'Update Available'}
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            Current Version: {updateResult.currentVersion} → Latest Version: {updateResult.latestVersion}
          </p>
          {updateResult.updateNotes && (
            <p className="text-xs text-blue-600 mt-1">
              {updateResult.updateNotes}
            </p>
          )}
          {!updateResult.isSupported && (
            <p className="text-xs text-red-600 mt-1 font-medium">
              ⚠️ Current version is no longer supported.
            </p>
          )}
        </div>
        
        <div className="ml-4 flex flex-col gap-2">
          {!isDownloading && (
            <Button
              size="sm"
              onClick={handleManualUpdate}
              disabled={isChecking}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isChecking ? 'Checking...' : 'Update'}
            </Button>
          )}
          
          {updateProgress && updateProgress.status === 'downloaded' && (
            <Button
              size="sm"
              onClick={handleInstallUpdate}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Restart & Install
            </Button>
          )}
        </div>
      </div>

      {/* Download progress display */}
      {isDownloading && updateProgress && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-blue-600 mb-1">
            <span>{updateProgress.message}</span>
            <span>{Math.round(updateProgress.progress)}%</span>
          </div>
          <Progress value={updateProgress.progress} className="h-2" />
          {updateProgress.speed > 0 && (
            <p className="text-xs text-blue-500 mt-1">
              Speed: {(updateProgress.speed / 1024 / 1024).toFixed(1)} MB/s
              {updateProgress.eta > 0 && ` • ETA: ${Math.ceil(updateProgress.eta / 60)}min`}
            </p>
          )}
        </div>
      )}

      {/* Manual update check button */}
      <div className="mt-3 pt-3 border-t border-blue-200">
        <Button
          variant="outline"
          size="sm"
          onClick={checkForUpdates}
          disabled={isChecking}
          className="text-blue-600 border-blue-300 hover:bg-blue-50"
        >
          {isChecking ? 'Checking...' : 'Check Manually'}
        </Button>
      </div>
    </div>
  );
};
