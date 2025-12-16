// CRITICAL: Call sdk.actions.ready() IMMEDIATELY - DO NOT DELAY
// This MUST be one of the first things that runs on the page
// If not called, Farcaster will show an infinite loading splash screen
(function() {
  'use strict';

  // Log exactly what we're trying to do
  console.log('🔍 SDK Ready Script: Starting...');

  function tryReady(source) {
    try {
      // Look for SDK in all possible locations
      var sdk = null;
      var found = false;

      if (window.farcaster && window.farcaster.sdk) {
        sdk = window.farcaster.sdk;
        found = true;
        console.log('✅ Found SDK at: window.farcaster.sdk (' + source + ')');
      }
      else if (window.__FARCASTER__ && window.__FARCASTER__.sdk) {
        sdk = window.__FARCASTER__.sdk;
        found = true;
        console.log('✅ Found SDK at: window.__FARCASTER__.sdk (' + source + ')');
      }
      else if (window.__MINIAPP__ && window.__MINIAPP__.sdk) {
        sdk = window.__MINIAPP__.sdk;
        found = true;
        console.log('✅ Found SDK at: window.__MINIAPP__.sdk (' + source + ')');
      }

      if (!found) {
        console.log('⏳ SDK not found yet (' + source + ')');
        return false;
      }

      // Log SDK context info if available
      if (sdk.context) {
        console.log('📋 SDK Context Available:', {
          hasUser: !!sdk.context.user,
          hasClient: !!sdk.context.client,
          hasLocation: !!sdk.context.location,
          user: sdk.context.user,
          client: sdk.context.client
        });
      } else {
        console.log('⏳ SDK.context not available yet (' + source + ')');
      }

      // Check if ready() method exists
      if (!sdk.actions || !sdk.actions.ready) {
        console.log('⏳ SDK found but ready() not available (' + source + ')');
        return false;
      }

      // CALL READY IMMEDIATELY - BOTH SYNC AND ASYNC
      console.log('🚀 CALLING sdk.actions.ready() NOW! (' + source + ')');
      
      try {
        // Try to call synchronously first
        var result = sdk.actions.ready();
        
        // If it's a promise, handle it
        if (result && typeof result.then === 'function') {
          result
            .then(function() {
              console.log('✅ sdk.actions.ready() SUCCEEDED (promise resolved) (' + source + ')');
              window.__miniapp_ready__ = true;
              window.__sdk_ready_called__ = true;
            })
            .catch(function(err) {
              console.warn('⚠️ sdk.actions.ready() promise rejected (' + source + '):', err);
            });
        } else {
          // Synchronous success
          console.log('✅ sdk.actions.ready() CALLED SYNCHRONOUSLY (' + source + ')');
          window.__miniapp_ready__ = true;
          window.__sdk_ready_called__ = true;
        }
        
        return true;
      } catch (callErr) {
        console.warn('⚠️ Error calling sdk.actions.ready() (' + source + '):', callErr);
        return false;
      }
    } catch (err) {
      console.warn('⚠️ Error in tryReady (' + source + '):', err);
      return false;
    }
  }

  // STAGE 1: Try immediately on script load
  console.log('📍 Stage 1: Trying immediately...');
  if (tryReady('immediate')) {
    console.log('✅ SUCCESS at Stage 1!');
    return;
  }

  // STAGE 2: Try on document interactive
  if (document.readyState !== 'loading') {
    console.log('📍 Stage 2: Trying on interactive...');
    if (tryReady('interactive')) {
      console.log('✅ SUCCESS at Stage 2!');
    }
  }

  // STAGE 3: Try on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      console.log('📍 Stage 3: Trying on DOMContentLoaded...');
      if (tryReady('DOMContentLoaded')) {
        console.log('✅ SUCCESS at Stage 3!');
      }
    });
  }

  // STAGE 4: Try on load event
  window.addEventListener('load', function() {
    console.log('📍 Stage 4: Trying on load event...');
    if (tryReady('load')) {
      console.log('✅ SUCCESS at Stage 4!');
    }
  });

  // STAGE 5: Rapid polling - try every 10ms for first 100ms
  console.log('📍 Stage 5: Starting rapid polling...');
  var pollCount = 0;
  var pollInterval = setInterval(function() {
    pollCount++;
    if (tryReady('poll-' + pollCount)) {
      console.log('✅ SUCCESS at Stage 5 (poll ' + pollCount + ')!');
      clearInterval(pollInterval);
      return;
    }
    
    // Stop polling after 100 tries (1 second)
    if (pollCount >= 100) {
      console.log('⏹️ Stopped polling after 100 attempts');
      clearInterval(pollInterval);
      
      // STAGE 6: Last resort - try every 500ms for 10 seconds total
      console.log('📍 Stage 6: Starting slow polling...');
      var slowPollCount = 0;
      var slowPollInterval = setInterval(function() {
        slowPollCount++;
        console.log('🔄 Slow poll attempt ' + slowPollCount + '...');
        if (tryReady('slow-poll-' + slowPollCount)) {
          console.log('✅ SUCCESS at Stage 6 (slow poll ' + slowPollCount + ')!');
          clearInterval(slowPollInterval);
        }
        
        if (slowPollCount >= 20) {
          console.log('⏹️ Stopped slow polling after 20 attempts');
          clearInterval(slowPollInterval);
          
          if (!window.__sdk_ready_called__) {
            console.error('❌ CRITICAL: sdk.actions.ready() was never called! SDK may not be available.');
          }
        }
      }, 500);
    }
  }, 10);

  // Simple SVG size fix (non-blocking)
  function fixSVGSizes() {
    try {
      var svgs = document.querySelectorAll('[width="small"], [width="medium"], [width="large"], [height="small"], [height="medium"], [height="large"]');
      var sizeMap = { 'small': 16, 'medium': 24, 'large': 32 };
      
      svgs.forEach(function(el) {
        var width = el.getAttribute('width');
        var height = el.getAttribute('height');
        
        if (width && width in sizeMap) {
          el.setAttribute('width', sizeMap[width].toString());
        }
        if (height && height in sizeMap) {
          el.setAttribute('height', sizeMap[height].toString());
        }
      });
    } catch (e) {
      // Silent fail
    }
  }

  // Fix SVG after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixSVGSizes);
  } else {
    setTimeout(fixSVGSizes, 100);
  }

  console.log('✅ SDK Ready Script: Initialization complete');
})();