// /logs/browser-logger.js
// Logger para capturar errores del navegador (excluyendo YouTube y extensiones)

class BrowserLogger {
  constructor() {
    this.logs = [];
    this.sessionId = this.getSessionId();
    this.isRecording = true;
    this.maxLogs = 50;
    this.sendInterval = 10000; // 10 segundos
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };
    
    // ============================================
    // PATRONES A IGNORAR (NO se guardan)
    // ============================================
    this.ignoredPatterns = [
      // YouTube y relacionados
      /youtube/i,
      /yt\./i,
      /googlevideo/i,
      /www\.youtube\.com/i,
      /youtube-nocookie\.com/i,
      /ytimg\.com/i,
      /youtu\.be/i,
      
      // Extensiones de Chrome/Chromium
      /chrome-extension:\/\//i,
      /extension/i,
      /extensions/i,
      /moz-extension:\/\//i,
      /safari-web-extension/i,
      /edge-extension:\/\//i,
      /chrome:\/\/extensions/i,
      /chrome:\/\/newtab/i,
      
      // Errores comunes del navegador (no relevantes)
      /cross-origin/i,
      /CORS/i,
      /Failed to load resource/i,
      /net::ERR_/i,
      /Unchecked runtime\.lastError/i,
      /Extension context invalidated/i,
      /The message port closed/i,
      /ResizeObserver loop/i,
      /Script error\./i,
      /Third-party cookie/i,
      /cookie will be rejected/i,
      /Content Security Policy/i,
      /manifest\.json/i,
      /favicon\.ico/i,
      /safari/i,
      /firefox/i,
      
      // Errores de red genéricos
      /Network Error/i,
      /network error/i,
      /ECONNREFUSED/i,
      /ENOTFOUND/i,
      /ETIMEDOUT/i,
      
      // Archivos específicos de extensiones
      /content_reporter\.js/i,
      /background\.js/i,
      /content\.js/i,
      /inject\.js/i,
      /browser-polyfill/i,
      /vendor\.js/i,
      /content-script/i,
      
      // Errores de React/DevTools (no relevantes)
      /Download the React DevTools/i,
      /ReactDOM/i,
      /development mode/i
    ];
    
