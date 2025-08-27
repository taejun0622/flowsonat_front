import React, { useState, useEffect } from 'react';
import { BarChart3, Activity, Plus, Edit, Trash2, Eye, RefreshCw } from 'lucide-react';

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

import { InstagramService } from '@/api/services/InstagramService';
import { 
  BenchmarkCreate, 
  BenchmarkResponse, 
  BenchmarkUpdate, 
  BenchmarkListResponse,
  HealthEnum,
  StatusEnum 
} from '@/api';

export const BenchmarkTab: React.FC = () => {
  const [benchmarks, setBenchmarks] = useState<BenchmarkResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkResponse | null>(null);
  const [formData, setFormData] = useState({
    ig_username: '',
    status: '' as StatusEnum | ''
  });
  const { toast } = useToast();

  // Load benchmarks on component mount
  useEffect(() => {
    loadBenchmarks();
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

  const handleDeleteBenchmark = async (benchmarkId: string) => {
    if (!confirm('Are you sure you want to delete this benchmark?')) return;

    try {
      setLoading(true);
      await InstagramService.deleteBenchmarkApiV1InstagramBenchmarksBenchmarkIdDelete(benchmarkId);
      
      toast({
        title: "Success",
        description: "Benchmark deleted successfully",
      });
      
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
      case HealthEnum.WARNING:
        return 'text-yellow-400';
      case HealthEnum.CRITICAL:
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
  const groupedBenchmarks = benchmarks.reduce((groups, benchmark) => {
    const status = benchmark.status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(benchmark);
    return groups;
  }, {} as Record<StatusEnum, BenchmarkResponse[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
              <Card className="bg-black/10 backdrop-blur-sm border-black/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-white">
                <BarChart3 className="h-5 w-5 mr-2" />
                Performance Benchmark
              </CardTitle>
              <CardDescription className="text-gray-300">
                System performance analysis and monitoring
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={loadBenchmarks}
                disabled={loading}
                variant="outline" 
                className="border-black/20 text-white hover:bg-black/10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center bg-white text-gray-900 hover:bg-gray-100">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Benchmark
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-black/20 text-white">
                  <DialogHeader>
                    <DialogTitle>Create New Benchmark</DialogTitle>
                    <DialogDescription>
                      Create a new performance benchmark for an Instagram account.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ig_username" className="text-white">Instagram Username</Label>
                      <Input
                        id="ig_username"
                        value={formData.ig_username}
                        onChange={(e) => setFormData({ ...formData, ig_username: e.target.value })}
                        placeholder="Enter Instagram username"
                        className="bg-gray-800 border-black/20 text-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                      className="border-black/20 text-white hover:bg-black/10"
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
          </div>
        </CardHeader>
      </Card>

      {/* Benchmarks List */}
      <div className="space-y-6">
        {loading && benchmarks.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-white" />
            <span className="ml-2 text-white">Loading benchmarks...</span>
          </div>
        ) : benchmarks.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-300">No benchmarks found</p>
            <p className="text-gray-400 text-sm">Create your first benchmark to get started</p>
          </div>
        ) : (
          Object.entries(groupedBenchmarks).map(([status, statusBenchmarks]) => (
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
                            <div className="text-center">
                              <span className="text-xs text-gray-400">Status</span>
                              <p className={`text-sm font-medium ${getStatusColor(benchmark.status)}`}>
                                {benchmark.status}
                              </p>
                            </div>
                            <div className="text-center">
                              <span className="text-xs text-gray-400">Health</span>
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
                          onClick={() => handleDeleteBenchmark(benchmark.id)}
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
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-black/20 text-white">
          <DialogHeader>
            <DialogTitle>Edit Benchmark</DialogTitle>
            <DialogDescription>
              Update the status of this benchmark.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status" className="text-white">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as StatusEnum })}
              >
                <SelectTrigger className="bg-gray-800 border-black/20 text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-black/20">
                  <SelectItem value={StatusEnum.ACTIVE}>Active</SelectItem>
                  <SelectItem value={StatusEnum.DELETED}>Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white">Health Status (Read-only)</Label>
              <div className="p-3 bg-gray-800 border border-black/20 rounded-md">
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
              className="border-black/20 text-white hover:bg-black/10"
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
    </div>
  );
};
