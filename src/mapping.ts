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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function handleWithdraw(event: WithdrawEvent): void {
  // add withdraw
  let id = event.transaction.hash.toHex();
  let withdraw = new Withdraw(id);

  withdraw.user = event.params.user;
  withdraw.collection = event.params.collection;
  withdraw.tokenId = event.params.tokenId;
  withdraw.timestamp = event.block.timestamp;
  withdraw.blockNumber = event.block.number;
  withdraw.transactionHash = event.transaction.hash;

  withdraw.save();

  // remove from collection
  let collectionId = event.params.collection.toHex();
  let collection = Collection.load(collectionId);
  if (collection) {
    collection.address = event.params.collection;
    let tokenIds = collection.tokenIds;
    let index = tokenIds.indexOf(event.params.tokenId.toString());
    if (index > -1) {
      tokenIds.splice(index, 1);
    }
    collection.tokenIds = tokenIds;

    collection.save();
  }

  // token
  let tokenId = event.params.tokenId.toString();
  let token = Token.load(tokenId);

  if (token) {
    token.timesWithdrawn += 1;
    token.save();
  }

  // user token
  let userToken = UserToken.load(tokenId);
  if (userToken) {
    userToken.timesWithdrawnUser += 1;
    userToken.save();
  }

  // Update user's token balance and withdraws count
  let userId = event.params.user.toHex();
  let user: User | null = User.load(userId);

  if (user !== null) {
    user.tokenBalance = user.tokenBalance.minus(BigInt.fromI32(1));

    // Get the user collection for this withdrawal
    let userCollectionId = event.params.user.toHex() + "-" + event.params.collection.toHex();
    let userCollection = UserCollection.load(userCollectionId);

    if (userCollection) {
      // remove from user tokens
      if (userToken) {
        let updatedUserTokenIds = userCollection.tokenIds;
        updatedUserTokenIds.push(event.params.tokenId);
        userCollection.tokenIds = updatedUserTokenIds;

        let tempUserTokens = userCollection.tokens;

        let index = tempUserTokens.indexOf(tokenId);
        if (index > -1) {
          tempUserTokens.splice(index, 1);
        }

        userCollection.tokens = tempUserTokens;
      }

      // Update user collection tokenIds
      let tokenIds = userCollection.tokenIds;

      let index = tokenIds.indexOf(event.params.tokenId);
      if (index > -1) {
        tokenIds.splice(index, 1);
      }
      userCollection.tokenIds = tokenIds;

      // Update the user's withdraws count for this collection
      userCollection.withdraws = userCollection.withdraws.plus(BigInt.fromI32(1));

      userCollection.save();
    }

    // Update user's withdraws count
    user.withdraws = user.withdraws.plus(BigInt.fromI32(1));

    user.save();
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// This event is emitted whenever a new collection is added
export function handleCollectionAdded(event: CollectionAddedEvent): void {
  let id = event.params.collection.toHex();
  let collection = new Collection(id);

  collection.address = event.params.collection;
  collection.tokenIds = []; // Initialize tokenIds as an empty array

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

// Handlers for User Reward event
export function handleReward(event: RewardEvent): void {
  // add reward
  let id = event.transaction.hash.toHex();
  let reward = new UserReward(id);

  reward.user = event.params.user;
  reward.collection = event.params.collection;
  reward.tokenIds = event.params.tokenIds.map<BigInt>((id) => id as BigInt);
  reward.amountMetis = event.params.amountMetis;
  reward.amountCerus = event.params.amountCerus;
  reward.timestamp = event.block.timestamp;
  reward.blockNumber = event.block.number;
  reward.transactionHash = event.transaction.hash;

  reward.save();

  // update tokens
  let tokenIds = event.params.tokenIds;
  let amountMetisPerToken = reward.amountMetis.div(BigInt.fromI32(tokenIds.length));
  let amountCerusPerToken = reward.amountCerus.div(BigInt.fromI32(tokenIds.length));

  for (let i = 0; i < tokenIds.length; i++) {
    // token
    let token = Token.load(tokenIds[i].toString());
    if (token) {
      token.timesRewarded += 1;
      token.totalMetisReward = token.totalMetisReward.plus(amountMetisPerToken);
      token.totalCerusReward = token.totalCerusReward.plus(amountCerusPerToken);
      token.lastMetisReward = amountMetisPerToken;
      token.lastCerusReward = amountCerusPerToken;
      token.save();
    }

    // user token
    let userToken = UserToken.load(tokenIds[i].toString());
    if (userToken) {
      userToken.timesRewardedUser + 1;
      userToken.totalMetisRewardUser = userToken.totalMetisRewardUser.plus(amountMetisPerToken);
      userToken.totalCerusRewardUser = userToken.totalCerusRewardUser.plus(amountCerusPerToken);
      userToken.lastMetisRewardUser = amountMetisPerToken;
      userToken.lastCerusRewardUser = amountCerusPerToken;
      userToken.save();
    }
  }

  // user
  let userId = event.params.user.toHex();
  let user = User.load(userId);
  if (user != null) {
    user.allTimeMetisReward = user.allTimeMetisReward.plus(event.params.amountMetis);
    user.lastMetisReward = event.params.amountMetis;
    user.allTimeCerusReward = user.allTimeCerusReward.plus(event.params.amountCerus);
    user.lastCerusReward = event.params.amountCerus;
    user.rewards = user.rewards.plus(BigInt.fromI32(1));

    user.save();
  }

  let collectionId = event.params.collection.toHex();
  let userCollectionId = userId + "-" + collectionId;
  let userCollection = UserCollection.load(userCollectionId);
  if (userCollection) {
    userCollection.allTimeMetisReward = userCollection.allTimeMetisReward.plus(event.params.amountMetis);
    userCollection.lastMetisReward = event.params.amountMetis;
    userCollection.allTimeCerusReward = userCollection.allTimeCerusReward.plus(event.params.amountCerus);
    userCollection.lastCerusReward = event.params.amountCerus;
    userCollection.timesRewarded = userCollection.timesRewarded.plus(BigInt.fromI32(1));

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
