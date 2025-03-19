import { Button } from "@/components/ui/button";
import { Database, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cacheService } from "@/services/cacheService";

interface CacheManagerProps {
  onCacheCleared?: () => void;
}

export const CacheManager = ({ onCacheCleared }: CacheManagerProps) => {
  const handleClearCache = async () => {
    await cacheService.clearAll();
    if (onCacheCleared) {
      onCacheCleared();
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Database className="h-4 w-4" />
          Clear Cache
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear Cache?</AlertDialogTitle>
          <AlertDialogDescription>
            This will clear all cached repository data. You'll need to fetch fresh data from GitHub.
            Cache automatically expires after 15 minutes anyway.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleClearCache} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Clear Cache
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};