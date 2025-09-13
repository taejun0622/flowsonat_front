# 메모리 최적화 가이드

## 문제 분석

발생한 에러는 **전체 Electron 애플리케이션이 크래시되는 것**입니다:

```
FATAL ERROR: Oilpan: Large allocation. Allocation failed - process out of memory
```

이는 V8 엔진의 메모리 할당 실패로 인한 치명적 오류입니다.

## 적용된 해결책

### 1. Electron 메모리 설정 최적화 ✅

**파일**: `electron/main.ts`

- V8 메모리 제한 설정 (개발 환경: 1GB)
- WebView 메모리 최적화 설정
- 주기적 메모리 모니터링 (30초마다)
- 자동 가비지 컬렉션 (500MB 초과 시)

### 2. WebView 메모리 누수 방지 ✅

**파일**: `src/components/WebView.tsx`

- 인터벌 정리 개선 (메모리 누수 방지)
- 주기적 메모리 정리 (5분마다)
- 이미지 캐시 정리
- 이벤트 리스너 정리

### 3. 메모리 모니터링 도구 추가 ✅

**파일**: `src/utils/memoryMonitor.ts`

- 실시간 메모리 사용량 추적
- 경고 및 임계값 설정 (400MB/600MB)
- 자동 메모리 정리 트리거
- 히스토리 및 통계 제공

### 4. 개발 환경 최적화 ✅

**파일**: `package.json`

- 메모리 제한이 있는 개발 스크립트 추가
- `--expose-gc` 옵션으로 가비지 컬렉션 활성화

## 사용 방법

### 개발 환경에서 메모리 디버깅

```bash
# 메모리 제한이 있는 개발 모드
npm run dev

# 메모리 디버깅 모드 (512MB 제한)
npm run dev:memory-debug
```

### 메모리 모니터링

개발 환경에서 자동으로 시작되며, 콘솔에서 메모리 사용량을 확인할 수 있습니다:

```javascript
// 브라우저 콘솔에서
window.memoryMonitor.getCurrentMemory()
window.memoryMonitor.getMemoryStats()
```

### 수동 메모리 정리

```javascript
// 브라우저 콘솔에서
window.electronAPI.cleanupWebViewMemory()
```

## 추가 권장사항

### 1. Electron 버전 업데이트

현재: Electron 30.5.1
최신: Electron 38.1.0

**주의**: 메이저 버전 업데이트이므로 신중한 테스트 필요

### 2. WebView 사용 최적화

- 불필요한 WebView 인스턴스 생성 방지
- 페이지 전환 시 이전 WebView 정리
- 이미지 지연 로딩 비활성화

### 3. 메모리 사용량 모니터링

- 정기적으로 메모리 사용량 체크
- 400MB 초과 시 경고 로그 확인
- 600MB 초과 시 즉시 조치

### 4. 개발 환경 설정

```bash
# 메모리 제한이 있는 개발 환경
export NODE_OPTIONS="--max-old-space-size=1024"

# 가비지 컬렉션 활성화
export NODE_OPTIONS="--max-old-space-size=1024 --expose-gc"
```

## 모니터링 지표

### 정상 범위
- Heap Used: < 400MB
- RSS: < 500MB
- External: < 100MB

### 경고 범위
- Heap Used: 400-600MB
- 자동 가비지 컬렉션 실행

### 위험 범위
- Heap Used: > 600MB
- 즉시 메모리 정리 필요

## 문제 해결 체크리스트

1. ✅ 메모리 모니터링 활성화
2. ✅ WebView 메모리 누수 방지
3. ✅ 주기적 메모리 정리
4. ✅ 개발 환경 메모리 제한
5. ⏳ Electron 버전 업데이트 (선택사항)
6. ⏳ 프로덕션 환경 테스트

## 주의사항

- 메모리 모니터링은 개발 환경에서만 활성화됩니다
- 프로덕션 빌드에서는 메모리 제한이 적용되지 않습니다
- WebView 사용량이 많을 경우 더 자주 메모리 정리가 필요할 수 있습니다
