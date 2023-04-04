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
  CollectionAdded as CollectionEvent,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  RewardAdded as RewardAddedEvent,
  Reward as RewardEvent,
  Claim as ClaimEvent,
  RetrieveToken as RetrieveTokenEvent,
} from "./generated/CERUSNFTRewardDistribution/CERUSNFTRewardDistribution";

// This event is emitted whenever a new collection is added
export function handleCollectionAdded(event: CollectionEvent): void {
  let collection = new Collection(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  collection.id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  collection.collection = event.params.collection;
  collection.save();
}

export function handleDeposit(event: DepositEvent): void {
  let deposit = new Deposit(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  deposit.id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  deposit.collection = event.params.collection;
  deposit.tokenId = event.params.tokenId;
  deposit.timestamp = event.block.timestamp;
  deposit.blockNumber = event.block.number;
  deposit.transactionHash = event.transaction.hash;
  deposit.user = event.transaction.from; // event.transaction.from;
  deposit.save();

  // Update user
  let user = User.load(event.transaction.from.toString()); // Attempt to load existing user by Ethereum address
  if (!user) {
    user = new User(event.transaction.from.toString());
    user.address = event.transaction.from;
  }
  let one = BigInt.fromI64(1);
  let oldBalance = user.tokenBalance;
  let newBalance = oldBalance.plus(one);
  user.tokenBalance = newBalance;
  user.save();
}

// Handlers for Withdraw event
export function handleWithdraw(event: WithdrawEvent): void {
  let withdraw = new Withdraw(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  withdraw.user = event.params.user;
  withdraw.collection = event.params.collection;
  withdraw.tokenId = event.params.tokenId;
  withdraw.timestamp = event.block.timestamp;
  withdraw.blockNumber = event.block.number;
  withdraw.transactionHash = event.transaction.hash;
  withdraw.save();

  // Update user
  let user = User.load(event.transaction.from.toString()); // Attempt to load existing user by Ethereum address
  if (!user) {
    user = new User(event.transaction.from.toString());
    user.address = event.transaction.from;
  }
  let one = BigInt.fromI64(1);
  let oldBalance = user.tokenBalance;
  let newBalance = oldBalance.minus(one);
  user.tokenBalance = newBalance;
  user.save();
}

// Handlers for RewardAdded event
export function handleRewardAdded(event: RewardAddedEvent): void {
  let rewardAdded = new RewardAdded(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  rewardAdded.collection = event.params.collection;
  // rewardAdded.tokenIds = event.params.tokenIds;
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

  let collectionId = collectionAddress.toHex();
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
  let reward = new Reward(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  reward.user = event.params.user;
  reward.collection = event.params.collection;
  reward.tokenIds = event.params.tokenIds;
  reward.amountMetis = event.params.amountMetis;
  reward.amountCerus = event.params.amountCerus;
  reward.timestamp = event.block.timestamp;
  reward.blockNumber = event.block.number;
  reward.transactionHash = event.transaction.hash;
  reward.save();

  let user = User.load(event.params.user.toString()); // Attempt to load existing user by Ethereum address
  if (!user) {
    user = new User(event.params.user.toString());
    user.address = event.params.user;
  }

  // rewards counter
  let one = BigInt.fromI64(1);
  let oldBalance = user.rewards;
  let newBalance = oldBalance.plus(one);
  user.rewards = newBalance;
  // all time metis reward
  let oldMetisReward = user.allTimeMetisReward;
  let newMetisReward = oldMetisReward.plus(event.params.amountMetis);
  user.allTimeMetisReward = newMetisReward;
  // last time metis reward
  user.lastMetisReward = event.params.amountMetis;
  // all time cerus reward
  let oldCerusReward = user.allTimeCerusReward;
  let newCerusReward = oldCerusReward.plus(event.params.amountCerus);
  user.allTimeCerusReward = newCerusReward;
  // last time cerus reward
  user.lastCerusReward = event.params.amountCerus;
  user.save();

  // update user collections

  // add collection
  let newUserCollection = new UserCollection(event.params.collection.toString() + event.params.user.toString());
  newUserCollection.address = event.params.collection;
  newUserCollection.userAddress = user.address;
  // all time cerus reward
  newUserCollection.allTimeCerusReward = newCerusReward;
  // last time cerus reward
  newUserCollection.lastCerusReward = event.params.amountCerus;

//   let collectionId = event.to.toHex();

//   user.collections.push(newUserCollection);
}

// Handlers for Claim event
export function handleClaim(event: ClaimEvent): void {
  let claim = new Claim(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
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
  let retrieveToken = new RetrieveToken(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  retrieveToken.token = event.params.token;
  retrieveToken.amount = event.params.amount;
  retrieveToken.timestamp = event.block.timestamp;
  retrieveToken.blockNumber = event.block.number;
  retrieveToken.transactionHash = event.transaction.hash;

  retrieveToken.save();
}
