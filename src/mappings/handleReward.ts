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
    user.totalMetisReward = user.totalMetisReward.plus(event.params.amountMetis);
    user.lastMetisReward = event.params.amountMetis;
    user.totalCerusReward = user.totalCerusReward.plus(event.params.amountCerus);
    user.lastCerusReward = event.params.amountCerus;
    user.rewards = user.rewards.plus(BigInt.fromI32(1));

    user.save();
  }

  let collectionId = event.params.collection.toHex();
  let userCollectionId = userId + "-" + collectionId;
  let userCollection = UserCollection.load(userCollectionId);
  if (userCollection) {
    userCollection.totalMetisReward = userCollection.totalMetisReward.plus(event.params.amountMetis);
    userCollection.lastMetisReward = event.params.amountMetis;
    userCollection.totalCerusReward = userCollection.totalCerusReward.plus(event.params.amountCerus);
    userCollection.lastCerusReward = event.params.amountCerus;
    userCollection.timesRewarded = userCollection.timesRewarded.plus(BigInt.fromI32(1));

    userCollection.save();
  }
}
