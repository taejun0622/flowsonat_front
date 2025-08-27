import React from 'react';
import { BarChart3, Activity } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const BenchmarkTab: React.FC = () => {
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <BarChart3 className="h-5 w-5 mr-2" />
          Performance Benchmark
        </CardTitle>
        <CardDescription className="text-gray-300">System performance analysis and monitoring</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-white/20 rounded-lg bg-white/5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Current Status</span>
                <span className="text-sm font-medium text-green-400">Active</span>
              </div>
            </div>
            <div className="p-4 border border-white/20 rounded-lg bg-white/5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Last Run</span>
                <span className="text-sm text-white">2 hours ago</span>
              </div>
            </div>
            <div className="p-4 border border-white/20 rounded-lg bg-white/5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Average Performance</span>
                <span className="text-sm font-medium text-blue-400">95%</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <Button className="flex items-center bg-white text-gray-900 hover:bg-gray-100">
              <Activity className="h-4 w-4 mr-2" />
              Run Benchmark
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              View Results
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
