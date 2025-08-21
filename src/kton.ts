import { Address, beginCell, toNano, fromNano } from "@ton/core";
import { Api, ApyHistory, HttpClient, NftItem } from "tonapi-sdk-js";
import { BLOCKCHAIN, CONTRACT, TIMING, API } from "./constants";
import { NetworkCache } from "./cache";
import { log } from "./utils";
import { parsePoolFullData } from "./pool";

export function toReadableAddress(
  address: string,
  bounceable: boolean = true
): string {
  try {
    const addr = Address.parse(address);
    return addr.toString({ urlSafe: true, bounceable });
  } catch {
    console.error("Invalid address format:", address);
    return address; // Return original if parsing fails
  }
}

interface SendTransactionResponse {
  boc: string;
}

interface TransactionMessage {
  address: string;
  amount: string;
  payload: string;
}

interface TransactionDetails {
  validUntil: number;
  messages: TransactionMessage[];
}

interface WalletAccount {
  address: string;
  chain: string;
}

interface IWalletConnector {
  wallet: { account?: WalletAccount };
  sendTransaction: (
    details: TransactionDetails
  ) => Promise<SendTransactionResponse>;
  onStatusChange: (cb: (wallet: unknown) => void) => void;
}

interface KTONOptions {
  connector: IWalletConnector;
  partnerCode?: number;
  tonApiKey?: string;
  cacheFor?: number;
  isTestnet?: boolean;
}

interface NftItemWithEstimates extends NftItem {
  estimatedPayoutDateTime: number;
  roundEndTime: number;
  KTONAmount: number;
}

export interface PayoutData {
  deposit_payout: string;
  deposit_amount: string;
  withdrawal_payout: string;
  withdrawal_amount: string;
  cycle_end: string;
}

class KTON extends EventTarget {
  private connector: IWalletConnector;
  private client!: Api<unknown>;
  private walletAddress?: Address;
  private stakingContractAddress?: Address;
  private partnerCode: number;
  private static jettonWalletAddress?: Address;
  private tonApiKey?: string;
  private cache: NetworkCache;
  public ready: boolean;
  public isTestnet: boolean;

  constructor({
    connector,
    partnerCode = CONTRACT.PARTNER_CODE,
    tonApiKey,
    cacheFor,
    isTestnet = false,
  }: KTONOptions) {
    super();
    this.connector = connector;
    this.partnerCode = partnerCode;
    this.tonApiKey = tonApiKey;
    this.cache = new NetworkCache(
      cacheFor === undefined ? TIMING.CACHE_TIMEOUT : cacheFor
    );
    this.ready = false;
    this.isTestnet = isTestnet;

    this.setupClient();
    this.initialize().catch(error => {
      console.error("Initialization error:", error);
    });
  }

  private async getPayouts(): Promise<PayoutData | undefined> {
    try {
      const parsedPoolFullData = await this.fetchStakingPoolInfo();

      // Calculate estimated cycle end based on current round info
      // This is an approximation based on standard TON validation rounds
      const currentTime = Math.floor(Date.now() / 1000);
      const estimatedCycleEnd = currentTime + 65536; // Estimated 18.2 hour cycle

      return {
        deposit_payout: parsedPoolFullData.depositPayout
          ? parsedPoolFullData.depositPayout.toString()
          : "",
        deposit_amount: parsedPoolFullData.requestedForDeposit.toString(),
        withdrawal_payout: parsedPoolFullData.withdrawalPayout
          ? parsedPoolFullData.withdrawalPayout.toString()
          : "",
        withdrawal_amount: parsedPoolFullData.requestedForWithdrawal.toString(),
        cycle_end: estimatedCycleEnd.toString(),
      };
    } catch (error) {
      console.error("Error fetching withdrawal payouts:", error);
      return undefined;
    }
  }

  private async setupClient(): Promise<void> {
    log("Setting up KTON SDK, isTestnet:", this.isTestnet);
    const baseApiParams = this.tonApiKey
      ? {
        headers: {
          Authorization: `Bearer ${this.tonApiKey}`,
          "Content-type": "application/json",
        },
      }
      : {};
    const httpClient = new HttpClient({
      baseUrl: this.isTestnet ? BLOCKCHAIN.API_URL_TESTNET : BLOCKCHAIN.API_URL,
      baseApiParams,
    });
    this.client = new Api(httpClient);
    this.stakingContractAddress = Address.parse(
      this.isTestnet
        ? CONTRACT.STAKING_CONTRACT_ADDRESS_TESTNET
        : CONTRACT.STAKING_CONTRACT_ADDRESS
    );
  }

