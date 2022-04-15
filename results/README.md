### Vote validation

As of right now (just after 2022.04.15 00:00 UTC) the Trust Protector vote is closed.

A [snapshot of the masternode list](https://raw.githubusercontent.com/dashhive/vote-tally/master/results/mnlist.json) was taken shortly after the vote close:

```
masternodelist json ENABLED
```

The resulting data was copied into a file (`mnlist.json`) and hashed:

```
openssl md5 mnlist.json
MD5(mnlist.json)= 1449e888cfb1111a25b5433d0424f9ec
```

This hash was then uploaded to the blockchain in an OP_RETURN transaction:

```
# Ran from Dash Discord
# Doesn't really matter how I did it, just including this for the curious
!chat md5(masternodelist json ENABLED): 1449e888cfb1111a25b5433d0424f9ec
```

<https://chainz.cryptoid.info/dash/tx.dws?8b0cb1d7950f983b783c21b3c31f987540fbbc371d9ea58ba02bb1b7fd2c4108.htm>
