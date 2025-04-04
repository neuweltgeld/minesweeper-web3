import { useState, useEffect } from 'react';
import { useAccount, useBalance, useWalletClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { GameBoard } from '../components/GameBoard';
import { Leaderboard } from '../components/Leaderboard';
import { HowToPlay } from '../components/HowToPlay';
import { useGame } from '../hooks/useGame';
import { LeaderboardEntry } from '../types/game';
import dynamic from 'next/dynamic';
import Confetti from 'react-confetti';
import { ethers } from 'ethers';
import contractABI from '../contracts/Minesweeper.json';

const ConfettiDynamic = dynamic(() => import('react-confetti'), {
  ssr: false
});

export default function Home() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });
  const { data: signer } = useWalletClient();
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const { gameState, userStats, startGame: _startGame, handleCellClick, handleCellRightClick, setGameState } = useGame();
  const [remainingGames, setRemainingGames] = useState(10);
  const [lastResetTime, setLastResetTime] = useState<Date | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const [showNoGamesModal, setShowNoGamesModal] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(1);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showHighScoreModal, setShowHighScoreModal] = useState(false);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLeaderboard = localStorage.getItem('minesweeper_leaderboard');
    if (savedLeaderboard) {
      setLeaderboard(JSON.parse(savedLeaderboard));
    }
  }, []);

  useEffect(() => {
    if (address) {
      fetchPlayerInfo();
    }
  }, [address]);

  useEffect(() => {
    if (lastResetTime) {
      const timer = setInterval(() => {
        const now = new Date();
        const resetTime = new Date(lastResetTime);
        resetTime.setHours(resetTime.getHours() + 24);
        
        const diff = resetTime.getTime() - now.getTime();
        if (diff <= 0) {
          fetchPlayerInfo();
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeUntilReset(`${hours}h ${minutes}m`);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [lastResetTime]);

  const fetchPlayerInfo = async () => {
    try {
      const response = await fetch(`/api/player/${address}`);
      const data = await response.json();
      setRemainingGames(data.remainingGames);
      setLastResetTime(new Date(data.lastResetTime));
    } catch (error) {
      console.error('Error fetching player info:', error);
    }
  };

  const purchaseGame = async () => {
    if (!signer) return;
    
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI.abi,
        signer
      );

      const tx = await contract.purchaseGames(purchaseAmount, {
        value: ethers.parseEther((0.001 * purchaseAmount).toString()),
      });

      await tx.wait();
      
      await fetch(`/api/player/${address}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'add', amount: purchaseAmount }),
      });

      fetchPlayerInfo();
      setShowPurchaseModal(false);
    } catch (error) {
      console.error('Error purchasing game:', error);
    }
  };

  const handlePurchaseAmountChange = (change: number) => {
    const maxPurchasable = 10 - remainingGames;
    const newAmount = Math.max(1, Math.min(maxPurchasable, purchaseAmount + change));
    setPurchaseAmount(newAmount);
  };

  const startGameWithCheck = async () => {
    try {
      const response = await fetch(`/api/player/${address}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'use' }),
      });

      if (!response.ok) {
        setShowNoGamesModal(true);
        return;
      }

      _startGame();
      fetchPlayerInfo();
    } catch (error) {
      console.error('Error starting game:', error);
      setShowNoGamesModal(true);
    }
  };

  const saveScore = async () => {
    if (!address) return;

    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          score: gameState.score,
        }),
      });

      const data = await response.json();
      setIsNewHighScore(data.isNewHighScore);
      setShowHighScoreModal(true);

      if (data.isNewHighScore) {
        const newEntry: LeaderboardEntry = {
          address,
          score: gameState.score,
          date: new Date().toISOString()
        };

        const savedLeaderboard = localStorage.getItem('minesweeper_leaderboard');
        let leaderboard: LeaderboardEntry[] = savedLeaderboard ? JSON.parse(savedLeaderboard) : [];

        leaderboard = leaderboard.filter(entry => entry.address !== address);
        leaderboard.push(newEntry);

        const updatedLeaderboard = leaderboard
          .sort((a, b) => b.score - a.score)
          .slice(0, 20);

        setLeaderboard(updatedLeaderboard);
        localStorage.setItem('minesweeper_leaderboard', JSON.stringify(updatedLeaderboard));
      }
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  const handleGameOver = async () => {
    // Oyun bitişinde hak düşme işlemini kaldırıyoruz
    // Çünkü başlangıçta zaten düşüyor
  };

  useEffect(() => {
    if (gameState.gameOver) {
      handleGameOver();
    }
  }, [gameState.gameOver]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-8">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 font-pixel animate-gradient-x mb-8">
              Minesweeper
            </h1>
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                return (
                  <div
                    {...(!mounted && {
                      'aria-hidden': true,
                      style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!mounted || !account || !chain) {
                        return (
                          <button
                            onClick={openConnectModal}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all duration-300 font-pixel text-xl transform hover:scale-105"
                          >
                            Connect Wallet
                          </button>
                        );
                      }
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 font-pixel animate-gradient-x">
                Minesweeper
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 relative group">
                    <div className="text-gray-400 font-pixel">Games:</div>
                    <div className="text-xl text-purple-500 animate-pulse">⚡</div>
                    <div className="text-purple-400 font-pixel w-8 text-center">{remainingGames}</div>
                    {timeUntilReset && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 px-2 py-1 rounded text-sm text-gray-400 font-pixel opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                        Reset in: {timeUntilReset}
                      </div>
                    )}
                  </div>
                </div>
                {remainingGames < 10 && (
                  <button
                    onClick={() => setShowPurchaseModal(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all duration-300 font-pixel"
                  >
                    Buy Game (0.001 STT)
                  </button>
                )}
                <ConnectButton.Custom>
                  {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    mounted,
                  }) => {
                    return (
                      <div
                        {...(!mounted && {
                          'aria-hidden': true,
                          style: {
                            opacity: 0,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          },
                        })}
                      >
                        {(() => {
                          if (!mounted || !account || !chain) {
                            return (
                              <button
                                onClick={openConnectModal}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all duration-300 font-pixel"
                              >
                                Connect Wallet
                              </button>
                            );
                          }

                          if (chain.unsupported) {
                            return (
                              <button
                                onClick={openChainModal}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-red-500/50 transition-all duration-300 font-pixel"
                              >
                                Wrong Network
                              </button>
                            );
                          }

                          return (
                            <div className="flex gap-4">
                              <button
                                onClick={openChainModal}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all duration-300 font-pixel"
                              >
                                {chain.name}
                              </button>
                              <button
                                onClick={openAccountModal}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all duration-300 font-pixel"
                              >
                                {account.displayName}
                              </button>
                              {balance && (
                                <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-purple-500/50 font-pixel">
                                  {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="w-3/5">
                <div className="max-w-md mx-auto">
                  {!gameState.started ? (
                    <div className="space-y-8">
                      <div className="text-center space-y-4">
                        <div className="flex justify-center">
                          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 font-pixel overflow-hidden whitespace-nowrap border-r-2 border-purple-500 animate-typing w-fit">
                            Welcome to Minesweeper!
                          </h2>
                        </div>
                        <div className="flex justify-center space-x-4 animate-bounce">
                          <div className="text-4xl">💣</div>
                          <div className="text-4xl">🚩</div>
                          <div className="text-4xl">💎</div>
                        </div>
                        <p className="text-gray-400 font-pixel">
                          Test your skills in this classic game
                        </p>
                      </div>
                      <div className="flex flex-col items-center space-y-4">
                        <button
                          onClick={startGameWithCheck}
                          className="w-full max-w-xs bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all duration-300 font-pixel text-xl transform hover:scale-105"
                        >
                          Start Game
                        </button>
                        <div className="text-sm text-gray-500 font-pixel animate-pulse">
                          Click to begin your adventure!
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-8">
                        <div className="bg-gray-800 p-4 rounded-lg border border-purple-500/50 text-center">
                          <div className="text-2xl mb-2">⏱️</div>
                          <div className="text-purple-400 font-pixel">Fast Time</div>
                          <div className="text-sm text-gray-400 font-pixel">Beat the clock!</div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg border border-purple-500/50 text-center">
                          <div className="text-2xl mb-2">🏆</div>
                          <div className="text-purple-400 font-pixel">High Score</div>
                          <div className="text-sm text-gray-400 font-pixel">Top the leaderboard!</div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg border border-purple-500/50 text-center">
                          <div className="text-2xl mb-2">💎</div>
                          <div className="text-purple-400 font-pixel">Earn XP</div>
                          <div className="text-sm text-gray-400 font-pixel">Level up your skills!</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className={`space-y-4 ${gameState.gameOver ? 'opacity-50' : ''}`}>
                        <div className="flex justify-between items-center mb-4">
                          <div className="text-pink-400 font-pixel">Time: {gameState.time}s</div>
                          <button
                            onClick={() => setShowEndGameModal(true)}
                            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-red-500/50 transition-all duration-300 font-pixel"
                          >
                            End Game
                          </button>
                        </div>
                        <GameBoard
                          board={gameState.board}
                          onCellClick={handleCellClick}
                          onCellRightClick={handleCellRightClick}
                        />
                      </div>
                      {gameState.gameOver && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          {gameState.won && (
                            <div className="fixed inset-0 pointer-events-none">
                              <ConfettiDynamic
                                width={window.innerWidth}
                                height={window.innerHeight}
                                recycle={false}
                                numberOfPieces={500}
                                gravity={0.3}
                              />
                            </div>
                          )}
                          <div className="bg-black bg-opacity-70 p-8 rounded-lg text-center space-y-4 backdrop-blur-sm">
                            <div className={`text-2xl font-bold ${gameState.won ? 'text-green-400' : 'text-red-400'} font-pixel`}>
                              {gameState.won ? 'Congratulations! You Won!' : 'Game Over!'}
                            </div>
                            {!gameState.won && (
                              <div className="text-6xl animate-bounce">💀</div>
                            )}
                            <div className="text-gray-300 text-lg font-pixel">
                              Your Score: {gameState.score}
                            </div>
                            <div className="flex flex-col gap-4">
                              {gameState.won && (
                                <button
                                  onClick={saveScore}
                                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/50 font-pixel"
                                >
                                  Save Score
                                </button>
                              )}
                              <button
                                onClick={startGameWithCheck}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/50 font-pixel"
                              >
                                Play Again
                              </button>
                              <button
                                onClick={() => {
                                  setGameState(prev => ({
                                    ...prev,
                                    started: false,
                                    gameOver: false,
                                    won: false
                                  }));
                                }}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg font-pixel"
                              >
                                Back to Home
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-1/3">
                <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-purple-500 sticky top-4">
                  <h2 className="text-xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 font-pixel">
                    Top Scores
                  </h2>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-400 font-pixel">
                          <th className="p-2">#</th>
                          <th className="p-2">Address</th>
                          <th className="p-2">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((entry, index) => (
                          <tr key={entry.address} className="text-sm hover:bg-gray-700 font-pixel">
                            <td className="p-2">{index + 1}</td>
                            <td className="p-2 text-purple-400">{entry.address.slice(0, 6)}...{entry.address.slice(-4)}</td>
                            <td className="p-2">{entry.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <HowToPlay />
    </div>
  );
} 