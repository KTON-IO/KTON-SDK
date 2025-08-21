import { ApyHistory } from 'tonapi-sdk-js';
import { NftItem } from 'tonapi-sdk-js';

declare interface IWalletConnector {
    wallet: {
        account?: WalletAccount;
    };
    sendTransaction: (transactionDetails: TransactionDetails) => Promise<SendTransactionResponse>;
    onStatusChange: (callback: (wallet: any) => void) => void;
}

export declare class KTON extends EventTarget {
    private connector;
    private client;
    private walletAddress?;
    private stakingContractAddress?;
    private partnerCode;
    private static jettonWalletAddress?;
    private tonApiKey?;
    private cache;
    ready: boolean;
    isTestnet: boolean;
    constructor({ connector, partnerCode, tonApiKey, cacheFor, isTestnet, }: KTONOptions);
    private getPayouts;
    private setupClient;
    private initialize;
    private deinitialize;
    private setupWallet;
    fetchStakingPoolInfo(ttl?: number): Promise<{
        state: number;
        halted: boolean;
        totalBalance: bigint;
        interestRate: number;
        optimisticDepositWithdrawals: boolean;
        depositsOpen: boolean;
        instantWithdrawalFee: number;
        savedValidatorSetHash: bigint;
        previousRound: {
            borrowers: string | undefined;
            roundId: number;
            activeBorrowers: bigint;
            borrowed: bigint;
            expected: bigint;
            returned: bigint;
            profit: bigint;
        };
        currentRound: {
            borrowers: string;
            roundId: number;
            activeBorrowers: bigint;
            borrowed: bigint;
            expected: bigint;
            returned: bigint;
            profit: bigint;
        };
        minLoan: bigint;
        maxLoan: bigint;
        governanceFee: number;
        accruedGovernanceFee: bigint;
        disbalanceTolerance: number;
        creditStartPriorElectionsEnd: number;
        poolJettonMinter: string;
        poolJettonSupply: bigint;
        supply: bigint;
        depositPayout: string | null;
        requestedForDeposit: bigint;
        withdrawalPayout: string | null;
        requestedForWithdrawal: bigint;
        sudoer: string | null;
        sudoerSetAt: number;
        governor: string;
        governorUpdateAfter: number;
        interestManager: string;
        halter: string;
        approver: string;
        controllerCode: string | undefined;
        jettonWalletCode: string | undefined;
        payoutMinterCode: string | undefined;
        projectedTotalBalance: bigint;
        projectedPoolSupply: bigint;
    }>;
    getCurrentApy(ttl?: number): Promise<number>;
    getHistoricalApy(ttl?: number): Promise<ApyHistory[]>;
    getTvl(ttl?: number): Promise<number>;
    private fetchJettonMasterInfo;
    getHoldersCount(ttl?: number): Promise<number>;
    getStakersCount(ttl?: number): Promise<number>;
    getRates(ttl?: number): Promise<any>;
    clearStorageData(): Promise<void>;
    clearStorageUserData(): Promise<void>;
    private getTonPrice;
    getStakedBalance(ttl?: number): Promise<number>;
    getBalance(ttl?: number): Promise<number>;
    getAvailableBalance(ttl?: number): Promise<number>;
    getInstantLiquidityDeprecated(ttl?: number): Promise<number>;
    getInstantLiquidity(ttl?: number): Promise<number>;
    stake(amount: number): Promise<SendTransactionResponse>;
    stakeMax(): Promise<SendTransactionResponse>;
    unstake(amount: number): Promise<SendTransactionResponse>;
    unstakeInstant(amount: number): Promise<SendTransactionResponse>;
    unstakeBestRate(amount: number): Promise<SendTransactionResponse>;
    getActiveWithdrawalNFTs(ttl?: number): Promise<NftItemWithEstimates[]>;
    private getFilteredByAddressNFTs;
    private preparePayload;
    private getJettonWalletAddress;
    private validateAmount;
    private sendTransaction;
    getRoundTimestamps(): Promise<{
        roundStart: number;
        roundEnd: number;
    }>;
    static toReadableAddress(address: string, bounceable?: boolean): string;
}

declare interface KTONOptions {
    connector: IWalletConnector;
    partnerCode?: number;
    tonApiKey?: string;
    cacheFor?: number;
    isTestnet?: boolean;
}

declare interface NftItemWithEstimates extends NftItem {
    estimatedPayoutDateTime: number;
    roundEndTime: number;
    KTONAmount: number;
}

declare interface SendTransactionResponse {
    boc: string;
}

declare interface TransactionDetails {
    validUntil: number;
    messages: TransactionMessage[];
}

declare interface TransactionMessage {
    address: string;
    amount: string;
    payload: string;
}

declare interface WalletAccount {
    address: string;
    chain: string;
}

export { }
