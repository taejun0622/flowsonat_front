import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FullScreenWebView from '@/features/webview/components/FullScreenWebView';
import { InstagramAutomation } from '@/features/automation/instagramAutomation';
import { useInstagram } from '@/contexts/InstagramContext';

const InstagramAutomationRunner = () => {
  const { instagramAccount, isConnected } = useInstagram();
  const webviewRef = React.useRef<HTMLWebViewElement>(null);
  const [open, setOpen] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);

  // Get current username from connected Instagram account
  const currentUsername = instagramAccount?.username || '';

  const append = (line: string) => setLog((prev: string[]) => [line, ...prev].slice(0, 200));

  const handleStart = async () => {
    if (!webviewRef.current || !currentUsername) return;
    setBusy(true);
    const automation = new InstagramAutomation(webviewRef.current, {
      myUsername: currentUsername,
      maxUnfollowPerRun: 250,
      followTargetCap: 500
    }, (p) => append(`${p.step}${p.detail ? ' - ' + p.detail : ''}${p.count!==undefined?` (${p.count}/${p.total ?? ''})`:''}`));
    try {
      await automation.runAll();
      append('Run complete');
    } catch (e) {
      append('Error: ' + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-black/10 backdrop-blur-sm border-black/20">
        <CardHeader>
          <CardTitle className="text-white">Instagram Automation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Button disabled={!isConnected || !currentUsername || busy} onClick={()=>{ setOpen(true); setTimeout(handleStart, 500); }}>Start</Button>
            <Button variant="outline" onClick={()=>{ setLog([]); }} className="border-black/30 text-white">Clear Logs</Button>
          </div>
          <div className="mt-3 h-40 overflow-auto bg-black/5 border border-black/20 rounded p-2 text-xs text-gray-200 space-y-1">
            {log.map((l: string, i: number)=>(<div key={i}>{l}</div>))}
          </div>
        </CardContent>
      </Card>
      {open && (
        <FullScreenWebView url="https://www.instagram.com/" onClose={()=>setOpen(false)} webviewRef={webviewRef} />
      )}
    </div>
  );
};

export default InstagramAutomationRunner;
