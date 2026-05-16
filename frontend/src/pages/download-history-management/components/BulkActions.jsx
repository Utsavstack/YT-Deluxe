import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BulkActions = ({
  selectedItems,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkExport,
  onCreateZip,
  totalItems
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);

  const handleBulkAction = async (action, callback) => {
    setIsLoading(true);
    setLoadingAction(action);

    try {
      await callback();
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i))?.toFixed(2)) + ' ' + sizes?.[i];
  };

  const getTotalSize = () => {
    return selectedItems?.reduce((total, item) => total + item?.fileSize, 0);
  };

  return (
    <AnimatePresence>
      {selectedItems?.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-[200] flex justify-center px-4 pointer-events-none">
          <motion.div 
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white/90 dark:bg-black/90 backdrop-blur-2xl border border-primary/20 dark:border-primary/20 rounded-[2rem] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.3)] dark:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto w-full max-w-4xl"
          >
            <div className="p-4 sm:px-6">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                {/* Selection Info */}
                <div className="flex items-center space-x-4 w-full lg:w-auto justify-between lg:justify-start">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                      <Icon name="Check" size={16} className="text-primary-foreground" />
                    </div>
                    <span className="text-base font-black text-foreground">
                      {selectedItems?.length} {t("downloadHistoryManagement.of")} {totalItems} {t("downloadHistoryManagement.selected")} 
                    </span>
                  </div>
                  
                  <div className="text-xs font-bold text-muted-foreground/70 bg-foreground/5 px-2 py-1 rounded-md">
                    {t("downloadHistoryManagement.total")} {formatFileSize(getTotalSize())}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 flex-wrap justify-end">
                  {/* Select All/None */}
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onSelectAll}
                      disabled={selectedItems?.length === totalItems}
                      className="rounded-xl h-10 border-border/50 hover:bg-foreground/5"
                    > {t("downloadHistoryManagement.selectAll")} 
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onDeselectAll}
                      className="rounded-xl h-10 border-border/50 hover:bg-foreground/5"
                    > {t("downloadHistoryManagement.clear")} 
                    </Button>
                  </div>

                  {/* Bulk Actions */}
                  <div className="flex items-center space-x-1 pl-2 border-l border-border/40 ml-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBulkAction('delete', onBulkDelete)}
                      loading={isLoading && loadingAction === 'delete'}
                      iconName="Trash2"
                      iconPosition="left"
                      className="rounded-xl h-10 shadow-lg shadow-red-500/20"
                    >
                      {t("downloadHistoryManagement.delete")} ({selectedItems?.length})
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick Stats - Compact Version */}
              <div className="mt-4 pt-3 border-t border-border/40">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-foreground">
                      {selectedItems?.filter((item) => item?.format === 'mp4')?.length}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("downloadHistoryManagement.mpVideos")}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 px-4 border-l border-border/40">
                    <span className="text-sm font-black text-foreground">
                      {selectedItems?.filter((item) => item?.format === 'mp3')?.length}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("downloadHistoryManagement.mpAudio")}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 px-4 border-l border-border/40">
                    <span className="text-sm font-black text-foreground">
                      {selectedItems?.filter((item) => item?.quality === '1080p')?.length}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("downloadHistoryManagement.hdQuality")}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 px-4 border-l border-border/40">
                    <span className="text-sm font-black text-foreground">
                      {new Set(selectedItems.map((item) => item.channel))?.size}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("downloadHistoryManagement.channels")}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BulkActions;