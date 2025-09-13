import { describe, it, expect } from 'vitest';
import { step, type AuthState } from './flowMachine';

describe('flowMachine', () => {
  it('WebView login + server storage → automation', () => {
    const [state, fx] = step(
      { tag: 'idle', hasServerStorage: true },
      { type: 'BOOT', hasServerStorage: true, isLoggedInWebView: true }
    );
    expect(state.tag).toBe('automating');
    expect(fx).toEqual([{ do: 'startAutomation' }]);
  });

  it('WebView logout + server storage → redirect to Instagram login', () => {
    const [state, fx] = step({ tag: 'dashboard' } as AuthState, { type: 'LOGOUT' });
    expect(state.tag).toBe('onInstagramLoginPage');
    expect(fx).toEqual([{ do: 'redirectInstagramLogin' }]);
  });

  it('WebView login − server storage → awaiting DOM selection then connect', () => {
    const [s1] = step(
      { tag: 'idle', hasServerStorage: false },
      { type: 'BOOT', hasServerStorage: false, isLoggedInWebView: true }
    );
    expect(s1.tag).toBe('awaitingDomSelection');
    const [s2, fx2] = step(s1, { type: 'CONNECT_CONFIRMED', profile: 'recent_user' });
    expect(s2.tag).toBe('dashboard');
    expect(fx2.map((f) => f.do)).toEqual(['saveToServer', 'navigateDashboard']);
  });

  it('WebView logout − server storage → reset then redirect', () => {
    const [state, fx] = step(
      { tag: 'awaitingDomSelection' } as AuthState,
      { type: 'DISCONNECT_CONFIRMED' }
    );
    expect(state.tag).toBe('onInstagramLoginPage');
    expect(fx.map((f) => f.do)).toEqual(['resetWebView', 'redirectInstagramLogin']);
  });
});

