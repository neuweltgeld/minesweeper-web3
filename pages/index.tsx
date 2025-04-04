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
  const [isShaking, setIsShaking] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

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
    if (!signer) {
      console.error('No signer found');
      return;
    }
    
    try {
      console.log('Starting purchase with amount:', purchaseAmount);
      
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI.abi,
        signer
      );

      // Her oyun için 0.001 ETH
      const amountPerGame = ethers.parseEther('0.001');
      const totalAmount = amountPerGame * BigInt(purchaseAmount);

      console.log('Contract initialized, sending transaction...');
      console.log('Amount per game:', amountPerGame.toString());
      console.log('Total amount:', totalAmount.toString());
      
      // İşlem başladığında loading durumunu göster
      setShowPurchaseModal(false);
      setShowLoadingModal(true);
      
      const tx = await contract.purchaseGames(purchaseAmount, {
        value: totalAmount,
      });

      console.log('Transaction sent, waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      // İşlem başarılı olduğunda loading modalını kapat
      setShowLoadingModal(false);
      
      // Başarılı ödeme ve hak ekleme
      await fetch(`/api/player/${address}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'add', amount: purchaseAmount }),
      });

      console.log('Player info updated');
      fetchPlayerInfo();
      
      // Başarılı işlem modalını göster
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
    } catch (error) {
      console.error('Error purchasing game:', error);
      setShowLoadingModal(false);
      setShowErrorModal(true);
      setTimeout(() => {
        setShowErrorModal(false);
      }, 3000);
    }
  };

  const handlePurchaseAmountChange = (change: number) => {
    const maxPurchasable = 10 - remainingGames;
    const newAmount = Math.max(1, Math.min(maxPurchasable, purchaseAmount + change));
    setPurchaseAmount(newAmount);
  };

  const startGameWithCheck = async () => {
    if (!address) {
      console.error('No address found');
      return;
    }

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
    if (!address) {
      console.error('No address found');
      return;
    }

    if (!gameState.won) {
      console.error('Game not won, cannot save score');
      return;
    }

    console.log('Saving score:', {
      address,
      score: gameState.score
    });

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

      console.log('API Response:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        return;
      }

      const data = await response.json();
      console.log('API Data:', data);

      if (!data.isNewHighScore) {
        setShowGameOver(false);
        setShowHighScoreModal(true);
        return;
      }

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

  const handleEndGame = () => {
    setGameState(prev => ({
      ...prev,
      started: false,
      gameOver: false,
      won: false
    }));
    setShowEndGameModal(false);
  };

  useEffect(() => {
    if (gameState.gameOver && !gameState.won) {
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setShowGameOver(true);
      }, 500);
    } else if (gameState.gameOver && gameState.won) {
      setShowGameOver(true);
    } else {
      setShowGameOver(false);
    }
  }, [gameState.gameOver, gameState.won]);

  const handlePlayAgain = () => {
    if (remainingGames <= 0) {
      setShowPurchaseModal(true);
      return;
    }
    startGameWithCheck();
  };

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
                    Add Energy
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
                          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 font-pixel overflow-hidden whitespace-nowrap border-r-2 border-purple-500 animate-typing w-0">
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
                      <div className={`space-y-4 ${isShaking ? 'animate-shake' : ''}`}>
                        {gameState.started && (
                          <div className="flex justify-between items-center mb-4">
                            <div className="text-pink-400 font-pixel">Time: {gameState.time}s</div>
                            <button
                              onClick={() => setShowEndGameModal(true)}
                              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-red-500/50 transition-all duration-300 font-pixel"
                            >
                              End Game
                            </button>
                          </div>
                        )}
                        <GameBoard
                          board={gameState.board}
                          onCellClick={handleCellClick}
                          onCellRightClick={handleCellRightClick}
                        />
                      </div>
                      {showGameOver && (
                        <div className="fixed inset-0 flex flex-col items-center justify-center z-50">
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
                          <div className="bg-gray-900 p-8 rounded-lg text-center space-y-4 border border-purple-500/30">
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
                                onClick={handlePlayAgain}
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
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-center font-pixel">Purchase Games</h2>
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => handlePurchaseAmountChange(-1)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-pixel disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={purchaseAmount <= 1}
              >
                -
              </button>
              <span className="text-xl font-pixel">{purchaseAmount}</span>
              <button
                onClick={() => handlePurchaseAmountChange(1)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-pixel disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={purchaseAmount >= (10 - remainingGames)}
              >
                +
              </button>
            </div>
            <div className="text-center mb-6 font-pixel">
              Total Cost: {(0.001 * purchaseAmount).toFixed(3)} STT
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-pixel"
              >
                Cancel
              </button>
              <button
                onClick={purchaseGame}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded font-pixel disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!signer || remainingGames + purchaseAmount > 10}
              >
                Purchase
              </button>
            </div>
          </div>
        </div>
      )}
      {showEndGameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full border border-purple-500/30">
            <h2 className="text-2xl font-bold mb-4 text-center font-pixel">End Game</h2>
            <p className="text-center mb-6 font-pixel text-gray-300">Are you sure you want to end the game? Your score will not be saved.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowEndGameModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-pixel"
              >
                Cancel
              </button>
              <button
                onClick={handleEndGame}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded font-pixel"
              >
                End Game
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Loading Modal */}
      {showLoadingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full border border-purple-500/30 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-300 font-pixel">Processing your payment...</p>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full border border-purple-500/30 text-center">
            <div className="text-green-500 text-4xl mb-4">✓</div>
            <p className="text-gray-300 font-pixel">Payment successful! Energy added.</p>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full border border-purple-500/30 text-center">
            <div className="text-red-500 text-4xl mb-4">✕</div>
            <p className="text-gray-300 font-pixel">Payment failed. Please try again.</p>
          </div>
        </div>
      )}

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-2xl w-full border border-purple-500/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-center font-pixel">How to Play</h2>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4 text-gray-300 font-pixel">
              <p>Welcome to Minesweeper! Here's how to play:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Click on any cell to reveal it. Numbers indicate how many mines are adjacent to that cell.</li>
                <li>Right-click to flag potential mine locations.</li>
                <li>Avoid clicking on mines! If you hit a mine, the game is over.</li>
                <li>Clear all non-mine cells to win the game.</li>
                <li>Your score is based on the time taken and cells revealed.</li>
                <li>You have limited energy (game rights) to play. Purchase more to continue playing.</li>
              </ul>
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <h3 className="text-purple-400 font-bold mb-2">Tips:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Start with corners and edges - they're safer!</li>
                  <li>Use numbers to deduce mine locations.</li>
                  <li>Flag mines when you're certain about their location.</li>
                  <li>Take your time - there's no rush!</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discord and How to Play Buttons */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setShowHowToPlay(true)}
          className="group relative flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg border border-purple-500/30 transition-all duration-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-pixel">How to Play</span>
          <div className="absolute right-0 bottom-full mb-2 w-64 p-2 bg-gray-900 rounded-lg border border-purple-500/30 text-sm text-gray-300 font-pixel opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Learn how to play Minesweeper!
          </div>
        </button>

        <a
          href="https://discord.gg/kHdTzzbe"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg border border-purple-500/30 transition-all duration-300"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          <span className="font-pixel">Discord</span>
          <div className="absolute right-0 bottom-full mb-2 w-64 p-2 bg-gray-900 rounded-lg border border-purple-500/30 text-sm text-gray-300 font-pixel opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Join our Discord community for bug reports, feedback, and discussions!<br/>
            <span className="text-purple-400">@irlandali_turist</span>
          </div>
        </a>
      </div>

      {showHighScoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-lg text-center space-y-4 border border-purple-500/30">
            <div className={`text-2xl font-bold ${isNewHighScore ? 'text-green-400' : 'text-yellow-400'} font-pixel`}>
              {isNewHighScore ? 'New High Score!' : 'Score Not Saved'}
            </div>
            <div className="text-gray-300 text-lg font-pixel">
              {isNewHighScore ? `Your Score: ${gameState.score}` : 'Your score is lower than your previous best.'}
            </div>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  setShowHighScoreModal(false);
                  setGameState(prev => ({
                    ...prev,
                    started: false,
                    gameOver: false,
                    won: false
                  }));
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/50 font-pixel"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 