  private async initialize(): Promise<void> {
    // Initialize with current wallet state if already connected
    if (this.connector.wallet?.account?.address) {
      try {
        await this.setupWallet(this.connector.wallet);
      } catch (error) {
        console.error("Error setting up wallet on init:", error);
        this.deinitialize();
      }
    }

    // Listen for wallet changes
    this.connector.onStatusChange(async wallet => {
      if (wallet && typeof wallet === "object" && "account" in wallet && wallet.account && typeof wallet.account === "object" && "address" in wallet.account && wallet.account.address) {
        try {
          await this.setupWallet(wallet);
          this.dispatchEvent(new Event("wallet_connected"));
        } catch (error) {
          console.error("Error in wallet status change:", error);
          this.deinitialize();
        }
      } else {
        this.deinitialize();
        this.dispatchEvent(new Event("wallet_disconnected"));
      }
    });
  }

  private deinitialize(): void {
    log("Deinitializing KTON...");
    this.walletAddress = undefined;
    KTON.jettonWalletAddress = undefined;
    this.dispatchEvent(new Event("deinitialized"));
  }

  private async setupWallet(wallet: unknown): Promise<void> {
    try {
      log("Setting up wallet for KTON...");

      if (!wallet || typeof wallet !== "object" || !("account" in wallet) || !wallet.account || typeof wallet.account !== "object" || !("address" in wallet.account) || !wallet.account.address) {
        throw new Error("No wallet account address provided");
      }

      const walletWithAccount = wallet as { account: WalletAccount };

      const walletIsTestnet = walletWithAccount.account.chain === BLOCKCHAIN.CHAIN_DEV;
      if (this.isTestnet !== walletIsTestnet) {
        log(`Network mismatch detected. SDK initialized for ${this.isTestnet ? "testnet" : "mainnet"}, but wallet is on ${walletIsTestnet ? "testnet" : "mainnet"}. Switching to wallet's network.`);
        this.isTestnet = walletIsTestnet;
        // Re-setup client with correct network after switching
        await this.setupClient();
      }

      // Clear any previous wallet state
      this.walletAddress = undefined;
      KTON.jettonWalletAddress = undefined;

      // Set up wallet address
      this.walletAddress = Address.parse(walletWithAccount.account.address);

      // Set up jetton wallet
      try {
        KTON.jettonWalletAddress = await this.getJettonWalletAddress(
          this.walletAddress
        );
      } catch (error) {
        console.warn(
          "Could not get jetton wallet address (user may not have staked yet), will retry on demand:",
          error
        );
      }

      // Set up API client
      await this.setupClient();

      this.ready = true;
      this.dispatchEvent(new Event("initialized"));
    } catch (error) {
      console.error("Error in setupWallet:", error);
      this.ready = false;
      const errorEvent = new Event("error") as Event & { detail: unknown };
      errorEvent.detail = error;
      this.dispatchEvent(errorEvent);
      throw error;
    }
  }

  async fetchStakingPoolInfo(ttl?: number) {
    const getPoolInfo = async () => {
      const poolFullData =
        await this.client.blockchain.execGetMethodForBlockchainAccount(
          this.stakingContractAddress!.toString(),
          "get_pool_full_data"
        );

      return parsePoolFullData(poolFullData.stack);
    };

    return this.cache.get("poolInfo", getPoolInfo, ttl);
  }

  async getCurrentApy(ttl?: number): Promise<number> {
    if (!this.stakingContractAddress)
      throw new Error("Staking contract address not set.");
    try {
      const response = await this.fetchStakingPoolInfo(ttl);

      const roundRoi =
        (response.interestRate / 2 ** 24) *
        (1 - response.governanceFee / 2 ** 24);
      const roundsPerYear = (365 * 24 * 60 * 60) / 65536;
      const apy = (roundRoi * roundsPerYear) / 2;

      return apy;
    } catch {
      console.error("Failed to get current APY");
      throw new Error("Could not retrieve current APY.");
    }
  }

