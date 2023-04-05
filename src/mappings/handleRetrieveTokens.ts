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

// Handlers for RetrieveToken event
export function handleRetrieveToken(event: RetrieveTokenEvent): void {
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let retrieveToken = new RetrieveToken(id);

  retrieveToken.token = event.params.token;
  retrieveToken.amount = event.params.amount;
  retrieveToken.timestamp = event.block.timestamp;
  retrieveToken.blockNumber = event.block.number;
  retrieveToken.transactionHash = event.transaction.hash;

  retrieveToken.save();
}
