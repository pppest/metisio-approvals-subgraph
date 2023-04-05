import { json, BigInt, Bytes, Address } from "@graphprotocol/graph-ts";
import {
  Collection,
  Deposit,
  Withdraw,
  RewardAdded,
  UserReward,
  Claim,
  RetrieveToken,
  User,
  UserCollection,
  Token,
  UserToken,
} from "../generated/schema";

import {
  CollectionAdded as CollectionAddedEvent,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  RewardAdded as RewardAddedEvent,
  Reward as RewardEvent,
  Claim as ClaimEvent,
  RetrieveToken as RetrieveTokenEvent,
} from "../generated/CERUSNFTRewardDistribution/CERUSNFTRewardDistribution";

// Handlers for Claim event
export function handleClaim(event: ClaimEvent): void {
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let claim = new Claim(id);

  claim.user = event.params.user;
  claim.amountMetis = event.params.amountMetis;
  claim.amountCerus = event.params.amountCerus;
  claim.timestamp = event.block.timestamp;
  claim.blockNumber = event.block.number;
  claim.transactionHash = event.transaction.hash;

  claim.save();
}
