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

// This event is emitted whenever a new collection is added
export function handleCollectionAdded(event: CollectionAddedEvent): void {
  let id = event.params.collection.toHex();
  let collection = new Collection(id);

  collection.address = event.params.collection;
  collection.tokenIds = []; // Initialize tokenIds as an empty array

  collection.save();
}

