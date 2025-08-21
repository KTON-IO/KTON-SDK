import { TvmStackRecord } from "tonapi-sdk-js";
import { Cell } from "@ton/core";

export function parsePoolFullData(stack: TvmStackRecord[]) {
  let index = 0;
  const new_contract_version = stack.length == 34;
  const state = Number(stack[index++].num);
  const halted = Boolean(stack[index++].num);
  const totalBalance = BigInt(stack[index++].num ?? 0);
  const interestRate = Number(stack[index++].num);
  const optimisticDepositWithdrawals = Boolean(stack[index++].num);
  const depositsOpen = Boolean(stack[index++].num);
  let instantWithdrawalFee = 0;
  if (new_contract_version) {
    instantWithdrawalFee = Number(stack[index++].num);
  }
  const savedValidatorSetHash = BigInt(stack[index++].num ?? 0);

  let prvIndex = 0;
  const prv = stack[index++].tuple!;
  const prvBorrowers = prv[prvIndex++].cell;
  const prvRoundId = Number(prv[prvIndex++].num);
  const prvActiveBorrowers = BigInt(prv[prvIndex++].num ?? 0);
  const prvBorrowed = BigInt(prv[prvIndex++].num ?? 0);
  const prvExpected = BigInt(prv[prvIndex++].num ?? 0);
  const prvReturned = BigInt(prv[prvIndex++].num ?? 0);
  const prvProfit = BigInt(prv[prvIndex++].num ?? 0);
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
  const cur = stack[index++].tuple!;
  const curBorrowers = cur[curIndex++].cell ?? Cell.EMPTY;
  const curRoundId = Number(cur[curIndex++].num);
  const curActiveBorrowers = BigInt(cur[curIndex++].num ?? 0);
  const curBorrowed = BigInt(cur[curIndex++].num ?? 0);
  const curExpected = BigInt(cur[curIndex++].num ?? 0);
  const curReturned = BigInt(cur[curIndex++].num ?? 0);
  const curProfit = BigInt(cur[curIndex++].num ?? 0);
  const currentRound = {
    borrowers: curBorrowers.toString(),
    roundId: curRoundId,
    activeBorrowers: curActiveBorrowers,
    borrowed: curBorrowed,
    expected: curExpected,
    returned: curReturned,
    profit: curProfit,
  };

  const minLoan = BigInt(stack[index++].num ?? 0);
  const maxLoan = BigInt(stack[index++].num ?? 0);
  const governanceFee = Number(stack[index++].num);

  let accruedGovernanceFee = BigInt(0);
  let disbalanceTolerance = 30;
  let creditStartPriorElectionsEnd = 0;
  if (new_contract_version) {
    accruedGovernanceFee = BigInt(stack[index++].num ?? 0);
    disbalanceTolerance = Number(stack[index++].num);
    creditStartPriorElectionsEnd = Number(stack[index++].num);
  }

  const poolJettonMinterCell = stack[index++].cell;
  const poolJettonMinter = poolJettonMinterCell 
    ? Cell.fromHex(poolJettonMinterCell).beginParse().loadAddress().toString()
    : "";
  const poolJettonSupply = BigInt(stack[index++].num ?? 0);

  const depositPayoutCell = stack[index++].cell;
  const depositPayout = depositPayoutCell 
    ? Cell.fromHex(depositPayoutCell).beginParse().loadAddressAny()
    : null;
  const requestedForDeposit = BigInt(stack[index++].num ?? 0);

  const withdrawalPayoutCell = stack[index++].cell;
  const withdrawalPayout = withdrawalPayoutCell 
    ? Cell.fromHex(withdrawalPayoutCell).beginParse().loadAddressAny()
    : null;
  const requestedForWithdrawal = BigInt(stack[index++].num ?? 0);

  const sudoerCell = stack[index++].cell;
  const sudoer = sudoerCell 
    ? Cell.fromHex(sudoerCell).beginParse().loadAddressAny()
    : null;
  const sudoerSetAt = Number(stack[index++].num);

  const governorCell = stack[index++].cell;
  const governor = governorCell 
    ? Cell.fromHex(governorCell).beginParse().loadAddress().toString()
    : "";
  const governorUpdateAfter = Number(stack[index++].num);
  const interestManagerCell = stack[index++].cell;
  const interestManager = interestManagerCell 
    ? Cell.fromHex(interestManagerCell).beginParse().loadAddress().toString()
    : "";
  const halterCell = stack[index++].cell;
  const halter = halterCell 
    ? Cell.fromHex(halterCell).beginParse().loadAddress().toString()
    : "";
  const approverCell = stack[index++].cell;
  const approver = approverCell 
    ? Cell.fromHex(approverCell).beginParse().loadAddress().toString()
    : "";

  const controllerCode = stack[index++].cell;
  const jettonWalletCode = stack[index++].cell;
  const payoutMinterCode = stack[index++].cell;

  const projectedTotalBalance = BigInt(stack[index++].num ?? 0);
  const projectedPoolSupply = BigInt(stack[index++].num ?? 0);

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
