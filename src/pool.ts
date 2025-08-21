import { TvmStackRecord } from "tonapi-sdk-js";
import { Cell } from "@ton/core";

export function parsePoolFullData(stack: TvmStackRecord[]) {
  let index = 0;
  const new_contract_version = stack.length == 34;
  let state = Number(stack[index++].num);
  let halted = Boolean(stack[index++].num);
  let totalBalance = BigInt(stack[index++].num ?? 0);
  let interestRate = Number(stack[index++].num);
  let optimisticDepositWithdrawals = Boolean(stack[index++].num);
  let depositsOpen = Boolean(stack[index++].num);
  let instantWithdrawalFee = 0;
  if (new_contract_version) {
    instantWithdrawalFee = Number(stack[index++].num);
  }
  let savedValidatorSetHash = BigInt(stack[index++].num ?? 0);

  let prvIndex = 0;
  let prv = stack[index++].tuple!;
  let prvBorrowers = prv[prvIndex++].cell;
  let prvRoundId = Number(prv[prvIndex++].num);
  let prvActiveBorrowers = BigInt(prv[prvIndex++].num ?? 0);
  let prvBorrowed = BigInt(prv[prvIndex++].num ?? 0);
  let prvExpected = BigInt(prv[prvIndex++].num ?? 0);
  let prvReturned = BigInt(prv[prvIndex++].num ?? 0);
  let prvProfit = BigInt(prv[prvIndex++].num ?? 0);
  let previousRound = {
    borrowers: prvBorrowers,
    roundId: prvRoundId,
    activeBorrowers: prvActiveBorrowers,
    borrowed: prvBorrowed,
    expected: prvExpected,
    returned: prvReturned,
    profit: prvProfit,
  };

  let curIndex = 0;
  let cur = stack[index++].tuple!;
  let curBorrowers = cur[curIndex++].cell ?? Cell.EMPTY;
  let curRoundId = Number(cur[curIndex++].num);
  let curActiveBorrowers = BigInt(cur[curIndex++].num ?? 0);
  let curBorrowed = BigInt(cur[curIndex++].num ?? 0);
  let curExpected = BigInt(cur[curIndex++].num ?? 0);
  let curReturned = BigInt(cur[curIndex++].num ?? 0);
  let curProfit = BigInt(cur[curIndex++].num ?? 0);
  let currentRound = {
    borrowers: curBorrowers.toString(),
    roundId: curRoundId,
    activeBorrowers: curActiveBorrowers,
    borrowed: curBorrowed,
    expected: curExpected,
    returned: curReturned,
    profit: curProfit,
  };

  let minLoan = BigInt(stack[index++].num ?? 0);
  let maxLoan = BigInt(stack[index++].num ?? 0);
  let governanceFee = Number(stack[index++].num);

  let accruedGovernanceFee = BigInt(0);
  let disbalanceTolerance = 30;
  let creditStartPriorElectionsEnd = 0;
  if (new_contract_version) {
    accruedGovernanceFee = BigInt(stack[index++].num ?? 0);
    disbalanceTolerance = Number(stack[index++].num);
    creditStartPriorElectionsEnd = Number(stack[index++].num);
  }

  let poolJettonMinter = Cell.fromHex(stack[index++].cell!)
    .beginParse()
    .loadAddress()
    .toString();
  let poolJettonSupply = BigInt(stack[index++].num ?? 0);

  let depositPayout = Cell.fromHex(stack[index++].cell!)
    .beginParse()
    .loadAddressAny();
  let requestedForDeposit = BigInt(stack[index++].num ?? 0);

  let withdrawalPayout = Cell.fromHex(stack[index++].cell!)
    .beginParse()
    .loadAddressAny();
  let requestedForWithdrawal = BigInt(stack[index++].num ?? 0);

  let sudoer = Cell.fromHex(stack[index++].cell!).beginParse().loadAddressAny();
  let sudoerSetAt = Number(stack[index++].num);

  let governor = Cell.fromHex(stack[index++].cell!)
    .beginParse()
    .loadAddress()
    .toString();
  let governorUpdateAfter = Number(stack[index++].num);
  let interestManager = Cell.fromHex(stack[index++].cell!)
    .beginParse()
    .loadAddress()
    .toString();
  let halter = Cell.fromHex(stack[index++].cell!)
    .beginParse()
    .loadAddress()
    .toString();
  let approver = Cell.fromHex(stack[index++].cell!)
    .beginParse()
    .loadAddress()
    .toString();

  let controllerCode = stack[index++].cell;
  let jettonWalletCode = stack[index++].cell;
  let payoutMinterCode = stack[index++].cell;

  let projectedTotalBalance = BigInt(stack[index++].num ?? 0);
  let projectedPoolSupply = BigInt(stack[index++].num ?? 0);

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
