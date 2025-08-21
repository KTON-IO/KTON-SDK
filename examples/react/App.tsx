import React, { useState, useEffect, useCallback } from 'react';
import { KTON } from 'kton-sdk';
import { TonConnectUI } from '@tonconnect/ui';

interface WalletData {
  tonBalance: number;
  stakedBalance: number;
  availableBalance: number;
}

interface AnalyticsData {
  apy: number;
  tvl: number;
  holdersCount: number;
}

const App: React.FC = () => {
  const [kton, setKton] = useState<KTON | null>(null);
  const [tonConnectUI, setTonConnectUI] = useState<TonConnectUI | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [walletData, setWalletData] = useState<WalletData>({
    tonBalance: 0,
    stakedBalance: 0,
    availableBalance: 0,
  });
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    apy: 0,
    tvl: 0,
    holdersCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' }>({ text: '', type: 'info' });

  // Initialize KTON SDK
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        const tonConnectInstance = new TonConnectUI({
          manifestUrl: 'https://raw.githubusercontent.com/rainboltz/kton-sdk/main/examples/react/manifest.json'
        });
        
        setTonConnectUI(tonConnectInstance);

        const ktonInstance = new KTON({
          connector: tonConnectInstance,
          partnerCode: 888888,
          isTestnet: false,
        });

        // Set up event listeners
        ktonInstance.addEventListener('initialized', () => {
          showMessage('KTON SDK initialized', 'success');
          setIsConnected(true);
          refreshData();
        });

        ktonInstance.addEventListener('deinitialized', () => {
          showMessage('KTON SDK deinitialized', 'error');
          setIsConnected(false);
        });

        ktonInstance.addEventListener('wallet_connected', () => {
          showMessage('Wallet connected', 'success');
          setIsConnected(true);
          refreshData();
        });

        ktonInstance.addEventListener('wallet_disconnected', () => {
          showMessage('Wallet disconnected', 'error');
          setIsConnected(false);
        });

        setKton(ktonInstance);
      } catch (error) {
        showMessage(`Failed to initialize SDK: ${(error as Error).message}`, 'error');
      }
    };

    initializeSDK();
  }, []);

  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: 'info' }), 5000);
  }, []);

  const refreshData = useCallback(async () => {
    if (!kton || !isConnected) return;

    setLoading(true);
    try {
      // Refresh wallet data
      const [tonBalance, stakedBalance, availableBalance] = await Promise.all([
        kton.getBalance(),
        kton.getStakedBalance(),
        kton.getAvailableBalance(),
      ]);

      setWalletData({
        tonBalance: tonBalance / 1e9,
        stakedBalance: stakedBalance / 1e9,
        availableBalance: availableBalance / 1e9,
      });

      // Refresh analytics
      const [apy, tvl, holdersCount] = await Promise.all([
        kton.getCurrentApy(),
        kton.getTvl(),
        kton.getHoldersCount(),
      ]);

      setAnalytics({
        apy: apy * 100,
        tvl: tvl / 1e9,
        holdersCount,
      });
    } catch (error) {
      showMessage(`Failed to refresh data: ${(error as Error).message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [kton, isConnected, showMessage]);

  const handleStake = async (amount: number) => {
    if (!kton) return;

    try {
      setLoading(true);
      showMessage('Staking in progress...', 'info');
      await kton.stake(amount);
      showMessage('Stake transaction sent successfully!', 'success');
      setTimeout(refreshData, 2000);
    } catch (error) {
      showMessage(`Staking failed: ${(error as Error).message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async (amount: number, type: 'standard' | 'instant' | 'best' = 'standard') => {
    if (!kton) return;

    try {
      setLoading(true);
      showMessage(`${type} unstaking in progress...`, 'info');
      
      switch (type) {
        case 'instant':
          await kton.unstakeInstant(amount);
          break;
        case 'best':
          await kton.unstakeBestRate(amount);
          break;
        default:
          await kton.unstake(amount);
      }
      
      showMessage('Unstake transaction sent successfully!', 'success');
      setTimeout(refreshData, 2000);
    } catch (error) {
      showMessage(`Unstaking failed: ${(error as Error).message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    if (tonConnectUI) {
      try {
        await tonConnectUI.connectWallet();
      } catch (error) {
        showMessage(`Failed to connect wallet: ${(error as Error).message}`, 'error');
      }
    }
  };

  const disconnectWallet = async () => {
    if (tonConnectUI) {
      try {
        await tonConnectUI.disconnect();
      } catch (error) {
        showMessage(`Failed to disconnect wallet: ${(error as Error).message}`, 'error');
      }
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>🚀 KTON SDK - React Example</h1>
      
      {message.text && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '20px',
          borderRadius: '4px',
          backgroundColor: message.type === 'success' ? '#e8f5e8' : message.type === 'error' ? '#ffe8e8' : '#e8f4f8',
          color: message.type === 'success' ? '#2e7d32' : message.type === 'error' ? '#d32f2f' : '#1976d2'
        }}>
          {message.text}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h2>🔗 Wallet Connection</h2>
        {!isConnected ? (
          <button onClick={connectWallet} style={{ padding: '10px 20px' }}>
            Connect Wallet
          </button>
        ) : (
          <button onClick={disconnectWallet} style={{ padding: '10px 20px' }}>
            Disconnect Wallet
          </button>
        )}
      </div>

      {isConnected && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <h2>💰 Balances</h2>
            <button onClick={refreshData} disabled={loading} style={{ padding: '10px 20px', marginBottom: '10px' }}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
              <div>TON Balance: {walletData.tonBalance.toFixed(4)} TON</div>
              <div>Staked Balance: {walletData.stakedBalance.toFixed(4)} KTON</div>
              <div>Available Balance: {walletData.availableBalance.toFixed(4)} TON</div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h2>📊 Analytics</h2>
            <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
              <div>Current APY: {analytics.apy.toFixed(2)}%</div>
              <div>TVL: {analytics.tvl.toFixed(0)} TON</div>
              <div>Holders Count: {analytics.holdersCount.toLocaleString()}</div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h2>🔄 Staking Operations</h2>
            <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
              <div style={{ marginBottom: '10px' }}>
                <input 
                  type="number" 
                  placeholder="Amount to stake" 
                  id="stakeAmount"
                  style={{ padding: '8px', marginRight: '10px' }}
                />
                <button 
                  onClick={() => {
                    const amount = parseFloat((document.getElementById('stakeAmount') as HTMLInputElement).value);
                    if (amount > 0) handleStake(amount);
                  }}
                  disabled={loading}
                  style={{ padding: '8px 16px' }}
                >
                  Stake
                </button>
              </div>
              
              <div>
                <input 
                  type="number" 
                  placeholder="Amount to unstake" 
                  id="unstakeAmount"
                  style={{ padding: '8px', marginRight: '10px' }}
                />
                <button 
                  onClick={() => {
                    const amount = parseFloat((document.getElementById('unstakeAmount') as HTMLInputElement).value);
                    if (amount > 0) handleUnstake(amount, 'standard');
                  }}
                  disabled={loading}
                  style={{ padding: '8px 16px', marginRight: '5px' }}
                >
                  Unstake
                </button>
                <button 
                  onClick={() => {
                    const amount = parseFloat((document.getElementById('unstakeAmount') as HTMLInputElement).value);
                    if (amount > 0) handleUnstake(amount, 'instant');
                  }}
                  disabled={loading}
                  style={{ padding: '8px 16px', marginRight: '5px' }}
                >
                  Instant Unstake
                </button>
                <button 
                  onClick={() => {
                    const amount = parseFloat((document.getElementById('unstakeAmount') as HTMLInputElement).value);
                    if (amount > 0) handleUnstake(amount, 'best');
                  }}
                  disabled={loading}
                  style={{ padding: '8px 16px' }}
                >
                  Best Rate
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;