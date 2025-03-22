import React from 'react';
import { useGameContext } from '@/context/GameContext';
import GameSelection from './GameSelection';
import ActiveGame from './ActiveGame';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

const Home: React.FC = () => {
  const { isGameActive, errorMessage, connectionError } = useGameContext();
  const { toast } = useToast();
  
  // Show error messages
  React.useEffect(() => {
    if (errorMessage) {
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [errorMessage, toast]);
  
  // Show connection errors
  React.useEffect(() => {
    if (connectionError) {
      toast({
        title: 'Connection Error',
        description: connectionError,
        variant: 'destructive',
      });
    }
  }, [connectionError, toast]);
  
  return (
    <div className="relative min-h-screen px-4 py-6 max-w-md mx-auto bg-gradient-to-br from-purple-500 to-indigo-700 text-white">
      {isGameActive ? <ActiveGame /> : <GameSelection />}
      <Toaster />
    </div>
  );
};

export default Home;
