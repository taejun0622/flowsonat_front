import { InstagramService } from '@/api/services/InstagramService';
import { buildProfileUrl } from './selectors';
import type { AutomationConfig, Progress, Username } from './types';
import { StageEnum, StatusEnum, HealthEnum } from '@/api';

export class InstagramAutomation {
  private webview: HTMLWebViewElement;
  private config: AutomationConfig;
  private onProgress?: (p: Progress) => void;

  constructor(webview: HTMLWebViewElement, config: AutomationConfig, onProgress?: (p: Progress) => void) {
    this.webview = webview;
    this.config = config;
    this.onProgress = onProgress;
  }

  private progress(step: string, detail?: string, count?: number, total?: number) {
    this.onProgress?.({ step, detail, count, total });
  }

  private delay(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }

  private async nav(url: string) {
    console.log('nav called with URL:', url);
    console.log('webview element:', this.webview);
    
    try {
      // Instagram 429 오류 방지를 위한 헤더 추가
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      };
      
      // @ts-ignore - Electron webview loadURL with headers
      this.webview.loadURL(url, { extraHeaders: Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join('\n') });
      console.log('loadURL called with headers, waiting for load...');
      await this.waitForLoad();
      console.log('Navigation and load completed');
    } catch (error) {
      console.error('Navigation error:', error);
      throw error;
    }
  }

  private async waitForLoad() {
    console.log('waitForLoad started');
    await new Promise<void>((resolve, reject) => {
      const done = () => {
        console.log('waitForLoad resolved');
        resolve();
      };
      
      const lf = () => { 
        console.log('did-finish-load event fired');
        this.webview.removeEventListener('did-finish-load', lf as any); 
        done(); 
      };
      
      const failLoad = (e: any) => {
        console.log('did-fail-load event fired:', e);
        this.webview.removeEventListener('did-fail-load', failLoad as any);
        
        // 429 오류 처리
        if (e.errorCode === 429) {
          console.log('429 Too Many Requests detected, waiting 30 seconds...');
          this.progress('rate-limit', 'Instagram rate limit detected, waiting 30 seconds...');
          setTimeout(() => {
            console.log('Retrying after rate limit wait...');
            this.webview.loadURL(this.webview.src);
          }, 30000);
        } else {
          reject(new Error(`Failed to load: ${e.errorDescription || 'Unknown error'}`));
        }
      };
      
      this.webview.addEventListener('did-finish-load', lf as any, { once: true } as any);
      this.webview.addEventListener('did-fail-load', failLoad as any, { once: true } as any);
      
      // 타임아웃 추가 (30초 - 429 오류 대응)
      setTimeout(() => {
        console.log('waitForLoad timeout - forcing resolve');
        this.webview.removeEventListener('did-finish-load', lf as any);
        this.webview.removeEventListener('did-fail-load', failLoad as any);
        done();
      }, 30000);
    });
    console.log('waitForLoad completed, adding delay...');
    await this.delay(1000); // 429 오류 대응으로 지연 시간 증가
    console.log('waitForLoad fully completed');
  }

  private async exec<T, A extends any[]>(fn: (...args: A) => T | Promise<T>, ...args: A): Promise<T> {
    const serializedArgs = args.map((a) => JSON.stringify(a)).join(',');
    const src = `(${fn.toString()})(${serializedArgs})`;
    // @ts-ignore executeJavaScript exists on Electron webview
    return this.webview.executeJavaScript(src, true);
  }

  async collectProfileHistory() {
    this.progress('history:start', `@${this.config.myUsername}`);
    await InstagramService.getHistoryByUsernameApiV1InstagramHistoryUsernameGet(this.config.myUsername);
    this.progress('history:done');
  }

  async collectFollowers() {
    this.progress('followers:start');
    await this.nav(buildProfileUrl(this.config.myUsername));
    await this.openModal('followers');
    const usernames = await this.scrollAndCollect();
    const server = await InstagramService.getFollowersApiV1InstagramFollowersUsernameGet(this.config.myUsername);
    this.progress('followers:diff', undefined, usernames.length, server.length);
    this.progress('followers:done', undefined, usernames.length);
    return usernames;
  }

  async collectFollowing() {
    this.progress('following:start');
    await this.nav(buildProfileUrl(this.config.myUsername));
    await this.openModal('following');
    const usernames = await this.scrollAndCollect();
    const server = await InstagramService.getFollowingApiV1InstagramFollowingUsernameGet(this.config.myUsername);
    this.progress('following:diff', undefined, usernames.length, server.length);
    this.progress('following:done', undefined, usernames.length);
    return usernames;
  }

  private async openModal(kind: 'followers'|'following') {
    const selector = kind === 'followers' ? 'a[href$="/followers/"]' : 'a[href$="/following/"]';
    await this.exec(async (sel: string) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (el) (el as HTMLElement).click();
    }, selector);
    await this.delay(800);
  }

  private async scrollAndCollect(): Promise<Username[]> {
    return this.exec(async () => {
      const DIALOG = 'div[role="dialog"]';
      const SCROLLER = 'div[role="dialog"] div[style*="overflow"]';
      const ROW_LINK = 'div[role="dialog"] a[role="link"][href^="/"]';
      const sleep = (ms:number)=>new Promise(r=>setTimeout(r,ms));
      const scroller = document.querySelector(SCROLLER) as HTMLElement | null;
      const seen = new Set<string>();
      let stable = 0;
      if (!scroller) return [] as string[];
      while (stable < 8) {
        const before = seen.size;
        document.querySelectorAll(ROW_LINK).forEach(a => {
          const href = (a as HTMLAnchorElement).getAttribute('href') || '';
          const m = href.match(/^\/(.+?)\/$/);
          if (m) seen.add(m[1]);
        });
        scroller.scrollTop = scroller.scrollHeight;
        await sleep(400);
        const after = seen.size;
        stable = (after === before) ? stable + 1 : 0;
      }
      return Array.from(seen);
    });
  }

  async processUnfollow() {
    this.progress('unfollow:start');
    const pending = await this.fetchTargets(StageEnum.REQUESTED);
    const cutoff = Date.now() - 4*24*60*60*1000;
    const targets = pending.filter(t => new Date(t.edited_at).getTime() <= cutoff).slice(0, this.config.maxUnfollowPerRun);
    let done = 0;
    for (const t of targets) {
      await this.nav(buildProfileUrl(t.ig.username));
      const clicked = await this.clickFollowVariant();
      if (clicked === 'unfollow') {
        await InstagramService.updateTargetApiV1InstagramTargetsTargetIdPut(t.id, { stage: StageEnum.UNFOLLOWED });
        done++;
        this.progress('unfollow:one', t.ig.username, done, targets.length);
        await this.delay(1200);
      }
    }
    this.progress('unfollow:done', undefined, done, targets.length);
    return done;
  }

  private async clickFollowVariant(): Promise<'follow'|'unfollow'|'none'> {
    return this.exec(async () => {
      const btns = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[];
      const pick = (labels: RegExp[]) => btns.find(b => labels.some(rx => rx.test(b.textContent?.trim() || '')));
      const unf = pick([/^(Following|Requested)$/i]);
      if (unf) { unf.click(); return 'unfollow' as const; }
      const fol = pick([/^Follow$/i]);
      if (fol) { fol.click(); return 'follow' as const; }
      return 'none' as const;
    });
  }

  private async fetchTargets(stage?: StageEnum) {
    const benches = await InstagramService.getBenchmarksApiV1InstagramBenchmarksGet(undefined, StatusEnum.ACTIVE);
    const out: any[] = [];
    for (const b of benches.benchmarks) {
      const list = await InstagramService.getTargetsApiV1InstagramBenchmarksBenchmarkIdTargetsGet(b.id, stage, StatusEnum.ACTIVE);
      out.push(...list.targets);
    }
    return out;
  }

  async collectTargetsFromBenchmarks() {
    this.progress('targets:start');
    const existing = await this.fetchTargets();
    if (existing.length >= 500) {
      this.progress('targets:skip', '>=500 existing');
      return 0;
    }
    const benches = await InstagramService.getBenchmarksApiV1InstagramBenchmarksGet(undefined, StatusEnum.ACTIVE);
    const healthy = benches.benchmarks.filter(b => b.health === HealthEnum.HEALTHY);
    for (let i = healthy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [healthy[i], healthy[j]] = [healthy[j], healthy[i]];
    }
    let added = 0;
    for (const b of healthy) {
      await this.nav(buildProfileUrl(b.ig.username || ''));
      const clickKind = await this.clickFollowVariant();
      await this.openModal('followers');
      const candidates = await this.collectUsersWithFollowButton();
      for (const username of candidates) {
        await InstagramService.createTargetApiV1InstagramBenchmarksBenchmarkIdTargetsPost(b.id, { ig_username: username });
        added++;
      }
      this.progress('targets:bench', b.ig.username || '', added);
      if (existing.length + added >= 500) break;
    }
    this.progress('targets:done', undefined, added);
    return added;
  }

  private async collectUsersWithFollowButton(): Promise<Username[]> {
    return this.exec(async () => {
      const SCROLLER = 'div[role="dialog"] div[style*="overflow"]';
      const sleep = (ms:number)=>new Promise(r=>setTimeout(r,ms));
      const scroller = document.querySelector(SCROLLER) as HTMLElement | null;
      const found: string[] = [];
      if (!scroller) return found;
      let stable = 0;
      while (stable < 8) {
        const before = found.length;
        const rows = Array.from(document.querySelectorAll('div[role="dialog"] li, div[role="dialog"] div')) as HTMLElement[];
        rows.forEach(r => {
          const link = r.querySelector('a[role="link"][href^="/"]') as HTMLAnchorElement | null;
          const btn = r.querySelector('button');
          const label = btn?.textContent?.trim() || '';
          const href = link?.getAttribute('href') || '';
          const m = href.match(/^\/(.+?)\/$/);
          if (m && /^(Follow)$/i.test(label)) {
            found.push(m[1]);
          }
        });
        scroller.scrollTop = scroller.scrollHeight;
        await sleep(400);
        stable = (found.length === before) ? stable + 1 : 0;
      }
      return Array.from(new Set(found));
    });
  }

  async processFollow(unfollowedCount: number) {
    const maxFollows = Math.max(0, this.config.followTargetCap - unfollowedCount);
    this.progress('follow:start', undefined, 0, maxFollows);
    const targets = await this.fetchTargets(StageEnum.PENDING);
    let clicked = 0;
    for (const t of targets) {
      if (clicked >= maxFollows) break;
      await this.nav(buildProfileUrl(t.ig.username));
      const variant = await this.clickFollowVariant();
      if (variant === 'unfollow') {
        await InstagramService.updateTargetApiV1InstagramTargetsTargetIdPut(t.id, { stage: StageEnum.FOLLOW_BACK });
      } else if (variant === 'follow') {
        await InstagramService.updateTargetApiV1InstagramTargetsTargetIdPut(t.id, { stage: StageEnum.REQUESTED });
        clicked++;
        this.progress('follow:one', t.ig.username, clicked, maxFollows);
        await this.delay(1200);
      }
    }
    this.progress('follow:done', undefined, clicked, maxFollows);
    return clicked;
  }

  async runAll() {
    await this.collectProfileHistory();
    await this.collectFollowers();
    await this.collectFollowing();
    const unf = await this.processUnfollow();
    await this.collectTargetsFromBenchmarks();
    await this.processFollow(unf);
  }

  // 테스트용 public 메서드들
  async testNavigate(url: string) {
    console.log('testNavigate called with URL:', url);
    try {
      await this.nav(url);
      console.log('Navigation completed successfully');
    } catch (error) {
      console.error('Navigation failed:', error);
      throw error;
    }
  }

  async testOpenModal(kind: 'followers'|'following') {
    await this.openModal(kind);
  }

  async testScrollAndCollect(): Promise<Username[]> {
    return this.scrollAndCollect();
  }

  async testClickFollowVariant(): Promise<'follow'|'unfollow'|'none'> {
    return this.clickFollowVariant();
  }

  // 버튼 선택 기능
  async startButtonSelection(): Promise<void> {
    return this.exec(async () => {
      // 기존 이벤트 리스너 제거
      if ((window as any).buttonSelectionHandler) {
        document.removeEventListener('click', (window as any).buttonSelectionHandler);
      }
      
      // 새로운 이벤트 리스너 추가
      (window as any).buttonSelectionHandler = (event: any) => {
        event.preventDefault();
        event.stopPropagation();
        
        const element = event.target;
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        // 선택된 버튼 정보 저장
        (window as any).selectedButtonInfo = {
          element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
          text: element.textContent?.trim() || 'No text',
          x: Math.round(x),
          y: Math.round(y),
          tagName: element.tagName,
          className: element.className,
          id: element.id
        };
        
        console.log('버튼 선택됨:', (window as any).selectedButtonInfo);
        
        // 선택 모드 비활성화
        document.removeEventListener('click', (window as any).buttonSelectionHandler);
        document.body.style.cursor = 'auto';
        
        // 선택 완료 신호
        (window as any).buttonSelectionComplete = true;
      };
      
      document.addEventListener('click', (window as any).buttonSelectionHandler);
      document.body.style.cursor = 'crosshair';
    });
  }

  async getSelectedButtonInfo(): Promise<any> {
    return this.exec(async () => {
      if ((window as any).selectedButtonInfo) {
        return (window as any).selectedButtonInfo;
      }
      return null;
    });
  }

  async clickAtCoordinates(x: number, y: number): Promise<any> {
    return this.exec(async (clickX: number, clickY: number) => {
      const element = document.elementFromPoint(clickX, clickY);
      if (!element) {
        return { success: false, message: '해당 좌표에 요소가 없습니다.' };
      }
      
      // 클릭 이벤트 발생
      element.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: clickX,
        clientY: clickY
      }));
      
      element.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: clickX,
        clientY: clickY
      }));
      
      element.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: clickX,
        clientY: clickY
      }));
      
      return { 
        success: true, 
        element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
        text: element.textContent?.substring(0, 50) || 'No text'
      };
    }, x, y);
  }
}
