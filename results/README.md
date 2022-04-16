### Vote validation

As of right now (just after 2022.04.15 00:00 UTC) the Trust Protector vote is
closed.

### Snapshot [results/20xx/mnlist.json](/results/2022/mnlist.json)

This is the list of registered masternodes.

- Published: **at the moment** that voting closes
- Available: **before, during, and after** the vote, but only the snapshot at
  the moment voting closes is official
- Live Location:
  - **Dash QT**
    - (enable "Show Masternodes Tab" in `Preferences > Wallet`)
  - `dash-cli masternodelist json 'ENABLED'`
  - <https://api.dashtrust.org/api/mnlist>
    - (updates about every 15 minutes until voting closes)
  - <https://dashnode.duckdns.org/api/mnlist>
- Archive Location:
  <https://github.com/dashhive/vote-tally/tree/master/results/2022>

Sample of `mnlist.json`:

```
{
    "f40b31b91ae5867929f8acac3e7bb3a95b7bce19d2da6b1dd7a0622462d54d3c-1": {
      "proTxHash": "b2ec60a27f88e4be90e26673053e4f942938826dcde77cd880cdfe2df8284440",
      "address": "95.179.229.181:9999",
      "payee": "XdYqyxCnCd9ewYNf4kbX4hRJaixN421SUm",
      "status": "ENABLED",
      "lastpaidtime": 1649711084,
      "lastpaidblock": 1652882,
      "owneraddress": "Xovz9qpk4FkiuJsdbsbtHTYnNivkYWLxQH",
      "votingaddress": "Xovz9qpk4FkiuJsdbsbtHTYnNivkYWLxQH",
      "collateraladdress": "Xkt7xJr2d9Pimu3wr2SxbvCzTVFtJAp3mq",
      "pubkeyoperator": "145860e681f8b96d77bf4e26352ad20a7b01674776b77404027794b36c2805ec534cda8f0d052afe23e94b6ccd48f3c8"
    },
    ...
    "a476f59677f43968ef22c12e250605e42b8ae6d0665fef1354c219ac1e3de82e-0": {
      "proTxHash": "af7b52f2333fbb5605105b3efd094547c2f77d81ca06aa97b784414c4d1efbff",
      "address": "100.24.78.251:9999",
      "payee": "XnpE5Mwr8GsVujK2eWVVJh718Zeap5FHLj",
      "status": "ENABLED",
      "lastpaidtime": 1649841764,
      "lastpaidblock": 1653711,
      "owneraddress": "Xx7xCzbkHJnqbuqBk1zzGeuwopZ9x5UZvu",
      "votingaddress": "XkK53owYVX5Q2t8XPzkR4bzourNzgfkjts",
      "collateraladdress": "Xu2B3bvC75NuiYvudvJPR1npDdguyN7aWV",
      "pubkeyoperator": "8f8097c423ad5bccc3d631bf518a1f28ff60b31841e3c7b0d44e578f94d33b96b9fb485e1690b72608423f3e926ac8c7"
    }
  }
```

The resulting data was copied into a file (`mnlist.json`) and hashed:

```
openssl md5 mnlist.json
MD5(mnlist.json)= 1449e888cfb1111a25b5433d0424f9ec
```

This hash was then uploaded to the Dash blockchain in an `OP_RETURN`
transaction:

```
# Ran from Dash Discord
# Doesn't really matter how I did it, just including this for the curious
!chat md5(masternodelist json ENABLED): 1449e888cfb1111a25b5433d0424f9ec
```

Result in the Dash blockchain:

<https://chainz.cryptoid.info/dash/tx.dws?8b0cb1d7950f983b783c21b3c31f987540fbbc371d9ea58ba02bb1b7fd2c4108.htm>