  async getHistoricalApy(ttl?: number): Promise<ApyHistory[]> {
    const stakingAddress = this.stakingContractAddress;

    if (!stakingAddress) throw new Error("Staking contract address not set.");

    try {
      const stakingHistory = await this.cache.get(
        "stakingHistory",
        () =>
          this.client!.staking.getStakingPoolHistory(stakingAddress.toString()),
        ttl
      );
      return stakingHistory.apy;
    } catch {
      console.error("Failed to get historical APY");
      throw new Error("Could not retrieve historical APY.");
    }
  }

  async getTvl(ttl?: number): Promise<number> {
    if (!this.stakingContractAddress)
      throw new Error("Staking contract address not set.");
    try {
      const response = await this.fetchStakingPoolInfo(ttl);

      const tvl =
        response.totalBalance +
        response.currentRound.borrowed +
        response.previousRound.borrowed;

      return Number(tvl);
    } catch {
      console.error("Failed to get TVL");
      throw new Error("Could not retrieve TVL.");
    }
  }

  private async fetchJettonMasterInfo(jettonAddress: string): Promise<{ metadata?: { holdersCount?: number } }> {
    const url = `${API.TONCENTER_V3}/jetton/masters?address=${jettonAddress}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  }

  async getHoldersCount(ttl?: number): Promise<number> {
    if (!this.stakingContractAddress)
      throw new Error("Staking contract address not set.");
    try {
      const poolFullData = await this.fetchStakingPoolInfo(ttl);
      const jettonAddress = poolFullData.poolJettonMinter.toString();

      // Try new API first
      try {
        const jettonInfo = await this.cache.get(
          `jettonInfo-${jettonAddress}`,
          () => this.fetchJettonMasterInfo(jettonAddress),
          ttl
        );

        // Extract holders count from TonCenter API response
        if (jettonInfo.metadata && jettonInfo.metadata.holdersCount) {
          return jettonInfo.metadata.holdersCount;
        }

        // Skip jetton-index API in browser due to CORS
        if (typeof window === "undefined") {
          // Only try jetton-index API in Node.js environment
          const indexUrl = `${API.JETTON_INDEX}/jettons/${jettonAddress}`;
          const indexResponse = await fetch(indexUrl);
          if (indexResponse.ok) {
            const indexData = await indexResponse.json();
            if (indexData && typeof indexData === "object" && "details" in indexData && indexData.details && typeof indexData.details === "object" && "holdersCount" in indexData.details) {
              return (indexData.details as { holdersCount: number }).holdersCount;
            }
          }
        }
      } catch (newApiError) {
        console.warn("New API failed, falling back to TonAPI:", newApiError);
      }

      // Fallback to original TonAPI
      try {
        const response = await this.client.jettons.getJettonInfo(jettonAddress);
        return response.holders_count;
      } catch (tonApiError) {
        // If testnet, return 0 as jetton might not exist
        if (this.isTestnet) {
          console.warn("Jetton not found on testnet, returning 0 holders");
          return 0;
        }
        throw tonApiError;
      }
    } catch {
      console.error("Failed to get holders count");
      throw new Error("Could not retrieve holders count.");
    }
  }

  // Alias for backward compatibility
  async getStakersCount(ttl?: number): Promise<number> {
    return this.getHoldersCount(ttl);
  }

  async getRates(ttl?: number): Promise<{ TONUSD: number; KTONTON: number; KTONTONProjected: number }> {
    if (!this.stakingContractAddress)
      throw new Error("Staking contract address not set.");
    try {
      const poolData = await this.fetchStakingPoolInfo(ttl);

      const poolBalance = poolData.totalBalance;
      const poolSupply = poolData.supply;
      const KTONTON =
        Number(fromNano(poolBalance)) / Number(fromNano(poolSupply));

      const poolProjectedBalance = poolData.projectedTotalBalance;
      const poolProjectedSupply = poolData.projectedPoolSupply;
      const KTONTONProjected =
        Number(fromNano(poolProjectedBalance)) /
        Number(fromNano(poolProjectedSupply));

      const TONUSD = await this.getTonPrice(ttl);
      return {
        TONUSD,
        KTONTON,
        KTONTONProjected,
      };
    } catch {
      console.error("Failed to get rates");
      throw new Error("Could not retrieve rates.");
    }
  }

  async clearStorageData(): Promise<void> {
    this.cache.clear();
  }

  async clearStorageUserData(): Promise<void> {
    this.cache.clear([
      "network-cache-payouts",
      "network-cache-stakedBalance",
      "network-cache-account",
    ]);
  }

  private async getTonPrice(ttl?: number): Promise<number> {
    try {
      const response = await this.cache.get(
        "tonPrice",
        () =>
          this.client!.rates.getRates({
            tokens: ["ton"],
            currencies: ["usd"],
          }),
        ttl
      );

      const tonPrice = response && typeof response === "object" && "rates" in response && response.rates && typeof response.rates === "object" && "TON" in response.rates && response.rates.TON && typeof response.rates.TON === "object" && "prices" in response.rates.TON && response.rates.TON.prices && typeof response.rates.TON.prices === "object" && "USD" in response.rates.TON.prices ? (response.rates.TON.prices as { USD: number }).USD : 0;

      return tonPrice || 0;
    } catch {
      return 0;
    }
  }

  async getStakedBalance(ttl?: number): Promise<number> {
    if (!KTON.jettonWalletAddress) {
      // Jetton wallet might not exist if user hasn't staked yet
      log("Jetton wallet not available (user may not have staked yet), returning 0");
      return 0;
    }

    const addressString = KTON.jettonWalletAddress.toString();

    try {
      const jettonWalletData = await this.cache.get(
        `stakedBalance-${addressString}`,
        () =>
          this.client!.blockchain.execGetMethodForBlockchainAccount(
            addressString,
            "get_wallet_data"
          ),
        ttl
      );

      const formattedBalance = jettonWalletData && typeof jettonWalletData === "object" && "decoded" in jettonWalletData && jettonWalletData.decoded && typeof jettonWalletData.decoded === "object" && "balance" in jettonWalletData.decoded ? (jettonWalletData.decoded as { balance: number }).balance : 0;
      log(`Current KTON balance: ${formattedBalance}`);

      return formattedBalance;
    } catch {
      // Handle 404 errors gracefully (user may not have any KTON tokens yet)
      log("Jetton wallet data not found (user may not have staked yet), returning 0");
      return 0;
    }
  }

  async getBalance(ttl?: number): Promise<number> {
    const walletAddress = this.walletAddress;
    if (!walletAddress) throw new Error("Wallet is not connected.");

    try {
      const account = await this.cache.get(
        "account",
        () => this.client!.accounts.getAccount(walletAddress.toString()),
        ttl
      );

      return Math.max(Number(account && typeof account === "object" && "balance" in account ? (account as { balance: string | number }).balance : 0), 0);
    } catch {
      return 0;
    }
  }

  async getAvailableBalance(ttl?: number): Promise<number> {
    const walletAddress = this.walletAddress;
    if (!walletAddress) throw new Error("Wallet is not connected.");

    try {
      const balance = await this.getBalance(ttl);
      const availableBalance =
        balance - Number(toNano(CONTRACT.RECOMMENDED_FEE_RESERVE));

      return Math.max(availableBalance, 0);
    } catch {
      return 0;
    }
  }

  // this is not the real instant liquidity, but the balance of the staking contract
  // instant liquidity is the amount of TON that can be withdrawn immediately, so it should be `total_balance - requested_for_withdrawal`
  async getInstantLiquidityDeprecated(ttl?: number): Promise<number> {
    const account = await this.cache.get(
      "contract-account",
      () =>
        this.client!.accounts.getAccount(
          this.isTestnet
            ? CONTRACT.STAKING_CONTRACT_ADDRESS_TESTNET
            : CONTRACT.STAKING_CONTRACT_ADDRESS
        ),
      ttl
    );

    return account && typeof account === "object" && "balance" in account ? (account as { balance: number }).balance : 0;
  }

  async getInstantLiquidity(ttl?: number): Promise<number> {
    const poolFullData = await this.fetchStakingPoolInfo(ttl);
    const instantLiquidity =
      poolFullData.totalBalance - poolFullData.requestedForWithdrawal;
    return Number(instantLiquidity);
  }

  async stake(amount: number): Promise<SendTransactionResponse> {
    if (!this.walletAddress || !KTON.jettonWalletAddress)
      throw new Error("KTON is not fully initialized.");

    await this.validateAmount(amount);
    const totalAmount = toNano(amount + CONTRACT.STAKE_FEE_RES); // Includes transaction fee
    const payload = this.preparePayload("stake", amount);
    const result = await this.sendTransaction(
      this.stakingContractAddress!,
      totalAmount,
      payload
    );
    log(`Staked ${amount} TON successfully.`);
    return result;
  }

  async stakeMax(): Promise<SendTransactionResponse> {
    const availableBalance = await this.getAvailableBalance();
    const result = await this.stake(availableBalance);
    log(`Staked maximum amount of ${availableBalance} TON successfully.`);
    return result;
  }

  async unstake(amount: number): Promise<SendTransactionResponse> {
    if (!KTON.jettonWalletAddress)
      throw new Error("Jetton wallet address is not set.");
    await this.validateAmount(amount);
    const payload = this.preparePayload("unstake", amount);
    const result = await this.sendTransaction(
      KTON.jettonWalletAddress,
      toNano(CONTRACT.UNSTAKE_FEE_RES),
      payload
    ); // Includes transaction fee
    log(`Initiated unstaking of ${amount} KTON.`);
    return result;
  }

  async unstakeInstant(amount: number): Promise<SendTransactionResponse> {
    if (!KTON.jettonWalletAddress)
      throw new Error("Jetton wallet address is not set.");
    await this.validateAmount(amount);
    const payload = this.preparePayload("unstake", amount, false, true);
    const result = await this.sendTransaction(
      KTON.jettonWalletAddress,
      toNano(CONTRACT.UNSTAKE_FEE_RES),
      payload
    ); // Includes transaction fee
    log(`Initiated instant unstaking of ${amount} KTON.`);
    return result;
  }

  async unstakeBestRate(amount: number): Promise<SendTransactionResponse> {
    if (!KTON.jettonWalletAddress)
      throw new Error("Jetton wallet address is not set.");
    await this.validateAmount(amount);
    const payload = this.preparePayload("unstake", amount, true);
    const result = await this.sendTransaction(
      KTON.jettonWalletAddress,
      toNano(CONTRACT.UNSTAKE_FEE_RES),
      payload
    ); // Includes transaction fee
    log(`Initiated unstaking of ${amount} KTON at the best rate.`);
    return result;
  }

  async getActiveWithdrawalNFTs(ttl?: number): Promise<NftItemWithEstimates[]> {
    try {
      const payouts = await this.cache.get(
        "payouts",
        () => this.getPayouts(),
        ttl
      );
      if (!payouts) {
        throw new Error("Failed to get payouts.");
      }

      const nfts = [];
      if (payouts.deposit_payout) {
        const nft = await this.cache.get(
          `payouts-${payouts.deposit_payout}`,
          () =>
            this.getFilteredByAddressNFTs(
              payouts.withdrawal_payout,
              Number(payouts.cycle_end)
            ),
          ttl
        );
        nfts.push(nft);
      }
      if (payouts.withdrawal_payout) {
        const nft = await this.cache.get(
          `payouts-${payouts.withdrawal_payout}`,
          () =>
            this.getFilteredByAddressNFTs(
              payouts.withdrawal_payout,
              Number(payouts.cycle_end)
            ),
          ttl
        );
        nfts.push(nft);
      }

      return nfts.reduce((acc, val) => acc.concat(val), []);
    } catch (error) {
      console.error(
        "Failed to get active withdrawals:",
        error instanceof Error ? error.message : error
      );
      throw new Error("Failed to get active withdrawals.");
    }
  }

  private async getFilteredByAddressNFTs(
    payoutAddress: string,
    endDate: number
  ): Promise<NftItemWithEstimates[]> {
    try {
      const payoutNftCollection =
        await this.client.nft.getItemsFromCollection(payoutAddress);
      const endDateInSeconds = Math.floor(endDate / 1000);
      const filteredItems: NftItemWithEstimates[] = [];
      let itemsBeforeCount = 0;

      for (const item of payoutNftCollection.nft_items) {
        if (item.owner?.address === this.walletAddress?.toRawString()) {
          const positionBasedTime =
            itemsBeforeCount * TIMING.ESTIMATED_TIME_BW_TX_S;
          const estimatedPayoutTimeInSeconds =
            endDateInSeconds +
            positionBasedTime +
            TIMING.ESTIMATED_TIME_AFTER_ROUND_S;

          filteredItems.push({
            ...item,
            estimatedPayoutDateTime: estimatedPayoutTimeInSeconds,
            roundEndTime: endDateInSeconds,
            KTONAmount: Number(item.metadata.name?.match(/[\d.]+/)[0]) || 0,
          });
        }
        itemsBeforeCount++;
      }

      return filteredItems;
    } catch (error) {
      console.error("Failed to get withdrawal history:", error);
      return [];
    }
  }

  private preparePayload(
    operation: "stake" | "unstake",
    amount: number,
    waitTillRoundEnd: boolean = false,
    fillOrKill: boolean = false
  ): string {
    const cell = beginCell();

    switch (operation) {
    case "stake":
      cell.storeUint(CONTRACT.PAYLOAD_STAKE, 32);
      cell.storeUint(1, 64).storeUint(this.partnerCode, 64);
      break;
    case "unstake":
      cell.storeUint(CONTRACT.PAYLOAD_UNSTAKE, 32);
      cell
        .storeUint(0, 64)
        .storeCoins(toNano(amount))
        .storeAddress(this.walletAddress!)
        .storeMaybeRef(
          beginCell()
            .storeUint(Number(waitTillRoundEnd), 1)
            .storeUint(Number(fillOrKill), 1)
            .endCell()
        );
      break;
    }

    return cell.endCell().toBoc().toString("base64");
  }

  private async getJettonWalletAddress(
    walletAddress: Address
  ): Promise<Address> {
    try {
      const responsePool = await this.fetchStakingPoolInfo();
      const jettonMinterAddress = responsePool.poolJettonMinter;

      if (!jettonMinterAddress) {
        throw new Error("No jetton minter address found in pool info");
      }

      const responseJetton =
        await this.client.blockchain.execGetMethodForBlockchainAccount(
          jettonMinterAddress.toString(),
          "get_wallet_address",
          { args: [walletAddress.toString()] }
        );

      if (!responseJetton?.decoded?.jetton_wallet_address) {
        throw new Error("Invalid response when getting jetton wallet address");
      }

      return Address.parse(responseJetton.decoded.jetton_wallet_address);
    } catch (error) {
      console.error(
        "Failed to get jetton wallet address:",
        error instanceof Error ? error.message : error
      );
      throw new Error(
        `Could not retrieve jetton wallet address: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async validateAmount(amount: number): Promise<void> {
    if (typeof amount !== "number" || amount <= 0) {
      throw new Error("Invalid amount specified");
    }
  }

  private sendTransaction(
    address: Address,
    amount: bigint,
    payload: string
  ): Promise<SendTransactionResponse> {
    const validUntil = +new Date() + TIMING.TIMEOUT;
    const transaction: TransactionDetails = {
      validUntil,
      messages: [
        {
          address: address.toString(),
          amount: amount.toString(),
          payload,
        },
      ],
    };
    return this.connector.sendTransaction(transaction);
  }

  async getRoundTimestamps(): Promise<{
    roundStart: number;
    roundEnd: number;
  }> {
    try {
      // Estimate round timestamps based on TON blockchain validation cycles
      // TON validation rounds are approximately 18.2 hours (65536 seconds)
      const currentTime = Math.floor(Date.now() / 1000);
      const roundDuration = 65536; // seconds
      const estimatedRoundEnd = currentTime + roundDuration;
      const estimatedRoundStart = estimatedRoundEnd - roundDuration;

      return {
        roundStart: estimatedRoundStart,
        roundEnd: estimatedRoundEnd,
      };
    } catch (error) {
      console.error("Error calculating round timestamps", error);
      return {
        roundStart: 0,
        roundEnd: 0,
      };
    }
  }

  static toReadableAddress(
    address: string,
    bounceable: boolean = true
  ): string {
    return Address.parse(address).toString({ bounceable });
  }
}

export { KTON };
