# vote-tally

> Tally MNO votes from the Dash Trust Protector Election

## Video Demonstration

See
https://www.youtube.com/watch?v=--gCnkUe9K4&list=PLZaEVINf2Bq98JzEWSX339MpOccqb4WZP&index=2

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Install

0. Install [git](https://webinstall.dev/git): https://webinstall.dev/git

   ```sh
   curl https://webinstall.dev/git | bash

   export PATH="$HOME/.local/bin:$PATH"
   ```

1. Clone and enter this repo

   ```sh
   git clone https://github.com/dashhive/vote-tally.git

   pushd ./vote-tally/
   ```

2. Install [Node.js](https://webinstall.dev/node) >= v16:
   https://webinstall.dev/node

   ```sh
   curl https://webinstall.dev/node | bash

   export PATH="$HOME/.local/opt/node/bin:$PATH"
   ```

3. Install this project's dependencies
   ```sh
   npm ci
   ```
4. Configure for the current vote / election

   ```sh
   rsync -avHP ./examples/dte2022.env .env
   ```

5. Run the tally
   ```sh
   npm run tally
   ```

## Verification

3 files are used for tallying and verifying the votes:

### results/20xx/candidates.json

This is the list of registered candidates.

- Published: **as soon as** the voting opens
- Available: **until after** the results have been officially published
- Live Location: <https://api.dashtrust.org/api/candidates>
- Archive Location:
  <https://github.com/dashhive/vote-tally/tree/master/results/2022>

Example:

```json
[
  {
    "name": "John Doe",
    "handle": "jdawg",
    "email": "john.doe@example.com",
    "link": "https://johndoe.live/why-vote-for-me",
    "trust_protector": true
  }
]
```

Votes can only be cast for registered candidates.

Votes including non-registered candidates will be discarded in full.

### [results/20xx/mnlist.json](/results/2022/mnlist.json)

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

Example:

```json
{
  "000be8f5f64b7bf26029218f647af1ff16a25c0fc1747930a5ee4e03860ec581-1": {
    "votingaddress": "Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx11",
    "owneraddress": "Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx37",
    "collateraladdress": "Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx42",
    "status": "ENABLED"
  }
}
```

The snapshot of the `mnlist` in this repository is the official voting-closed
snapshot.

### results/20xx/votes.json

This is the list of votes from the server's database.

- Published: **as soon as** voting closes
- Available: **until after** the results have been officially published
- Live Location: <https://api.dashtrust.org/api/votes>
- Archive Location:
  <https://github.com/dashhive/vote-tally/tree/master/results/2022>

Example:

```json
[
  {
    "addr": "Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "msg": "dte2022-johndoe|dorian-gray|spaceinvader",
    "sig": "Ixxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=",
    "ts": "2022-04-14T23:59:59Z"
  }
]
```

Votes can can be rejected for a variety of reasons, all of which are shown in
this example output.

Cause for Rejection:

```txt
Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | ERR_VTAG | discard vote for 'dte2021'
Yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy | ERR_ADDR | discard non-Dash, non-mainnet address
Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | ERR_VSIG | discard invalid signature
Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | ERR_LATE | discard vote cast at 2022-04-15 21:20:49Z
Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | ERR_EARL | discard vote cast at 2022-04-02 21:20:49Z
Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | ERR_DUPL | discard duplicate (earlier) vote
Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | ERR_CUST | discarded vote with write-in candidate(s)
Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | ERR_UNKN | discarded non-registered address
```

## Contributing

Feel free to dive in!
[Open an issue](https://github.com/dashevo/vote-tally/issues/new) or submit PRs.

## License

[MIT](LICENSE) &copy; Dash Core Group, Inc.
