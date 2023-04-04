# CERUS NFT Reward Distribution Contract Subgraph

__NOTICE__
this is for  metis goerli atm

## Start graph-node

```
docker-compose up -d
```

ipfs webui: http://127.0.0.1:5001
graph index node playground: http://127.0.0.1:8030/graphql/playground

## Build subgraph

```
yarn build
```

## Create subgraph

```
yarn create-local
```

## Deploy subgraph

```
yarn deploy-local
```

## Subgraph graphql playground

http://localhost:8000/subgraphs/name/cerus/nftstaking

```graphql
{
  rewards(first: 5) {
    collection
    amountMetis
    amountCerus
    timestamp
    tokenIds
  }
}
```

```json
{
  "data": {
    "rewards": [
      {
        "amountCerus": "0",
        "amountMetis": "100000000000000000",
        "collection": "0xb1491f3bcad9d81983ea8ce57508c6e6cb6066d3",
        "timestamp": "1679705526",
        "tokenIds": ["3", "5"]
      },
      {
        "amountCerus": "0",
        "amountMetis": "99999999999999999",
        "collection": "0xb1491f3bcad9d81983ea8ce57508c6e6cb6066d3",
        "timestamp": "1679705526",
        "tokenIds": ["3", "5", "6"]
      }
    ]
  }
}
```

## Get subgraph status

Open graph index node playground and input flowing graphl request

```graphql
{
  indexingStatusForCurrentVersion(subgraphName: "metisio/approvals") {
    synced
    health
    fatalError {
      message
      block {
        number
        hash
      }
      handler
    }
    chains {
      chainHeadBlock {
        number
      }
      latestBlock {
        number
      }
    }
  }
}
```

```json
{
  "data": {
    "indexingStatusForCurrentVersion": {
      "chains": [
        {
          "chainHeadBlock": {
            "number": "1924116"
          },
          "latestBlock": {
            "number": "10146"
          }
        }
      ],
      "fatalError": null,
      "health": "healthy",
      "synced": false
    }
  }
}
```
