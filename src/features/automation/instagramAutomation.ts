import { InstagramService } from '@/api/services/InstagramService';
import { buildProfileUrl } from './selectors';
import type { AutomationConfig, Progress, Username } from './types';
import { StageEnum, StatusEnum } from '@/api/models';

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
    this.webview.loadURL(url);
    await this.waitForLoad();
  }

  private async waitForLoad() {
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      const lf = () => { this.webview.removeEventListener('did-finish-load', lf as any); done(); };
      this.webview.addEventListener('did-finish-load', lf as any, { once: true } as any);
    });
    await this.delay(500);
  }

  private async exec<T>(fn: () => T | Promise<T>): Promise<T> {
    const src = `(${fn.toString()})()`;
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
    await this.exec(async () => {
      const sel = arguments[0] as string;
      const el = document.querySelector(sel) as HTMLElement | null;
      if (el) (el as HTMLElement).click();
    }.bind(null, selector));
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
    const healthy = benches.benchmarks.filter(b => b.health === 'HEALTHY');
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
}
