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
