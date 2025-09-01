import React, { useRef, useState, useEffect } from 'react';
import { WebView, WebViewHandle } from './WebView';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '../hooks/use-toast';

interface WebViewControllerProps {
  src: string;
  instagramState?: string;
  onInstagramLogin?: (sessionData: any) => void;
  onLoginStatusCheck?: (isLoggedIn: boolean) => void;
}

export const WebViewController: React.FC<WebViewControllerProps> = ({
  src,
  instagramState,
  onInstagramLogin,
  onLoginStatusCheck
}) => {
  const webviewRef = useRef<WebViewHandle>(null);
  const { toast } = useToast();
  const [isExtensionEnabled, setIsExtensionEnabled] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [clickableElements, setClickableElements] = useState<any[]>([]);
  const [scrollableAreas, setScrollableAreas] = useState<any[]>([]);
  const [selectedElement, setSelectedElement] = useState<any>(null);

  // Enable extension when IG is logged in (server registered assumed by container)
  const shouldEnableExtension = instagramState === 'instagram_logged_in';

  useEffect(() => {
    if (shouldEnableExtension && !isExtensionEnabled) {
      setIsExtensionEnabled(true);
      toast({
        title: "Extension Enabled",
        description: "Instagram controller extension is now active",
      });
    } else if (!shouldEnableExtension && isExtensionEnabled) {
      setIsExtensionEnabled(false);
      toast({
        title: "Extension Disabled",
        description: "Instagram controller extension is now inactive",
      });
    }
  }, [shouldEnableExtension, isExtensionEnabled, toast]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPosition({ x, y });
    
    if (webviewRef.current && isExtensionEnabled) {
      webviewRef.current.moveCursor(x, y);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (webviewRef.current && isExtensionEnabled) {
      webviewRef.current.click(x, y);
      toast({
        title: "Click Executed",
        description: `Clicked at position (${x}, ${y})`,
      });
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (webviewRef.current && isExtensionEnabled) {
      webviewRef.current.doubleClick(x, y);
      toast({
        title: "Double Click Executed",
        description: `Double clicked at position (${x}, ${y})`,
      });
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (webviewRef.current && isExtensionEnabled) {
      webviewRef.current.click(x, y, 'right');
      toast({
        title: "Right Click Executed",
        description: `Right clicked at position (${x}, ${y})`,
      });
    }
  };

  const handleScroll = (e: React.WheelEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (webviewRef.current && isExtensionEnabled) {
      webviewRef.current.scroll(x, y, e.deltaX, e.deltaY);
    }
  };

  const getElementInfo = async () => {
    if (!webviewRef.current || !isExtensionEnabled) return;
    
    try {
      const { x, y } = cursorPosition;
      const element = await webviewRef.current.getElementInfo(x, y);
      setSelectedElement(element);
      
      toast({
        title: "Element Info Retrieved",
        description: `Element at (${x}, ${y}): ${element?.tagName || 'None'}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get element info",
        variant: "destructive",
      });
    }
  };

  const findClickableElements = async () => {
    if (!webviewRef.current || !isExtensionEnabled) return;
    
    try {
      const elements = await webviewRef.current.findClickableElements();
      setClickableElements(elements);
      
      toast({
        title: "Clickable Elements Found",
        description: `Found ${elements.length} clickable elements`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to find clickable elements",
        variant: "destructive",
      });
    }
  };

  const findScrollableAreas = async () => {
    if (!webviewRef.current || !isExtensionEnabled) return;
    
    try {
      const areas = await webviewRef.current.findScrollableAreas();
      setScrollableAreas(areas);
      
      toast({
        title: "Scrollable Areas Found",
        description: `Found ${areas.length} scrollable areas`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to find scrollable areas",
        variant: "destructive",
      });
    }
  };

  const takeScreenshot = async () => {
    if (!webviewRef.current || !isExtensionEnabled) return;
    
    try {
      const screenshot = await webviewRef.current.takeScreenshot();
      toast({
        title: "Screenshot Taken",
        description: `Viewport: ${screenshot.width}x${screenshot.height}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to take screenshot",
        variant: "destructive",
      });
    }
  };



  const handleScrollStep = (dy: number) => {
    if (!webviewRef.current || !isExtensionEnabled) return;
    const { x, y } = cursorPosition;
    webviewRef.current.scroll(x, y, 0, dy);
  };

  return (
    <div className="flex h-full">
      {/* WebView Area */}
      <div className="flex-1 relative">
        <WebView
          ref={webviewRef}
          src={src}
          instagramState={instagramState}
          enableExtension={isExtensionEnabled}
          onInstagramLogin={onInstagramLogin}
          onLoginStatusCheck={onLoginStatusCheck}
          className="w-full h-full"
        />
        
        {/* Mouse Control Overlay */}
        {isExtensionEnabled && (
          <div
            className="absolute inset-0 z-10"
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleRightClick}
            onWheel={handleScroll}
          />
        )}
      </div>

      {/* Control Panel */}
      <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-4 space-y-4 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>WebView Controller</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Extension Status */}
            <div className="flex items-center justify-between">
              <Label>Extension Status</Label>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                isExtensionEnabled 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
              }`}>
                {isExtensionEnabled ? 'Active' : 'Inactive'}
              </div>
            </div>

            {/* Instagram State */}
            <div className="flex items-center justify-between">
              <Label>Instagram State</Label>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {instagramState || 'Unknown'}
              </div>
            </div>

            {/* Cursor Position */}
            <div className="space-y-2">
              <Label>Cursor Position</Label>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                X: {cursorPosition.x}, Y: {cursorPosition.y}
              </div>
            </div>

            {/* Control Buttons */}
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-2">
                <Button 
                  onClick={getElementInfo}
                  disabled={!isExtensionEnabled}
                  className="w-full"
                >
                  Get Element Info
                </Button>
                
                <Button 
                  onClick={takeScreenshot}
                  disabled={!isExtensionEnabled}
                  className="w-full"
                >
                  Take Screenshot
                </Button>
                
                <Button 
                  onClick={findClickableElements}
                  disabled={!isExtensionEnabled}
                  className="w-full"
                >
                  Find Clickable Elements
                </Button>
                
                <Button 
                  onClick={findScrollableAreas}
                  disabled={!isExtensionEnabled}
                  className="w-full"
                >
                  Find Scrollable Areas
                </Button>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-2">
                <div className="space-y-2">
                  <Label>Clickable Elements ({clickableElements.length})</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {clickableElements.map((element, index) => (
                      <div 
                        key={index}
                        className="text-xs p-2 bg-gray-100 dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                        onClick={() => {
                          if (webviewRef.current && isExtensionEnabled) {
                            const rect = element.rect;
                            webviewRef.current.click(
                              rect.left + rect.width / 2,
                              rect.top + rect.height / 2
                            );
                          }
                        }}
                      >
                        <div className="font-medium">{element.type}</div>
                        <div className="text-gray-600 dark:text-gray-400 truncate">
                          {element.text || element.selector}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Scrollable Areas ({scrollableAreas.length})</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {scrollableAreas.map((area, index) => (
                      <div 
                        key={index}
                        className="text-xs p-2 bg-blue-100 dark:bg-blue-900 rounded cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
                        onClick={() => {
                          if (webviewRef.current && isExtensionEnabled) {
                            const rect = area.rect;
                            webviewRef.current.scroll(
                              rect.left + rect.width / 2,
                              rect.top + rect.height / 2,
                              0,
                              100
                            );
                          }
                        }}
                      >
                        <div className="font-medium">Scrollable Area</div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {area.selector}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Selected Element Info */}
        {selectedElement && (
          <Card>
            <CardHeader>
              <CardTitle>Element Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <div><strong>Tag:</strong> {selectedElement.tagName}</div>
                <div><strong>Text:</strong> {selectedElement.text}</div>
                <div><strong>Clickable:</strong> {selectedElement.isClickable ? 'Yes' : 'No'}</div>
                <div><strong>Scrollable:</strong> {selectedElement.isScrollable ? 'Yes' : 'No'}</div>
                {selectedElement.id && <div><strong>ID:</strong> {selectedElement.id}</div>}
                {selectedElement.className && <div><strong>Class:</strong> {selectedElement.className}</div>}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
