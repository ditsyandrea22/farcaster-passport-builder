export function useFrameContext() {
  const [frameContext, setFrameContext] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function detectFrame() {
      try {
        // Check for Farcaster SDK
        if (window.farcasterSDK) {
          const context = window.farcasterSDK.context;
          if (context) {
            setFrameContext(context);
            setIsLoading(false);
            return;
          }
        }

        // Check for frame context in window
        if ((window as any).frameContext) {
          setFrameContext((window as any).frameContext);
          setIsLoading(false);
          return;
        }

        // Check parent window for frame context
        try {
          if (window.parent !== window && (window.parent as any).frameContext) {
            setFrameContext((window.parent as any).frameContext);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          // Cross-origin, ignore
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Frame detection error:', error);
        setIsLoading(false);
      }
    }

    detectFrame();
  }, []);

  return { frameContext, isLoading };
}
