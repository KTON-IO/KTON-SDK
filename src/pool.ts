import type { TvmStackRecord } from "tonapi-sdk-js";
import { Cell } from "@ton/core";

function safeGetNumber(record: TvmStackRecord | undefined): number {
  if (record?.type !== "num") {
    return 0;
  }
  return Number(record.num);
}

function safeGetBigInt(record: TvmStackRecord | undefined): bigint {
  if (record?.type !== "num" || typeof record.num === "undefined") {
    return 0n;
  }
  return BigInt(record.num);
}

export function parsePoolFullData(stack: TvmStackRecord[]) {
  let index = 0;
  const new_contract_version = stack.length == 34;
  const state = safeGetNumber(stack[index++]);
  const halted = Boolean(safeGetNumber(stack[index++]));
  const totalBalance = safeGetBigInt(stack[index++]);
  const interestRate = safeGetNumber(stack[index++]);
  const optimisticDepositWithdrawals = Boolean(safeGetNumber(stack[index++]));
  const depositsOpen = Boolean(safeGetNumber(stack[index++]));
  let instantWithdrawalFee = 0;
  if (new_contract_version) {
    instantWithdrawalFee = safeGetNumber(stack[index++]);
  }
  const savedValidatorSetHash = safeGetBigInt(stack[index++]);

  let prvIndex = 0;
  const prv = stack[index++]?.tuple ?? [];
  const prvBorrowers = prv[prvIndex++]?.cell;
  const prvRoundId = safeGetNumber(prv[prvIndex++]);
  const prvActiveBorrowers = safeGetBigInt(prv[prvIndex++]);
  const prvBorrowed = safeGetBigInt(prv[prvIndex++]);
  const prvExpected = safeGetBigInt(prv[prvIndex++]);
  const prvReturned = safeGetBigInt(prv[prvIndex++]);
  const prvProfit = safeGetBigInt(prv[prvIndex++]);
  const previousRound = {
    borrowers: prvBorrowers,
    roundId: prvRoundId,
    activeBorrowers: prvActiveBorrowers,
    borrowed: prvBorrowed,
    expected: prvExpected,
    returned: prvReturned,
    profit: prvProfit,
  };

  let curIndex = 0;
  const cur = stack[index++]?.tuple ?? [];
  const curBorrowers = cur[curIndex++]?.cell ?? Cell.EMPTY;
  const curRoundId = safeGetNumber(cur[curIndex++]);
  const curActiveBorrowers = safeGetBigInt(cur[curIndex++]);
  const curBorrowed = safeGetBigInt(cur[curIndex++]);
  const curExpected = safeGetBigInt(cur[curIndex++]);
  const curReturned = safeGetBigInt(cur[curIndex++]);
  const curProfit = safeGetBigInt(cur[curIndex++]);
  const currentRound = {
    borrowers: curBorrowers.toString(),
    roundId: curRoundId,
    activeBorrowers: curActiveBorrowers,
    borrowed: curBorrowed,
    expected: curExpected,
    returned: curReturned,
    profit: curProfit,
  };

  const minLoan = safeGetBigInt(stack[index++]);
  const maxLoan = safeGetBigInt(stack[index++]);
  const governanceFee = safeGetNumber(stack[index++]);

  let accruedGovernanceFee = 0n;
  let disbalanceTolerance = 30;
  let creditStartPriorElectionsEnd = 0;
  if (new_contract_version) {
    accruedGovernanceFee = safeGetBigInt(stack[index++]);
    disbalanceTolerance = safeGetNumber(stack[index++]);
    creditStartPriorElectionsEnd = safeGetNumber(stack[index++]);
  }

  const poolJettonMinterCell = stack[index++]?.cell;
  const poolJettonMinter = poolJettonMinterCell
    ? Cell.fromHex(poolJettonMinterCell).beginParse().loadAddress().toString()
    : "";
  const poolJettonSupply = safeGetBigInt(stack[index++]);

  const depositPayoutCell = stack[index++]?.cell;
  const depositPayout = depositPayoutCell
    ? Cell.fromHex(depositPayoutCell).beginParse().loadAddressAny()
    : null;
  const requestedForDeposit = safeGetBigInt(stack[index++]);

  const withdrawalPayoutCell = stack[index++]?.cell;
  const withdrawalPayout = withdrawalPayoutCell
    ? Cell.fromHex(withdrawalPayoutCell).beginParse().loadAddressAny()
    : null;
  const requestedForWithdrawal = safeGetBigInt(stack[index++]);

  const sudoerCell = stack[index++]?.cell;
  const sudoer = sudoerCell
    ? Cell.fromHex(sudoerCell).beginParse().loadAddressAny()
    : null;
  const sudoerSetAt = safeGetNumber(stack[index++]);

  const governorCell = stack[index++]?.cell;
  const governor = governorCell
    ? Cell.fromHex(governorCell).beginParse().loadAddress().toString()
    : "";
  const governorUpdateAfter = safeGetNumber(stack[index++]);
  const interestManagerCell = stack[index++]?.cell;
  const interestManager = interestManagerCell
    ? Cell.fromHex(interestManagerCell).beginParse().loadAddress().toString()
    : "";
  const halterCell = stack[index++]?.cell;
  const halter = halterCell
    ? Cell.fromHex(halterCell).beginParse().loadAddress().toString()
    : "";
  const approverCell = stack[index++]?.cell;
  const approver = approverCell
    ? Cell.fromHex(approverCell).beginParse().loadAddress().toString()
    : "";

  const controllerCode = stack[index++]?.cell;
  const jettonWalletCode = stack[index++]?.cell;
  const payoutMinterCode = stack[index++]?.cell;

  const projectedTotalBalance = safeGetBigInt(stack[index++]);
  const projectedPoolSupply = safeGetBigInt(stack[index++]);

  return {
    state,
    halted,
    totalBalance,
    interestRate,
    optimisticDepositWithdrawals,
    depositsOpen,
    instantWithdrawalFee,
    savedValidatorSetHash,

    previousRound,
    currentRound,

    minLoan,
    maxLoan,
    governanceFee,
    accruedGovernanceFee,
    disbalanceTolerance,
    creditStartPriorElectionsEnd,

    poolJettonMinter,
    poolJettonSupply,
    supply: poolJettonSupply,
    depositPayout: depositPayout ? depositPayout.toString() : null,
    requestedForDeposit,
    withdrawalPayout: withdrawalPayout ? withdrawalPayout.toString() : null,
    requestedForWithdrawal,

    sudoer: sudoer ? sudoer.toString() : null,
    sudoerSetAt,
    governor,
    governorUpdateAfter,
    interestManager,
    halter,
    approver,

    controllerCode,
    jettonWalletCode,
    payoutMinterCode,
    projectedTotalBalance,
    projectedPoolSupply,
  };
}
