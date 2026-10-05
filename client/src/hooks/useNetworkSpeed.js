import { useState, useEffect } from 'react';

/**
 * Hook to assess network speed and connectivity:
 * Returns "good" | "slow" | "very-slow" | "offline"
 * Adapts automatically via navigator.connection and window online/offline events.
 * Supports manual override for demo simulation.
 */

// Global simulated speed state across components
let globalSimulationOverride = null;
const listeners = new Set();

export function setSimulatedNetworkSpeed(speed) {
  globalSimulationOverride = speed;
  listeners.forEach((listener) => listener(speed));
}

export function getSimulatedNetworkSpeed() {
  return globalSimulationOverride;
}

export function useNetworkSpeed() {
  const [speed, setSpeed] = useState(() => {
    if (globalSimulationOverride) return globalSimulationOverride;
    if (!navigator.onLine) return 'offline';
    return calculateSpeed();
  });

  function calculateSpeed() {
    if (!navigator.onLine) return 'offline';

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) {
      return 'good'; // Default fallback
    }

    const { effectiveType, downlink, rtt } = conn;

    // effectiveType: 'slow-2g', '2g', '3g', '4g'
    if (effectiveType === 'slow-2g') return 'very-slow';
    if (effectiveType === '2g') return 'very-slow';
    if (effectiveType === '3g') return 'slow';
    if (effectiveType === '4g') {
      if (downlink !== undefined && downlink < 0.5) return 'very-slow';
      if (downlink !== undefined && downlink < 1.5) return 'slow';
      if (rtt !== undefined && rtt > 600) return 'slow';
      return 'good';
    }

    return 'good';
  }

  useEffect(() => {
    const handleOverrideChange = (simSpeed) => {
      if (simSpeed) {
        setSpeed(simSpeed);
      } else {
        setSpeed(calculateSpeed());
      }
    };

    listeners.add(handleOverrideChange);

    const handleOnline = () => {
      if (!globalSimulationOverride) setSpeed(calculateSpeed());
    };

    const handleOffline = () => {
      if (!globalSimulationOverride) setSpeed('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const handleConnChange = () => {
      if (!globalSimulationOverride) setSpeed(calculateSpeed());
    };

    if (conn) {
      conn.addEventListener('change', handleConnChange);
    }

    return () => {
      listeners.delete(handleOverrideChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (conn) {
        conn.removeEventListener('change', handleConnChange);
      }
    };
  }, []);

  const simulateSpeed = (newSpeed) => {
    setSimulatedNetworkSpeed(newSpeed);
  };

  return {
    speed,
    isOffline: speed === 'offline',
    isAudioOnly: speed === 'very-slow',
    isReducedVideo: speed === 'slow',
    isFullVideo: speed === 'good',
    simulateSpeed
  };
}
