import React from 'react';
import { BarChart3, Activity, Plus, Edit, Trash2, Eye, RefreshCw, Lightbulb, ArrowRight, Users, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useInstagram } from '@/contexts/InstagramContext';
import { useNavigate } from 'react-router-dom';

import { InstagramService } from '@/api/services/InstagramService';
import { 
  BenchmarkCreate, 
  BenchmarkResponse, 
  BenchmarkUpdate, 
  BenchmarkListResponse,
  SuggestionResponse,
  SuggestionListResponse,
  HealthEnum,
  StatusEnum 
} from '@/api';

export const BenchmarkTab = () => {
  const navigate = useNavigate();
  const [benchmarks, setBenchmarks] = React.useState<BenchmarkResponse[]>([]);
  const [suggestions, setSuggestions] = React.useState<SuggestionResponse[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = React.useState(false);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [benchmarkToDelete, setBenchmarkToDelete] = React.useState<string | null>(null);
  const [selectedBenchmark, setSelectedBenchmark] = React.useState<BenchmarkResponse | null>(null);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [formData, setFormData] = React.useState({
    ig_username: '',
    status: '' as StatusEnum | ''
  });

  const { toast } = useToast();
  const { instagramAccount, isConnected } = useInstagram();

  // Load data on component mount
  React.useEffect(() => {
    loadBenchmarks();
    loadSuggestions();
  }, []);

  const loadBenchmarks = async () => {
    try {
      setLoading(true);
      const response: BenchmarkListResponse = await InstagramService.getBenchmarksApiV1InstagramBenchmarksGet();
      setBenchmarks(response.benchmarks);
    } catch (error) {
      console.error('Failed to load benchmarks:', error);
      toast({
        title: "Error",
        description: "Failed to load benchmarks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      setSuggestionsLoading(true);
      const response: SuggestionListResponse = await InstagramService.getSuggestionsApiV1InstagramSuggestionsGet();
      setSuggestions(response.suggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to load suggestions",
        variant: "destructive",
      });
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleCreateBenchmark = async () => {
    if (!formData.ig_username.trim()) {
      toast({
        title: "Validation Error",
        description: "Instagram username is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const createData: BenchmarkCreate = {
        ig_username: formData.ig_username.trim()
      };
      
      await InstagramService.createBenchmarkApiV1InstagramBenchmarksPost(createData);
      
      toast({
        title: "Success",
        description: "Benchmark created successfully",
      });
      
      setCreateDialogOpen(false);
      setFormData({ ig_username: '', status: '' });
      loadBenchmarks();
    } catch (error) {
      console.error('Failed to create benchmark:', error);
      toast({
        title: "Error",
        description: "Failed to create benchmark",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBenchmark = async () => {
    if (!selectedBenchmark) return;

    try {
      setLoading(true);
      const updateData: BenchmarkUpdate = {
        health: selectedBenchmark.health // Keep existing health
      };
      
      await InstagramService.updateBenchmarkApiV1InstagramBenchmarksBenchmarkIdPut(
        selectedBenchmark.id,
        updateData
      );
      
      toast({
        title: "Success",
        description: "Benchmark updated successfully",
      });
      
      setEditDialogOpen(false);
      setSelectedBenchmark(null);
      setFormData({ ig_username: '', status: '' });
      loadBenchmarks();
    } catch (error) {
      console.error('Failed to update benchmark:', error);
      toast({
        title: "Error",
        description: "Failed to update benchmark",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBenchmark = async () => {
    if (!benchmarkToDelete) return;

    try {
      setLoading(true);
      await InstagramService.deleteBenchmarkApiV1InstagramBenchmarksBenchmarkIdDelete(benchmarkToDelete);
      
      toast({
        title: "Success",
        description: "Benchmark deleted successfully",
      });
      
      setDeleteDialogOpen(false);
      setBenchmarkToDelete(null);
      loadBenchmarks();
    } catch (error) {
      console.error('Failed to delete benchmark:', error);
      toast({
        title: "Error",
        description: "Failed to delete benchmark",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (benchmarkId: string) => {
    setBenchmarkToDelete(benchmarkId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuggestion = async (suggestionId: string) => {
    if (!confirm('Are you sure you want to delete this suggestion?')) return;

    try {
      setSuggestionsLoading(true);
      await InstagramService.deleteSuggestionApiV1InstagramSuggestionsSuggestionIdDelete(suggestionId);
      
      toast({
        title: "Success",
        description: "Suggestion deleted successfully",
      });
      
      loadSuggestions();
    } catch (error) {
      console.error('Failed to delete suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to delete suggestion",
        variant: "destructive",
      });
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleConvertToBenchmark = async (suggestion: SuggestionResponse) => {
    try {
      setLoading(true);
      const createData: BenchmarkCreate = {
        ig_username: suggestion.ig.username || ''
      };
      
      await InstagramService.createBenchmarkApiV1InstagramBenchmarksPost(createData);
      
      toast({
        title: "Success",
        description: "Suggestion converted to benchmark successfully",
      });
      
      // Delete the suggestion after converting
      await InstagramService.deleteSuggestionApiV1InstagramSuggestionsSuggestionIdDelete(suggestion.id);
      
      loadBenchmarks();
      loadSuggestions();
    } catch (error) {
      console.error('Failed to convert suggestion to benchmark:', error);
      toast({
        title: "Error",
        description: "Failed to convert suggestion to benchmark",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMyFollowingToBenchmark = async () => {
    // Check if Instagram is connected
    if (!isConnected || !instagramAccount?.username) {
      toast({
        title: "Instagram Not Connected",
        description: "Please connect your Instagram account first",
        variant: "destructive",
      });
      return;
    }

    // Open full-screen WebView manager in minimal mode with auto-following collection
    navigate('/webview?minimal=1&autoCollectFollowing=1');
  };

  const openEditDialog = (benchmark: BenchmarkResponse) => {
    setSelectedBenchmark(benchmark);
    setFormData({
      ig_username: benchmark.ig.username || '',
      status: benchmark.status
    });
    setEditDialogOpen(true);
  };

  const getStatusColor = (status: StatusEnum) => {
    switch (status) {
      case StatusEnum.ACTIVE:
        return 'text-green-400';
      case StatusEnum.DELETED:
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getHealthColor = (health?: HealthEnum) => {
    switch (health) {
      case HealthEnum.HEALTHY:
        return 'text-green-400';
      case HealthEnum.UNHEALTHY:
        return 'text-red-400';
      default:
        return 'text-gray-400';
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

  // Group benchmarks by status
  const groupedBenchmarks = benchmarks.reduce((groups: Record<StatusEnum, BenchmarkResponse[]>, benchmark: BenchmarkResponse) => {
    const status = benchmark.status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(benchmark);
    return groups;
  }, {} as Record<StatusEnum, BenchmarkResponse[]>);

  // Group suggestions by status
  const groupedSuggestions = suggestions.reduce((groups: Record<StatusEnum, SuggestionResponse[]>, suggestion: SuggestionResponse) => {
    const status = suggestion.status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(suggestion);
    return groups;
  }, {} as Record<StatusEnum, SuggestionResponse[]>);

  return (
    <div className="space-y-6">


      {/* Glassmorphism Container */}
      <Card className="bg-black/10 backdrop-blur-sm border-black/20">
        <CardContent className="p-6">
          {/* Suggestions Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant={showSuggestions ? "default" : "outline"}
                onClick={() => setShowSuggestions(true)}
                className={showSuggestions 
                  ? "bg-white text-gray-900 hover:bg-gray-100" 
                  : "border-black/20 text-white hover:bg-black/10"
                }
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Suggestions ({suggestions.length})
              </Button>
              <Button
                variant={!showSuggestions ? "default" : "outline"}
                onClick={() => setShowSuggestions(false)}
                className={!showSuggestions 
                  ? "bg-white text-gray-900 hover:bg-gray-100" 
                  : "border-black/20 text-white hover:bg-black/10"
                }
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Benchmarks ({benchmarks.length})
              </Button>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center bg-white text-gray-900 hover:bg-gray-100">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Benchmark
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/20 backdrop-blur-md border-black/30 text-white shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Benchmark</DialogTitle>
                  <DialogDescription className="text-gray-300">
                    Create a new performance benchmark for an Instagram account.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ig_username" className="text-white">Instagram Username</Label>
                    <Input
                      id="ig_username"
                      value={formData.ig_username}
                      onChange={(e: any) => setFormData({ ...formData, ig_username: e.target.value })}
                      placeholder="Enter Instagram username"
                      className="bg-black/20 border-black/30 text-white placeholder:text-gray-400 focus:border-white/30"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    className="border-black/30 text-white hover:bg-black/20"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateBenchmark}
                    disabled={loading}
                    className="bg-white text-gray-900 hover:bg-gray-100"
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Content */}
          <div className="space-y-6">
        {showSuggestions ? (
          // Suggestions List
          suggestionsLoading && suggestions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-white" />
              <span className="ml-2 text-white">Loading suggestions...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-300">No suggestions found</p>
              <p className="text-gray-400 text-sm">Suggestions will appear here when available</p>
            </div>
          ) : (
            (Object.entries(groupedSuggestions) as [StatusEnum, SuggestionResponse[]][])
              .map(([status, statusSuggestions]) => (
              <div key={status} className="space-y-3">
                <h3 className={`text-lg font-semibold ${getStatusColor(status as StatusEnum)}`}>
                  {status} ({statusSuggestions.length})
                </h3>
                <div className="space-y-0">
                  {statusSuggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.id}
                      className={`p-4 bg-black/5 hover:bg-black/10 transition-colors ${
                        index !== statusSuggestions.length - 1 ? 'border-b border-black/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <h3 className="text-white font-medium">
                                @{suggestion.ig.username}
                              </h3>
                              <p className="text-gray-400 text-sm">
                                Created: {formatDate(suggestion.created_at)}
                              </p>
                            </div>
                            <div className="text-center">
                              <span className="text-xs text-gray-400">Status</span>
                              <p className={`text-sm font-medium ${getStatusColor(suggestion.status)}`}>
                                {suggestion.status}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConvertToBenchmark(suggestion)}
                            disabled={loading}
                            className="border-green-500/20 text-green-400 hover:bg-green-500/10"
                          >
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Convert
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSuggestion(suggestion.id)}
                            disabled={suggestionsLoading}
                            className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )
        ) : (
          // Benchmarks List
          loading && benchmarks.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-white" />
              <span className="ml-2 text-white">Loading benchmarks...</span>
            </div>
          ) : benchmarks.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-300">No benchmarks found</p>
              <p className="text-gray-400 text-sm mb-6">Create your first benchmark to get started</p>
              <Button 
                onClick={handleAddMyFollowingToBenchmark}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Add My Following to Benchmark
              </Button>
            </div>
          ) : (
            (Object.entries(groupedBenchmarks) as [StatusEnum, BenchmarkResponse[]][])
              .map(([status, statusBenchmarks]) => (
              <div key={status} className="space-y-3">
                <h3 className={`text-lg font-semibold ${getStatusColor(status as StatusEnum)}`}>
                  {status} ({statusBenchmarks.length})
                </h3>
                <div className="space-y-0">
                  {statusBenchmarks.map((benchmark, index) => (
                    <div
                      key={benchmark.id}
                      className={`p-4 bg-black/5 hover:bg-black/10 transition-colors ${
                        index !== statusBenchmarks.length - 1 ? 'border-b border-black/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <h3 className="text-white font-medium">
                                @{benchmark.ig.username}
                              </h3>
                              <p className="text-gray-400 text-sm">
                                Created: {formatDate(benchmark.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-4">
                              {/* <div className="text-center">
                                <span className="text-xs text-gray-400">Status</span>
                                <p className={`text-sm font-medium ${getStatusColor(benchmark.status)}`}>
                                  {benchmark.status}
                                </p>
                              </div> */}
                              <div className="text-center" style={{ padding:'0px 20px'}}>
                                {/* <span className="text-xs text-gray-400">Health</span> */}
                                <p className={`text-sm font-medium ${getHealthColor(benchmark.health)}`}>
                                  {benchmark.health || 'Unknown'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(benchmark)}
                            className="border-black/20 text-white hover:bg-black/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDeleteDialog(benchmark.id)}
                            className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )
        )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-black/20 backdrop-blur-md border-black/30 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Benchmark</DialogTitle>
            <DialogDescription className="text-gray-300">
              Update the status of this benchmark.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status" className="text-white">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value as StatusEnum })}
              >
                <SelectTrigger className="bg-black/20 border-black/30 text-white focus:border-white/30">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-black/40 backdrop-blur-md border-black/30">
                  <SelectItem value={StatusEnum.ACTIVE}>Active</SelectItem>
                  <SelectItem value={StatusEnum.DELETED}>Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white">Health Status (Read-only)</Label>
              <div className="p-3 bg-black/20 border border-black/30 rounded-md">
                <span className={`font-medium ${getHealthColor(selectedBenchmark?.health)}`}>
                  {selectedBenchmark?.health || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="border-black/30 text-white hover:bg-black/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateBenchmark}
              disabled={loading}
              className="bg-white text-gray-900 hover:bg-gray-100"
            >
              {loading ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-black/20 backdrop-blur-md border-black/30 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Benchmark</DialogTitle>
            <DialogDescription className="text-gray-300">
              Are you sure you want to delete this benchmark? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setBenchmarkToDelete(null);
              }}
              className="border-black/30 text-white hover:bg-black/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteBenchmark}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};
