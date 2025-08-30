import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FullScreenWebView from '@/features/webview/components/FullScreenWebView';
import { InstagramAutomation } from '@/features/automation/instagramAutomation';
import { useInstagram } from '@/contexts/InstagramContext';
import { useToast } from '@/hooks/use-toast';

const InstagramAutomationTester = () => {
  const { instagramAccount, isConnected } = useInstagram();
  const { toast } = useToast();
  const webviewRef = React.useRef<HTMLWebViewElement>(null);
  const [open, setOpen] = React.useState(false);
  const [logs, setLogs] = React.useState<string[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  
  // 테스트용 입력값들
  const [targetUsername, setTargetUsername] = React.useState('');
  const [scrollCount, setScrollCount] = React.useState(5);
  const [clickX, setClickX] = React.useState(100);
  const [clickY, setClickY] = React.useState(100);
  const [selectedButton, setSelectedButton] = React.useState('');
  const [isSelectingButton, setIsSelectingButton] = React.useState(false);

  // Get current username from connected Instagram account
  const currentUsername = instagramAccount?.username || '';

  const append = (line: string) => setLogs((prev: string[]) => [line, ...prev].slice(0, 100));

  // Instagram Automation 인스턴스 생성
  const createAutomation = () => {
    if (!webviewRef.current || !currentUsername) {
      toast({
        title: "Error",
        description: "Instagram에 연결되어 있지 않습니다.",
        variant: "destructive"
      });
      return null;
    }

    return new InstagramAutomation(webviewRef.current, {
      myUsername: currentUsername,
      maxUnfollowPerRun: 250,
      followTargetCap: 500
    }, (p) => append(`${p.step}${p.detail ? ' - ' + p.detail : ''}${p.count!==undefined?` (${p.count}/${p.total ?? ''})`:''}`));
  };

  // 1. 페이지 이동 테스트
  const testNavigate = async () => {
    if (!targetUsername) {
      toast({
        title: "Error",
        description: "사용자명을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    append(`페이지 이동 테스트 시작: @${targetUsername}`);
    
         try {
       const automation = createAutomation();
       if (!automation) return;

       await automation.testNavigate(`https://www.instagram.com/${targetUsername}/`);
       append(`✅ 페이지 이동 완료: @${targetUsername}`);
      
      toast({
        title: "Success",
        description: `@${targetUsername} 페이지로 이동했습니다.`
      });
    } catch (e) {
      append(`❌ 페이지 이동 실패: ${(e as Error).message}`);
      toast({
        title: "Error",
        description: `페이지 이동 실패: ${(e as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 2. 스크롤하며 사용자 수집 테스트
  const testScrollAndCollect = async () => {
    setIsRunning(true);
    append(`스크롤 수집 테스트 시작 (${scrollCount}회)`);
    
         try {
       const automation = createAutomation();
       if (!automation) return;

       const users = await automation.testScrollAndCollect();
      
      append(`✅ 스크롤 수집 완료: ${users.length}명의 사용자 발견`);
      
      toast({
        title: "Success",
        description: `${users.length}명의 사용자를 수집했습니다.`
      });
    } catch (e) {
      append(`❌ 스크롤 수집 실패: ${(e as Error).message}`);
      toast({
        title: "Error",
        description: `스크롤 수집 실패: ${(e as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 3. 팔로워 모달 열기 테스트
  const testOpenFollowersModal = async () => {
    setIsRunning(true);
    append('팔로워 모달 열기 테스트 시작');
    
         try {
       const automation = createAutomation();
       if (!automation) return;

       // 먼저 현재 사용자 프로필로 이동
       await automation.testNavigate(`https://www.instagram.com/${currentUsername}/`);
       
       // 팔로워 모달 열기
       await automation.testOpenModal('followers');
      
      append('✅ 팔로워 모달 열기 완료');
      
      toast({
        title: "Success",
        description: "팔로워 모달을 열었습니다."
      });
    } catch (e) {
      append(`❌ 팔로워 모달 열기 실패: ${(e as Error).message}`);
      toast({
        title: "Error",
        description: `팔로워 모달 열기 실패: ${(e as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 4. 팔로잉 모달 열기 테스트
  const testOpenFollowingModal = async () => {
    setIsRunning(true);
    append('팔로잉 모달 열기 테스트 시작');
    
         try {
       const automation = createAutomation();
       if (!automation) return;

       // 먼저 현재 사용자 프로필로 이동
       await automation.testNavigate(`https://www.instagram.com/${currentUsername}/`);
       
       // 팔로잉 모달 열기
       await automation.testOpenModal('following');
      
      append('✅ 팔로잉 모달 열기 완료');
      
      toast({
        title: "Success",
        description: "팔로잉 모달을 열었습니다."
      });
    } catch (e) {
      append(`❌ 팔로잉 모달 열기 실패: ${(e as Error).message}`);
      toast({
        title: "Error",
        description: `팔로잉 모달 열기 실패: ${(e as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

    // 5. 팔로우/언팔로우 버튼 클릭 테스트
  const testClickFollowButton = async () => {
    setIsRunning(true);
    append(`팔로우 버튼 클릭 테스트 시작 (${clickX}, ${clickY})`);
    
    try {
      const automation = createAutomation();
      if (!automation) return;

      const result = await automation.testClickFollowVariant();
      
      append(`✅ 팔로우 버튼 클릭 완료: ${result}`);
      
      toast({
        title: "Success",
        description: `버튼 클릭 결과: ${result}`
      });
    } catch (e) {
      append(`❌ 팔로우 버튼 클릭 실패: ${(e as Error).message}`);
      toast({
        title: "Error",
        description: `버튼 클릭 실패: ${(e as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 6. 버튼 선택 모드 시작
  const startButtonSelection = async () => {
    setIsSelectingButton(true);
    append('버튼 선택 모드 시작 - 클릭할 버튼을 선택하세요');
    
    try {
      const automation = createAutomation();
      if (!automation) return;

      await automation.startButtonSelection();
      
      toast({
        title: "버튼 선택 모드",
        description: "클릭할 버튼을 선택하세요. 선택 후 자동으로 좌표가 설정됩니다."
      });
    } catch (e) {
      append(`❌ 버튼 선택 모드 시작 실패: ${(e as Error).message}`);
      toast({
        title: "Error",
        description: `버튼 선택 모드 시작 실패: ${(e as Error).message}`,
        variant: "destructive"
      });
      setIsSelectingButton(false);
    }
  };

  // 7. 선택된 버튼 정보 가져오기
  const getSelectedButtonInfo = async () => {
    try {
      const automation = createAutomation();
      if (!automation) return;

      const result = await automation.getSelectedButtonInfo();

      if (result) {
        setClickX(result.x);
        setClickY(result.y);
        setSelectedButton(`${result.element} - ${result.text}`);
        append(`✅ 버튼 선택 완료: ${result.element} (${result.x}, ${result.y})`);
        
        toast({
          title: "버튼 선택 완료",
          description: `${result.element} 버튼이 선택되었습니다. (${result.x}, ${result.y})`
        });
      }
    } catch (e) {
      append(`❌ 버튼 정보 가져오기 실패: ${(e as Error).message}`);
    }
  };

  // 8. 좌표 기반 클릭 테스트
  const testClickAtCoordinates = async () => {
    setIsRunning(true);
    append(`좌표 클릭 테스트 시작 (${clickX}, ${clickY})`);
    
    try {
      const automation = createAutomation();
      if (!automation) return;

      const result = await automation.clickAtCoordinates(clickX, clickY);
      
      if (result.success) {
        append(`✅ 좌표 클릭 완료: (${clickX}, ${clickY}) - ${result.element}`);
        
        toast({
          title: "Success",
          description: `좌표 (${clickX}, ${clickY})에서 클릭을 실행했습니다.`
        });
      } else {
        append(`❌ 좌표 클릭 실패: ${result.message}`);
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (e) {
      append(`❌ 좌표 클릭 실패: ${(e as Error).message}`);
      toast({
        title: "Error",
        description: `좌표 클릭 실패: ${(e as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 9. 전체 자동화 테스트
  const testFullAutomation = async () => {
    setIsRunning(true);
    append('전체 자동화 테스트 시작');
    
    try {
      const automation = createAutomation();
      if (!automation) return;

      await automation.runAll();
      append('✅ 전체 자동화 테스트 완료');
      
      toast({
        title: "Success",
        description: "전체 자동화가 완료되었습니다."
      });
    } catch (e) {
      append(`❌ 전체 자동화 실패: ${(e as Error).message}`);
      toast({
        title: "Error",
        description: `전체 자동화 실패: ${(e as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 로그 초기화
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Instagram 자동화 테스터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 페이지 이동 테스트 */}
            <div className="space-y-2">
              <Label htmlFor="targetUsername">테스트할 사용자명</Label>
              <div className="flex gap-2">
                <Input
                  id="targetUsername"
                  value={targetUsername}
                  onChange={(e: any) => setTargetUsername(e.target.value)}
                  placeholder="사용자명 입력"
                />
                <Button 
                  onClick={testNavigate} 
                  disabled={isRunning || !isConnected}
                  size="sm"
                >
                  페이지 이동
                </Button>
              </div>
            </div>

            {/* 스크롤 수집 테스트 */}
            <div className="space-y-2">
              <Label htmlFor="scrollCount">스크롤 횟수</Label>
              <div className="flex gap-2">
                <Input
                  id="scrollCount"
                  type="number"
                  value={scrollCount}
                  onChange={(e: any) => setScrollCount(Number(e.target.value))}
                  min="1"
                  max="20"
                />
                <Button 
                  onClick={testScrollAndCollect} 
                  disabled={isRunning || !isConnected}
                  size="sm"
                >
                  스크롤 수집
                </Button>
              </div>
            </div>

            {/* 모달 열기 테스트 */}
            <div className="space-y-2">
              <Label>모달 테스트</Label>
              <div className="flex gap-2">
                <Button 
                  onClick={testOpenFollowersModal} 
                  disabled={isRunning || !isConnected}
                  size="sm"
                  variant="outline"
                >
                  팔로워 모달
                </Button>
                <Button 
                  onClick={testOpenFollowingModal} 
                  disabled={isRunning || !isConnected}
                  size="sm"
                  variant="outline"
                >
                  팔로잉 모달
                </Button>
              </div>
            </div>

            {/* 버튼 클릭 테스트 */}
            <div className="space-y-2">
              <Label>버튼 클릭 테스트</Label>
              <div className="space-y-2">
                {/* 버튼 선택 */}
                <div className="flex gap-2">
                  <Button 
                    onClick={startButtonSelection} 
                    disabled={isRunning || !isConnected || isSelectingButton}
                    size="sm"
                    variant="outline"
                  >
                    {isSelectingButton ? '선택 중...' : '버튼 선택'}
                  </Button>
                  <Button 
                    onClick={getSelectedButtonInfo} 
                    disabled={isRunning || !isConnected}
                    size="sm"
                    variant="outline"
                  >
                    선택 정보 가져오기
                  </Button>
                </div>
                
                {/* 선택된 버튼 정보 */}
                {selectedButton && (
                  <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                    선택된 버튼: {selectedButton}
                  </div>
                )}
                
                {/* 좌표 입력 및 클릭 */}
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={clickX}
                    onChange={(e: any) => setClickX(Number(e.target.value))}
                    placeholder="X 좌표"
                    className="w-20"
                  />
                  <Input
                    type="number"
                    value={clickY}
                    onChange={(e: any) => setClickY(Number(e.target.value))}
                    placeholder="Y 좌표"
                    className="w-20"
                  />
                  <Button 
                    onClick={testClickFollowButton} 
                    disabled={isRunning || !isConnected}
                    size="sm"
                  >
                    팔로우 버튼
                  </Button>
                  <Button 
                    onClick={testClickAtCoordinates} 
                    disabled={isRunning || !isConnected}
                    size="sm"
                    variant="outline"
                  >
                    좌표 클릭
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 전체 자동화 테스트 */}
          <div className="mt-4 pt-4 border-t">
            <Button 
              onClick={testFullAutomation} 
              disabled={isRunning || !isConnected}
              className="w-full"
              size="lg"
            >
              전체 자동화 테스트 실행
            </Button>
          </div>

          {/* 상태 표시 */}
          <div className="mt-4 text-sm text-gray-600">
            <div>연결 상태: {isConnected ? '✅ 연결됨' : '❌ 연결 안됨'}</div>
            <div>현재 사용자: {currentUsername || '없음'}</div>
            <div>실행 상태: {isRunning ? '🔄 실행 중...' : '⏸️ 대기 중'}</div>
          </div>
        </CardContent>
      </Card>

      {/* 로그 패널 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>실행 로그</CardTitle>
            <Button onClick={clearLogs} size="sm" variant="outline">
              로그 초기화
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded-md h-64 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">로그가 없습니다. 테스트를 실행해보세요.</div>
            ) : (
              logs.map((log: string, index: number) => (
                <div key={index} className="mb-1">
                  <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 웹뷰 */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="relative w-full h-full">
            <div className="absolute top-4 left-4 z-10">
              <Button onClick={() => setOpen(false)} variant="secondary">
                닫기
              </Button>
            </div>
            <FullScreenWebView
              webviewRef={webviewRef}
              url="https://www.instagram.com"
              onClose={() => setOpen(false)}
              enableExtension={true}
            />
          </div>
        </div>
      )}

      {/* 웹뷰 열기 버튼 */}
      <Button onClick={() => setOpen(true)} className="w-full">
        Instagram 웹뷰 열기
      </Button>
    </div>
  );
};

export default InstagramAutomationTester;
