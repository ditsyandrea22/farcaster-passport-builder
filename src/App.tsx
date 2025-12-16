import { useEffect } from 'react';
import { useFrameContext } from './hooks/useFrameContext';

function App() {
  const { frameContext, isLoading } = useFrameContext();

  useEffect(() => {
    // Initialize mini app if in frame context
    if (!isLoading && frameContext) {
      console.log('Mini app initialized in Farcaster frame', frameContext);
      // Initialize your mini app here
    }
  }, [frameContext, isLoading]);

  return (
    <div className="App">
      {/* Your existing app code */}
    </div>
  );
}

export default App;