    if (this.isRecording) {
      this.interceptConsole();
      this.startPeriodicSend();
      this.catchGlobalErrors();
      this.interceptNetworkErrors();
      console.log('[Logger] Iniciado - Solo logs del sitio (excluye YouTube y extensiones)');
    }
  }
  
  getSessionId() {
    let id = sessionStorage.getItem('browser_logger_session_id');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      sessionStorage.setItem('browser_logger_session_id', id);
    }
    return id;
  }
  
  shouldIgnore(message) {
    if (!message) return true;
    
    const messageStr = String(message);
    
    if (messageStr.length === 0 || messageStr.length < 5) return true;
    
    if (messageStr.includes('chrome-extension://')) return true;
    if (messageStr.includes('moz-extension://')) return true;
    
    for (const pattern of this.ignoredPatterns) {
      if (pattern.test(messageStr)) {
        return true;
      }
    }
    
    return false;
  }
  
  interceptConsole() {
    const self = this;
    
    const addLog = (level, args) => {
      if (!self.isRecording) return;
      
      const message = args.map(arg => {
        try {
          if (arg instanceof Error) {
            return `${arg.name}: ${arg.message}\n${arg.stack?.substring(0, 500)}`;
          }
          if (typeof arg === 'object') {
            return JSON.stringify(arg, null, 2);
          }
          return String(arg);
        } catch (e) {
          return '[Unstringifiable object]';
        }
      }).join(' ');
      
      if (self.shouldIgnore(message)) {
        return;
      }
      
      const trimmedMessage = message.length > 1000 ? message.substring(0, 1000) + '...' : message;
      
      self.logs.push({
        level: level,
        message: trimmedMessage,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
      
      if (self.logs.length > self.maxLogs) {
        self.logs.shift();
      }
    };
    
    console.log = (...args) => {
      this.originalConsole.log.apply(console, args);
      addLog('log', args);
    };
    
    console.error = (...args) => {
      this.originalConsole.error.apply(console, args);
      addLog('error', args);
    };
    
    console.warn = (...args) => {
      this.originalConsole.warn.apply(console, args);
      addLog('warn', args);
    };
    
    console.info = (...args) => {
      this.originalConsole.info.apply(console, args);
      addLog('info', args);
    };
  }
  
  catchGlobalErrors() {
    const self = this;
    
    window.addEventListener('error', (event) => {
      const errorMsg = `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
      
      if (self.shouldIgnore(errorMsg)) return;
      
      self.logs.push({
        level: 'error',
        message: errorMsg.substring(0, 500),
        timestamp: new Date().toISOString(),
        type: 'uncaught_error',
        url: window.location.href,
        filename: event.filename,
        line: event.lineno
      });
      
      if (self.logs.length > self.maxLogs) {
        self.logs.shift();
      }
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      let errorMsg = `Unhandled Promise Rejection: `;
      
      if (reason instanceof Error) {
        errorMsg += `${reason.name}: ${reason.message}`;
      } else {
        errorMsg += String(reason);
      }
      
      if (self.shouldIgnore(errorMsg)) return;
      
      self.logs.push({
        level: 'error',
        message: errorMsg.substring(0, 500),
        timestamp: new Date().toISOString(),
        type: 'unhandled_rejection',
        url: window.location.href
      });
      
      if (self.logs.length > self.maxLogs) {
        self.logs.shift();
      }
    });
  }
  
  interceptNetworkErrors() {
    const originalFetch = window.fetch;
    const self = this;
    
    window.fetch = function(...args) {
      return originalFetch.apply(this, args).catch(error => {
        const errorMsg = `Fetch error: ${error.message} for ${args[0]}`;
        
        if (!self.shouldIgnore(errorMsg)) {
          self.logs.push({
            level: 'error',
            message: errorMsg.substring(0, 500),
            timestamp: new Date().toISOString(),
            type: 'fetch_error',
            url: window.location.href
          });
          
          if (self.logs.length > self.maxLogs) {
            self.logs.shift();
          }
        }
        
        throw error;
      });
    };
    
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
      this.addEventListener('error', function() {
        const errorMsg = `XHR error for ${this.responseURL}`;
        
        if (!self.shouldIgnore(errorMsg)) {
          self.logs.push({
            level: 'error',
            message: errorMsg,
            timestamp: new Date().toISOString(),
            type: 'xhr_error',
            url: window.location.href
          });
        }
      });
      return originalXHROpen.apply(this, arguments);
    };
  }
  
  startPeriodicSend() {
    setInterval(() => {
      if (this.logs.length > 0) {
        this.sendLogs();
      }
    }, this.sendInterval);
  }
  
  async sendLogs() {
    if (!this.logs.length) return;
    
    const logsToSend = [...this.logs];
    this.logs = [];
    
    try {
      const user = window.authSystem?.getCurrentUser ? window.authSystem.getCurrentUser() : null;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/logs/browser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user?._id || ''
        },
        body: JSON.stringify({
          logs: logsToSend,
          sessionId: this.sessionId,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          screenResolution: `${screen.width}x${screen.height}`
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`[Logger] Enviados ${logsToSend.length} logs`);
      
    } catch (error) {
      this.logs = [...logsToSend, ...this.logs];
      if (this.logs.length > this.maxLogs * 2) {
        this.logs = this.logs.slice(-this.maxLogs);
      }
      
      if (!this.lastErrorTime || Date.now() - this.lastErrorTime > 30000) {
        console.warn('[Logger] Error enviando logs:', error.message);
        this.lastErrorTime = Date.now();
      }
    }
  }
  
  async flush() {
    await this.sendLogs();
  }
  
  getCurrentLogs() {
    return [...this.logs];
  }
  
  getStats() {
    return {
      logsInMemory: this.logs.length,
      sessionId: this.sessionId,
      maxLogs: this.maxLogs
    };
  }
}

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const checkAuth = setInterval(() => {
      if (typeof window.authSystem !== 'undefined' && window.authSystem) {
        clearInterval(checkAuth);
        window.browserLogger = new BrowserLogger();
      }
    }, 100);
    
    setTimeout(() => {
      if (!window.browserLogger) {
        clearInterval(checkAuth);
        window.browserLogger = new BrowserLogger();
      }
    }, 5000);
  });
}