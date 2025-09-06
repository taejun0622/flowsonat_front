import React from 'react';
import { Users, Clock, CheckCircle, XCircle, UserPlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { InstagramService } from '@/api/services/InstagramService';
import { 
  BenchmarkResponse, 
  TargetResponse, 
  TargetListResponse,
  StageEnum,
  StatusEnum 
} from '@/api';

interface BenchmarkTargetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  benchmark: BenchmarkResponse | null;
}

export const BenchmarkTargetsModal: React.FC<BenchmarkTargetsModalProps> = ({
  isOpen,
  onClose,
  benchmark
}) => {
  const [targets, setTargets] = React.useState<TargetResponse[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [deletingTargetId, setDeletingTargetId] = React.useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [targetToDelete, setTargetToDelete] = React.useState<TargetResponse | null>(null);

  const { toast } = useToast();

  // Load targets when modal opens
  React.useEffect(() => {
    if (isOpen && benchmark) {
      loadTargets();
    }
  }, [isOpen, benchmark]);

  const loadTargets = async () => {
    if (!benchmark) return;

    try {
      setLoading(true);
      setError(null);
      
      const response: TargetListResponse = await InstagramService.getTargetsApiV1InstagramBenchmarksBenchmarkIdTargetsGet(
        benchmark.id
      );
      
      setTargets(response.targets || []);
    } catch (error) {
      console.error('Failed to load targets:', error);
      setError('Failed to load targets');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirm = (target: TargetResponse) => {
    setTargetToDelete(target);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setTargetToDelete(null);
  };

  const handleDeleteTarget = async () => {
    if (!targetToDelete) return;

    try {
      setDeletingTargetId(targetToDelete.id);
      
      await InstagramService.deleteTargetApiV1InstagramTargetsTargetIdDelete(targetToDelete.id);
      
      toast({
        title: "Success",
        description: `Target @${targetToDelete.ig.username} deleted successfully`,
      });
      
      // Remove the deleted target from the list
      setTargets(prevTargets => prevTargets.filter(target => target.id !== targetToDelete.id));
      
      closeDeleteConfirm();
    } catch (error) {
      console.error('Failed to delete target:', error);
      toast({
        title: "Error",
        description: "Failed to delete target",
        variant: "destructive",
      });
    } finally {
      setDeletingTargetId(null);
    }
  };

  // Group targets by stage
  const groupedTargets = React.useMemo(() => {
    return targets.reduce((groups: Record<StageEnum, TargetResponse[]>, target: TargetResponse) => {
      const stage = target.stage || StageEnum.PENDING;
      if (!groups[stage]) {
        groups[stage] = [];
      }
      groups[stage].push(target);
      return groups;
    }, {} as Record<StageEnum, TargetResponse[]>);
  }, [targets]);

  const getStageIcon = (stage: StageEnum) => {
    switch (stage) {
      case StageEnum.PENDING:
        return <Clock className="h-4 w-4" />;
      case StageEnum.REQUESTED:
        return <UserPlus className="h-4 w-4" />;
      case StageEnum.FOLLOW_BACK:
        return <CheckCircle className="h-4 w-4" />;
      case StageEnum.UNFOLLOWED:
        return <XCircle className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getStageColor = (stage: StageEnum) => {
    switch (stage) {
      case StageEnum.PENDING:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case StageEnum.REQUESTED:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case StageEnum.FOLLOW_BACK:
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case StageEnum.UNFOLLOWED:
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStageLabel = (stage: StageEnum) => {
    switch (stage) {
      case StageEnum.PENDING:
        return 'Pending';
      case StageEnum.REQUESTED:
        return 'Requested';
      case StageEnum.FOLLOW_BACK:
        return 'Follow Back';
      case StageEnum.UNFOLLOWED:
        return 'Unfollowed';
      default:
        return stage;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  if (!benchmark) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/20 backdrop-blur-md border-black/30 text-white shadow-2xl w-[calc(100vw-2rem)] max-w-4xl min-w-[320px] max-h-[80vh] overflow-hidden left-[50%] translate-x-[-50%]">
        <DialogHeader className="text-left">
          <DialogTitle className="text-white text-xl">
            Targets for @{benchmark.ig.username}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            View all targets associated with this benchmark, organized by stage
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="ml-3 text-white">Loading targets...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
              <p className="text-red-400 mb-2">Error loading targets</p>
              <p className="text-gray-400 text-sm">{error}</p>
              <Button
                onClick={loadTargets}
                className="mt-4 bg-white text-gray-900 hover:bg-gray-100"
              >
                Try Again
              </Button>
            </div>
          ) : targets.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-300">No targets found</p>
              <p className="text-gray-400 text-sm">This benchmark doesn't have any targets yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-black/10 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{targets.length}</div>
                  <div className="text-sm text-gray-400">Total Targets</div>
                </div>
                {Object.entries(groupedTargets).map(([stage, stageTargets]) => (
                  <div key={stage} className="text-center">
                    <div className="text-2xl font-bold text-white">{stageTargets.length}</div>
                    <div className="text-sm text-gray-400">{getStageLabel(stage as StageEnum)}</div>
                  </div>
                ))}
              </div>

              {/* Targets by Stage */}
              {Object.entries(groupedTargets).map(([stage, stageTargets]) => (
                <div key={stage} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {getStageIcon(stage as StageEnum)}
                    <h3 className="text-lg font-semibold text-white">
                      {getStageLabel(stage as StageEnum)}
                    </h3>
                    <Badge className={getStageColor(stage as StageEnum)}>
                      {stageTargets.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {stageTargets.map((target, index) => (
                      <div
                        key={target.id}
                        className={`p-3 bg-black/5 hover:bg-black/10 transition-colors rounded-lg ${
                          index !== stageTargets.length - 1 ? 'border-b border-black/20' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="flex-1">
                                <h4 className="text-white font-medium">
                                  @{target.ig.username}
                                </h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-400">
                                  <span>Created: {formatDate(target.created_at)}</span>
                                  {target.updated_at && (
                                    <span>Updated: {formatDate(target.updated_at)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDeleteConfirm(target)}
                              disabled={deletingTargetId === target.id}
                              className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                            >
                              {deletingTargetId === target.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={closeDeleteConfirm}>
        <DialogContent className="bg-black/20 backdrop-blur-md border-black/30 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Target</DialogTitle>
            <DialogDescription className="text-gray-300">
              Are you sure you want to delete the target @{targetToDelete?.ig.username}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={closeDeleteConfirm}
              className="border-black/30 text-white hover:bg-black/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteTarget}
              disabled={deletingTargetId === targetToDelete?.id}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingTargetId === targetToDelete?.id ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
