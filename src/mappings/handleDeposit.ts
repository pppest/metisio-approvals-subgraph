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

// HANDLE DEPOSIT
export function handleDeposit(event: DepositEvent): void {
  // add to deposits
  let id = event.transaction.hash.toHex();
  let deposit = new Deposit(id);

  deposit.collection = event.params.collection;
  deposit.tokenId = event.params.tokenId;
  deposit.user = event.params.user;
  deposit.timestamp = event.block.timestamp;
  deposit.blockNumber = event.block.number;
  deposit.transactionHash = event.transaction.hash;

  deposit.save();

  // token
  let tokenId = event.params.tokenId.toString();
  let token = Token.load(tokenId);

  if (!token) {
    token = new Token(tokenId);
    token.collection = event.params.collection.toHex();
    token.timesRewarded = 0;
    token.totalMetisReward = BigInt.fromI32(0);
    token.totalCerusReward = BigInt.fromI32(0);
    token.timesDeposited = 0;
    token.timesWithdrawn = 0;
  }
  token.timesDeposited += 1;
  token.save();

  // user token
  let userToken = UserToken.load(tokenId);
  if (!userToken) {
    userToken = new UserToken(tokenId);
    userToken.user = event.params.user;
    userToken.timesRewardedUser = 0;
    userToken.timesDepositedUser = 0;
    userToken.timesWithdrawnUser = 0;
    userToken.totalMetisRewardUser = BigInt.fromI32(0);
    userToken.totalCerusRewardUser = BigInt.fromI32(0);
    userToken.lastMetisRewardUser = BigInt.fromI32(0);
    userToken.lastCerusRewardUser = BigInt.fromI32(0);
  }
  userToken.timesDepositedUser += 1;
  userToken.save();

  // add to user collection
  let userCollectionId = event.params.user.toHex() + "-" + event.params.collection.toHex();
  let userCollection = UserCollection.load(userCollectionId);

  if (!userCollection) {
    userCollection = new UserCollection(userCollectionId);
    userCollection.address = event.params.collection;
    userCollection.user = event.params.user;
    userCollection.allTimeMetisReward = BigInt.fromI32(0);
    userCollection.lastMetisReward = BigInt.fromI32(0);
    userCollection.allTimeCerusReward = BigInt.fromI32(0);
    userCollection.lastCerusReward = BigInt.fromI32(0);
    userCollection.tokenIds = []; // Initialize tokenIds as an empty array
    userCollection.tokens = [];
    userCollection.timesRewarded = BigInt.fromI32(0);
  }

  // Update tokenIds in UserCollection
  let updatedTokenIds = userCollection.tokenIds;
  updatedTokenIds.push(event.params.tokenId);
  userCollection.tokenIds = updatedTokenIds;

  let tempUserTokens = userCollection.tokens;
  tempUserTokens.push(userToken.id);
  userCollection.tokens = tempUserTokens;

  userCollection.save();

  // Update user's token balance
  let userId = event.params.user.toHex();
  let user = User.load(userId);
  if (user == null) {
    user = new User(userId);
    user.address = event.params.user;
    user.tokenBalance = BigInt.fromI32(0);
    user.rewards = BigInt.fromI32(0);
    user.allTimeMetisReward = BigInt.fromI32(0);
    user.lastMetisReward = BigInt.fromI32(0);
    user.allTimeCerusReward = BigInt.fromI32(0);
    user.lastCerusReward = BigInt.fromI32(0);
    user.userCollections = [];
    user.deposits = BigInt.fromI32(0);
    user.withdraws = BigInt.fromI32(0);
  }

  // update user balance
  user.deposits = user.deposits.plus(BigInt.fromI32(1));
  user.tokenBalance = user.tokenBalance.plus(BigInt.fromI32(1));

  // update user collection
  let temp = user.userCollections;
  temp.push(userCollection.id);
  user.userCollections = temp;

  user.save();

  // add to collection, not posible to deposit if collection is not added so we don't ad if doesn't exist.
  let collectionId = event.params.collection.toHex();
  let collection = Collection.load(collectionId);
  if (collection) {
    collection.address = event.params.collection;
    let tokenIds = collection.tokenIds;
    tokenIds.push(token.id);
    collection.tokenIds = tokenIds; // Initialize tokenIds as an empty array

    collection.save();
  }
}
