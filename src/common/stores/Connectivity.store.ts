import { create } from 'zustand';

interface ConnectivityState {
  online: boolean;
}

/**
 * Browser connectivity, shared by every subscriber.
 *
 * Genuinely global — there is one network, not one per component — so the
 * listeners are attached once at module scope rather than per mount. Every
 * consumer then re-renders from the same source instead of each keeping its own
 * copy of the same boolean.
 */
export const useConnectivityStore = create<ConnectivityState>(() => ({
  online: navigator.onLine,
}));

window.addEventListener('online', () => useConnectivityStore.setState({ online: true }));
window.addEventListener('offline', () => useConnectivityStore.setState({ online: false }));
