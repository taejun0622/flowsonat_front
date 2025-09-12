export type AuthState =
  | { tag: 'idle'; hasServerStorage: boolean }
  | { tag: 'onInstagramLoginPage'; hasServerStorage: boolean }
  | { tag: 'awaitingDomSelection' }
  | { tag: 'automating' }
  | { tag: 'dashboard' };

export type Event =
  | { type: 'BOOT'; hasServerStorage: boolean; isLoggedInWebView: boolean }
  | { type: 'LOGIN_DETECTED' }
  | { type: 'LOGOUT' }
  | { type: 'CONNECT_CONFIRMED'; profile: string }
  | { type: 'DISCONNECT_CONFIRMED' }
  | { type: 'AUTOMATION_DONE' };

export type Effect =
  | { do: 'redirectInstagramLogin' }
  | { do: 'startAutomation' }
  | { do: 'showProfileSelectModal'; profile: string }
  | { do: 'saveToServer'; profile: string }
  | { do: 'navigateDashboard' }
  | { do: 'resetWebView' };

export function step(state: AuthState, evt: Event): [AuthState, Effect[]] {
  switch (evt.type) {
    case 'BOOT': {
      if (evt.isLoggedInWebView && evt.hasServerStorage) {
        return [{ tag: 'automating' }, [{ do: 'startAutomation' }]];
      }
      if (!evt.isLoggedInWebView) {
        return [
          { tag: 'onInstagramLoginPage', hasServerStorage: evt.hasServerStorage },
          [{ do: 'redirectInstagramLogin' }],
        ];
      }
      // Logged in but no server storage → need DOM selection
      return [{ tag: 'awaitingDomSelection' }, []];
    }
    case 'LOGIN_DETECTED': {
      return [{ tag: 'awaitingDomSelection' }, []];
    }
    case 'CONNECT_CONFIRMED':
      return [
        { tag: 'dashboard' },
        [
          { do: 'saveToServer', profile: evt.profile },
          { do: 'navigateDashboard' },
        ],
      ];
    case 'DISCONNECT_CONFIRMED':
      return [
        { tag: 'onInstagramLoginPage', hasServerStorage: false },
        [{ do: 'resetWebView' }, { do: 'redirectInstagramLogin' }],
      ];
    case 'AUTOMATION_DONE':
      return [{ tag: 'dashboard' }, [{ do: 'navigateDashboard' }]];
    case 'LOGOUT':
      return [
        { tag: 'onInstagramLoginPage', hasServerStorage: true },
        [{ do: 'redirectInstagramLogin' }],
      ];
    default:
      return [state, []];
  }
}

