// CRITICAL: Call sdk.actions.ready() IMMEDIATELY
// This MUST be one of the first things that runs on the page
// If not called, Farcaster will show an infinite loading splash screen
(function() {
  'use strict';

  console.log('🚀 SDK Ready Script: Starting initialization...');

  function tryReady(source) {
    try {
      if (typeof window === 'undefined') return false;

      // Look for SDK in all possible locations (READ-ONLY - don't try to set properties)
      var sdk = null;
      var location = '';

      if (window.farcaster && window.farcaster.sdk) {
        sdk = window.farcaster.sdk;
        location = 'window.farcaster.sdk';
      }
      else if (window.__FARCASTER__ && window.__FARCASTER__.sdk) {
        sdk = window.__FARCASTER__.sdk;
        location = 'window.__FARCASTER__.sdk';
      }
      else if (window.__MINIAPP__ && window.__MINIAPP__.sdk) {
        sdk = window.__MINIAPP__.sdk;
        location = 'window.__MINIAPP__.sdk';
      }

      if (!sdk) {
        console.log('⏳ SDK not found yet (' + source + ')');
        return false;
      }

      console.log('✅ SDK found at: ' + location + ' (' + source + ')');

      // Check if ready() exists
      if (!sdk.actions || typeof sdk.actions.ready !== 'function') {
        console.log('⏳ SDK found but ready() not available yet (' + source + ')');
        return false;
      }

      // CALL READY - THIS IS CRITICAL
      console.log('🚀 CALLING sdk.actions.ready() (' + source + ')');
      
      try {
        var result = sdk.actions.ready();
        
        // Handle both sync and async
        if (result && typeof result.then === 'function') {
          result
            .then(function() {
              console.log('✅ sdk.actions.ready() SUCCESS (promise)');
              window.__sdk_ready_called__ = true;
              window.__miniapp_ready__ = true;
            })
            .catch(function(err) {
              console.warn('⚠️ sdk.actions.ready() rejected:', err);
              window.__sdk_ready_called__ = true;
            });
        } else {
          console.log('✅ sdk.actions.ready() called synchronously');
          window.__sdk_ready_called__ = true;
          window.__miniapp_ready__ = true;
        }
        
        return true;
      } catch (callErr) {
        console.warn('⚠️ Error calling ready():', callErr);
        return false;
      }
    } catch (err) {
      console.error('❌ Error in tryReady:', err);
      return false;
    }
  }

  // Stage 1: Try immediately on script load
  console.log('📍 Stage 1: Attempting immediately...');
  if (tryReady('immediate')) {
    return;
  }

  // Stage 2: Try if document is already interactive
  if (document.readyState !== 'loading') {
    console.log('📍 Stage 2: Document already interactive, trying now...');
    if (tryReady('interactive')) {
      return;
    }
  }

  // Stage 3: Try on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function onDCL() {
      console.log('📍 Stage 3: DOMContentLoaded - trying...');
      if (tryReady('DOMContentLoaded')) {
        return;
      }
    });
  }

  // Stage 4: Try on window load
  window.addEventListener('load', function() {
    console.log('📍 Stage 4: Window load event - trying...');
    if (tryReady('load')) {
      return;
    }
  });

  // Stage 5: Polling with exponential backoff
  var pollAttempt = 0;
  var maxPolls = 100;
  
  var pollInterval = setInterval(function() {
    pollAttempt++;
    
    if (tryReady('poll-' + pollAttempt)) {
      console.log('✅ SUCCESS on poll attempt ' + pollAttempt);
      clearInterval(pollInterval);
      return;
    }
    
    if (pollAttempt >= maxPolls) {
      console.log('⏹️ Stopped polling after ' + maxPolls + ' attempts');
      clearInterval(pollInterval);
      
      if (!window.__sdk_ready_called__) {
        console.warn('⚠️ WARNING: sdk.actions.ready() was never called. Users may see a loading screen.');
      }
      return;
    }
  }, 100);

  console.log('✅ SDK Ready Script: Initialization complete');
})();