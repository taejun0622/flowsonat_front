import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { InstagramAutomationService, InstagramAutomationConfig, AutomationState } from '@/services/instagramAutomationService';
import { InstagramDOMHelper } from '@/services/instagramDOMHelper';
import { WebViewControl } from '@/features/browser-extension/types';

interface UseAutomationServiceProps {
  webViewControl: WebViewControl;
  config: InstagramAutomationConfig;
  currentUsername: string;
  isConnected: boolean;
}

export const useAutomationService = ({
  webViewControl,
  config,
  currentUsername,
  isConnected
}: UseAutomationServiceProps) => {
  const [automationService, setAutomationService] = useState<InstagramAutomationService | null>(null);
  const [domHelper, setDomHelper] = useState<InstagramDOMHelper | null>(null);
  const [state, setState] = useState<AutomationState>({
    isRunning: false,
    currentStep: '',
    progress: 0,
    totalSteps: 0,
    currentStepIndex: 0
  });
  const { toast } = useToast();

  // Service initialization
  useEffect(() => {
    const domHelperInstance = new InstagramDOMHelper(webViewControl);
    const automationServiceInstance = new InstagramAutomationService(webViewControl, config, domHelperInstance);
    
    setDomHelper(domHelperInstance);
    setAutomationService(automationServiceInstance);
  }, [webViewControl, config]);

  // State monitoring
  useEffect(() => {
    if (!automationService) return;

    const interval = setInterval(() => {
      const currentState = automationService.getState();
      setState(currentState);
    }, 1000);

    return () => clearInterval(interval);
  }, [automationService]);

  // Start workflow
  const startWorkflow = useCallback(async () => {
    if (!automationService || !isConnected || !currentUsername) {
      toast({ 
        title: 'Error', 
        description: 'Please connect to Instagram first.', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      toast({ 
        title: 'Workflow Started', 
        description: `Starting Instagram automation for ${currentUsername}.` 
      });

      await automationService.runWorkflow(currentUsername);
      
      toast({ 
        title: 'Workflow Completed', 
        description: 'Instagram automation completed successfully.' 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({ 
        title: 'Workflow Failed', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    }
  }, [automationService, isConnected, currentUsername, toast]);

  // Stop workflow
  const stopWorkflow = useCallback(() => {
    if (automationService) {
      automationService.stopWorkflow();
      toast({ 
        title: 'Workflow Stopped', 
        description: 'Instagram automation has been stopped.' 
      });
    }
  }, [automationService, toast]);

  return {
    automationService,
    domHelper,
    state,
    startWorkflow,
    stopWorkflow
  };
};
