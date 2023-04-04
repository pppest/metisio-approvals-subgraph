import { json, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  Collection,
  Deposit,
  Withdraw,
  RewardAdded,
  Reward,
  Claim,
  RetrieveToken,
  User,
  UserCollection,
} from "./generated/schema";

import {
  CollectionAdded as CollectionAddedEvent,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  RewardAdded as RewardAddedEvent,
  Reward as RewardEvent,
  Claim as ClaimEvent,
  RetrieveToken as RetrieveTokenEvent,
} from "./generated/CERUSNFTRewardDistribution/CERUSNFTRewardDistribution";

export function handleDeposit(event: DepositEvent): void {
  let id = event.transaction.hash.toHex();
  let deposit = new Deposit(id);

  deposit.collection = event.params.collection;
  deposit.tokenId = event.params.tokenId;
  deposit.user = event.params.user;
  deposit.timestamp = event.block.timestamp;
  deposit.blockNumber = event.block.number;
  deposit.transactionHash = event.transaction.hash;

  deposit.save();

  handleAddCollectionToUser(event.params.user, event.params.collection);
}

export function handleWithdraw(event: WithdrawEvent): void {
  let id = event.transaction.hash.toHex();
  let withdraw = new Withdraw(id);

  withdraw.user = event.params.user;
  withdraw.collection = event.params.collection;
  withdraw.tokenId = event.params.tokenId;
  withdraw.timestamp = event.block.timestamp;
  withdraw.blockNumber = event.block.number;
  withdraw.transactionHash = event.transaction.hash;

  withdraw.save();

  handleAddCollectionToUser(event.params.user, event.params.collection);
}

// This event is emitted whenever a new collection is added
export function handleCollectionAdded(event: CollectionAddedEvent): void {
  let id = event.params.collection.toHex();
  let collection = new Collection(id);

  collection.collection = event.params.collection;

  collection.save();
}
// Handlers for RewardAdded event
export function handleRewardAdded(event: RewardAddedEvent): void {
  let id = event.transaction.hash.toHex();
  let rewardAdded = new RewardAdded(id);

  rewardAdded.collection = event.params.collection;
  rewardAdded.amountMetis = event.params.amountMetis;
  rewardAdded.amountCerus = event.params.amountCerus;
  rewardAdded.timestamp = event.block.timestamp;
  rewardAdded.blockNumber = event.block.number;
  rewardAdded.transactionHash = event.transaction.hash;

  rewardAdded.save();
}

function handleAddCollectionToUser(userAddress: Bytes, collectionAddress: Bytes): void {
  let userId = userAddress.toHex();
  let user = User.load(userId);

  if (user == null) {
    user = new User(userId);
    // Initialize other fields for the User entity
    user.address = userAddress;
    user.tokenBalance = BigInt.fromI32(0);
    user.rewards = BigInt.fromI32(0);
    user.allTimeMetisReward = BigInt.fromI32(0);
    user.lastMetisReward = BigInt.fromI32(0);
    user.allTimeCerusReward = BigInt.fromI32(0);
    user.lastCerusReward = BigInt.fromI32(0);
    user.userCollections = [];
  }

  let collectionId = collectionAddress.toString();
  let userCollectionId = userId + "-" + collectionId;

  let userCollection = UserCollection.load(userCollectionId);
  if (userCollection == null) {
    userCollection = new UserCollection(userCollectionId);
    userCollection.address = collectionAddress;
    userCollection.userAddress = userAddress;
    userCollection.allTimeMetisReward = BigInt.fromI32(0);
    userCollection.lastMetisReward = BigInt.fromI32(0);
    userCollection.allTimeCerusReward = BigInt.fromI32(0);
    userCollection.lastCerusReward = BigInt.fromI32(0);
    userCollection.save();

    let userCollections = user.userCollections;
    userCollections.push(userCollection.id);
    user.userCollections = userCollections;
  }

  user.save();
}

// Handlers for Reward event
export function handleReward(event: RewardEvent): void {
  let id = event.transaction.hash.toHex();
  let reward = new Reward(id);

  reward.user = event.params.user;
  reward.collection = event.params.collection;
  reward.tokenIds = event.params.tokenIds.map<BigInt>((id) => id as BigInt);
  reward.amountMetis = event.params.amountMetis;
  reward.amountCerus = event.params.amountCerus;
  reward.timestamp = event.block.timestamp;
  reward.blockNumber = event.block.number;
  reward.transactionHash = event.transaction.hash;

  reward.save();

  //
  handleAddCollectionToUser(event.params.user, event.params.collection);
  let userId = event.params.user.toHex();
  let user = User.load(userId);
  if (user != null) {
    user.allTimeMetisReward = user.allTimeMetisReward.plus(event.params.amountMetis);
    user.lastMetisReward = event.params.amountMetis;
    user.allTimeCerusReward = user.allTimeCerusReward.plus(event.params.amountCerus);
    user.lastCerusReward = event.params.amountCerus;
    user.save();
  }

  let collectionId = event.params.collection.toHex();
  let userCollectionId = userId + "-" + collectionId;
  let userCollection = UserCollection.load(userCollectionId);
  if (userCollection != null) {
    userCollection.allTimeMetisReward = userCollection.allTimeMetisReward.plus(event.params.amountMetis);
    userCollection.lastMetisReward = event.params.amountMetis;
    userCollection.allTimeCerusReward = userCollection.allTimeCerusReward.plus(event.params.amountCerus);
    userCollection.lastCerusReward = event.params.amountCerus;
    userCollection.save();
  }
}

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
