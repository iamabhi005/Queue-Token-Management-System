import React, { createContext, useContext, useState, useEffect } from 'react';
import { serviceAPI, adminAPI, tokenAPI, queueAPI } from '../services/api';
import { socket } from '../services/socket';
import { announceToken, playChime, getAudioMuted, toggleAudioMuted, setAudioMuted } from '../utils/audioAnnouncer';

export const QueueContext = createContext();

export function QueueProvider({ children }) {
  const [services, setServices] = useState([]);
  const [counters, setCounters] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [activeCounterId, setActiveCounterId] = useState(null);
  const [lastAnnouncedToken, setLastAnnouncedToken] = useState(null);
  const [isAudioMuted, setIsAudioMutedState] = useState(getAudioMuted());

  // Function to re-sync latest queue state from backend (Requirement 10)
  // API returns { success, count, data: [...] } — unwrap .data
  const syncQueueState = async () => {
    try {
      const [servicesRes, countersRes, tokensRes] = await Promise.all([
        serviceAPI.getActiveServices().catch(() => ({ data: [] })),
        queueAPI.getCounters().catch(() => ({ data: [] })),
        queueAPI.getTodayTokens().catch(() => ({ data: [] }))
      ]);

      const svcList = Array.isArray(servicesRes.data) ? servicesRes.data : [];
      const ctrList = Array.isArray(countersRes.data) ? countersRes.data : [];
      const tknList = Array.isArray(tokensRes.data) ? tokensRes.data : [];

      if (svcList.length > 0) setServices(svcList);
      if (ctrList.length > 0) {
        setCounters(ctrList);
        // Initialize activeCounterId to first real counter if not yet set
        const firstValidId = ctrList[0]?.id || ctrList[0]?._id;
        setActiveCounterId(prev => (prev && prev !== 'cnt-1' && ctrList.some(c => (c.id || c._id) === prev)) ? prev : firstValidId);
      }
      if (tknList.length > 0 || tokensRes.success) setTokens(tknList);
    } catch (err) {
      console.warn('Queue synchronization warning:', err);
    }
  };

  // Listen for audio mute toggle across components
  useEffect(() => {
    const handleMuteChange = (e) => {
      setIsAudioMutedState(e.detail.isMuted);
    };
    window.addEventListener('smartqueue_audio_mute_changed', handleMuteChange);
    return () => window.removeEventListener('smartqueue_audio_mute_changed', handleMuteChange);
  }, []);

  const toggleMute = () => {
    const nextMuted = toggleAudioMuted();
    setIsAudioMutedState(nextMuted);
    return nextMuted;
  };

  // Synchronize state changes to localStorage
  useEffect(() => {
    localStorage.setItem('smartqueue_tokens_v1', JSON.stringify(tokens));
  }, [tokens]);

  useEffect(() => {
    localStorage.setItem('smartqueue_counters_v1', JSON.stringify(counters));
  }, [counters]);

  // Fetch initial data from backend
  useEffect(() => {
    syncQueueState();
  }, []);

  // Compute stats
  const totalToday = tokens.length;
  const waitingTokens = tokens.filter(t => t.status === 'WAITING');
  const servingTokens = tokens.filter(t => t.status === 'SERVING');
  const completedTokens = tokens.filter(t => t.status === 'COMPLETED');
  const skippedTokens = tokens.filter(t => t.status === 'SKIPPED');

  const avgWaitMinutes = tokens.length > 0
    ? Math.round(tokens.reduce((acc, t) => acc + (t.waitMinutes || 10), 0) / tokens.length)
    : 12;

  // Helper: resolve serviceId whether it's a populated object or a raw string ID
  const resolveServiceId = (serviceId) => {
    if (!serviceId) return null;
    if (typeof serviceId === 'object') return serviceId.id || serviceId._id;
    return serviceId;
  };

  // Helper: resolve counterId whether it's a populated object or a raw string ID
  const resolveCounterId = (counterId) => {
    if (!counterId) return null;
    if (typeof counterId === 'object') return counterId.id || counterId._id;
    return counterId;
  };

  // Active counter object
  const activeCounter = counters.find(c => c.id === activeCounterId) || counters[0] || null;

  // Generate a new token via backend (expects only name & serviceId)
  const generateToken = async ({ customerName, serviceId }) => {
    try {
      const response = await tokenAPI.createToken(customerName, serviceId);
      // API returns { success, message, data: { token, service, waitingAhead, estimatedWaitMinutes } }
      const token = response?.data?.token || response?.data;
      if (!token) throw new Error('Invalid token response');

      // Enrich token object with service name and wait minutes for UI presentation
      const srvName = response?.data?.service?.name || services.find(s => s.id === serviceId)?.name || 'General Service';
      const waitMins = response?.data?.estimatedWaitMinutes || 10;
      token.serviceName = srvName;
      token.waitMinutes = waitMins;

      setTokens(prev => {
        const id = token.id || token._id;
        const exists = prev.some(t => (t.id || t._id) === id);
        return exists ? prev : [token, ...prev];
      });
      playChime();
      return token;
    } catch (err) {
      console.error('Failed to generate token:', err);
      throw err;
    }
  };

  // Call Next Token via backend
  const callNext = async (counterId = activeCounterId) => {
    try {
      const targetCounterId = counterId || activeCounterId || counters[0]?.id || counters[0]?._id;
      const response = await adminAPI.callNextToken(targetCounterId, null);
      if (!response.success || !response.data) {
        return { success: false, message: response.message || 'No waiting tokens in the queue.' };
      }
      const token = response.data;
      const counter = counters.find(c => String(c.id || c._id) === String(targetCounterId)) || { id: targetCounterId, name: 'Counter 1' };
      const counterName = counter.name || token?.counterId?.name || 'Counter';

      // Local optimistic update
      setTokens(prev => {
        const tokenId = String(token.id || token._id);
        const exists = prev.some(t => String(t.id || t._id) === tokenId);
        if (exists) {
          return prev.map(t => (String(t.id || t._id) === tokenId ? { ...t, ...token, status: 'SERVING', counterNumber: counterName } : t));
        }
        return [{ ...token, status: 'SERVING', counterNumber: counterName }, ...prev];
      });

      if (targetCounterId) {
        setCounters(prev => prev.map(c => (String(c.id || c._id) === String(targetCounterId) ? { ...c, currentToken: token.tokenNumber, status: 'OPEN' } : c)));
      }

      setLastAnnouncedToken({ tokenNumber: token.tokenNumber, counterNumber: counterName });
      announceToken(token.tokenNumber, counterName);
      return { success: true, token, counter };
    } catch (err) {
      console.error('Call next token failed:', err);
      return { success: false, message: err.message || 'Error calling next token' };
    }
  };

  // Complete token via backend
  const completeToken = async (tokenId) => {
    try {
      const response = await adminAPI.completeToken(tokenId);
      const updatedToken = response.data || { id: tokenId, status: 'COMPLETED' };
      const targetId = String(tokenId || updatedToken.id || updatedToken._id);
      setTokens(prev => prev.map(t => (String(t.id || t._id) === targetId ? { ...t, status: 'COMPLETED', ...updatedToken } : t)));
      const cId = updatedToken.counterId?.id || updatedToken.counterId?._id || updatedToken.counterId || activeCounterId;
      if (cId) {
        setCounters(prev => prev.map(c => (String(c.id || c._id) === String(cId) ? { ...c, currentToken: null } : c)));
      }
      return { success: true, data: updatedToken };
    } catch (err) {
      console.error('Complete token error:', err);
      return { success: false, message: err.message || 'Failed to complete token.' };
    }
  };

  // Skip token via backend
  const skipToken = async (tokenId) => {
    try {
      const response = await adminAPI.skipToken(tokenId);
      const updatedToken = response.data || { id: tokenId, status: 'SKIPPED' };
      const targetId = String(tokenId || updatedToken.id || updatedToken._id);
      setTokens(prev => prev.map(t => (String(t.id || t._id) === targetId ? { ...t, status: 'SKIPPED', ...updatedToken } : t)));
      const cId = updatedToken.counterId?.id || updatedToken.counterId?._id || updatedToken.counterId || activeCounterId;
      if (cId) {
        setCounters(prev => prev.map(c => (String(c.id || c._id) === String(cId) ? { ...c, currentToken: null } : c)));
      }
      return { success: true, data: updatedToken };
    } catch (err) {
      console.error('Skip token error:', err);
      return { success: false, message: err.message || 'Failed to skip token.' };
    }
  };

  // Socket.IO real‑time listeners and reconnection handler
  useEffect(() => {
    // 1. Token Issued event
    const handleTokenIssued = (payload) => {
      const token = payload?.token || payload;
      if (!token) return;
      if (payload.service?.name) token.serviceName = payload.service.name;
      if (payload.estimatedWaitMinutes) token.waitMinutes = payload.estimatedWaitMinutes;

      setTokens(prev => {
        const tokenId = token.id || token._id;
        const exists = prev.some(t => (t.id || t._id) === tokenId);
        if (exists) return prev;
        return [token, ...prev];
      });
      playChime();
    };

    // 2. Token Called event
    const handleTokenCalled = (payload) => {
      const token = payload?.token || payload;
      const counter = payload?.counter;
      const counterId = counter?.id || counter?._id || token?.counterId;
      const counterName = counter?.name || token?.counterId?.name || 'Counter';

      if (!token) return;

      setTokens(prev => prev.map(t => {
        if ((t.id || t._id) === (token.id || token._id)) {
          return { ...t, ...token, status: 'SERVING', counterNumber: counterName };
        }
        return t;
      }));

      if (counterId) {
        setCounters(prev => prev.map(c => {
          if (c.id === counterId || c._id === counterId) {
            return { ...c, currentToken: token.tokenNumber, status: 'OPEN' };
          }
          return c;
        }));
      }

      setLastAnnouncedToken({ tokenNumber: token.tokenNumber, counterNumber: counterName });
      announceToken(token.tokenNumber, counterName);
    };

    // 3. Token Completed event
    const handleTokenCompleted = (payload) => {
      const token = payload?.token || payload;
      if (!token) return;

      setTokens(prev => prev.map(t => {
        if ((t.id || t._id) === (token.id || token._id)) {
          return { ...t, ...token, status: 'COMPLETED' };
        }
        return t;
      }));

      const counterId = token.counterId?.id || token.counterId?._id || token.counterId;
      if (counterId) {
        setCounters(prev => prev.map(c => {
          if (c.id === counterId || c._id === counterId) {
            return { ...c, currentToken: null };
          }
          return c;
        }));
      }
    };

    // 4. Token Skipped event
    const handleTokenSkipped = (payload) => {
      const token = payload?.token || payload;
      if (!token) return;

      setTokens(prev => prev.map(t => {
        if ((t.id || t._id) === (token.id || token._id)) {
          return { ...t, ...token, status: 'SKIPPED' };
        }
        return t;
      }));

      const counterId = token.counterId?.id || token.counterId?._id || token.counterId;
      if (counterId) {
        setCounters(prev => prev.map(c => {
          if (c.id === counterId || c._id === counterId) {
            return { ...c, currentToken: null };
          }
          return c;
        }));
      }
    };

    // 5. Reconnection state synchronization (Requirement 10)
    const handleConnect = () => {
      console.log('[QueueContext] Socket connected/reconnected. Resyncing queue state...');
      syncQueueState();
    };

    socket.on('TOKEN_ISSUED', handleTokenIssued);
    socket.on('TOKEN_CALLED', handleTokenCalled);
    socket.on('TOKEN_COMPLETED', handleTokenCompleted);
    socket.on('TOKEN_SKIPPED', handleTokenSkipped);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('TOKEN_ISSUED', handleTokenIssued);
      socket.off('TOKEN_CALLED', handleTokenCalled);
      socket.off('TOKEN_COMPLETED', handleTokenCompleted);
      socket.off('TOKEN_SKIPPED', handleTokenSkipped);
      socket.off('connect', handleConnect);
    };
  }, []);
  // Recall Token (repeat audio announcement)
  const recallToken = (tokenNumber, counterNumber) => {
    announceToken(tokenNumber, counterNumber);
  };

  // Switch counter status (OPEN / ON_BREAK / CLOSED)
  const setCounterStatus = (counterId, status) => {
    setCounters(prev =>
      prev.map(c => (c.id === counterId ? { ...c, status } : c))
    );
  };

  // Reset to fresh data from backend
  const resetToMockData = () => {
    localStorage.removeItem('smartqueue_tokens_v1');
    localStorage.removeItem('smartqueue_counters_v1');
    setTokens([]);
    setCounters([]);
    // Re‑fetch
    const fetchInit = async () => {
      try {
        const servicesRes = await serviceAPI.getActiveServices();
        setServices(servicesRes.data || servicesRes || []);
        const countersRes = await queueAPI.getCounters();
        setCounters(countersRes.data || countersRes || []);
        const tokensRes = await queueAPI.getTodayTokens();
        setTokens(tokensRes.data || tokensRes || []);
      } catch (err) {
        console.error('Failed to reload data after reset:', err);
      }
    };
    fetchInit();
  };

  return (
    <QueueContext.Provider
      value={{
        services,
        counters,
        tokens,
        activeCounterId,
        setActiveCounterId,
        activeCounter,
        totalToday,
        waitingTokens,
        waitingCount: waitingTokens.length,
        servingTokens,
        servingCount: servingTokens.length,
        completedTokens,
        completedCount: completedTokens.length,
        skippedTokens,
        skippedCount: skippedTokens.length,
        avgWaitMinutes,
        generateToken,
        callNext,
        completeToken,
        skipToken,
        recallToken,
        setCounterStatus,
        resetToMockData,
        lastAnnouncedToken,
        isAudioMuted,
        toggleMute,
        syncQueueState,
        resolveServiceId,
        resolveCounterId
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export { useQueue } from '../hooks/useQueue';
