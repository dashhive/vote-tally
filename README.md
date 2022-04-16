# vote-tally

> Tally MNO votes from the Dash Trust Protector Election

## Video Demonstration

See
https://www.youtube.com/watch?v=--gCnkUe9K4&list=PLZaEVINf2Bq98JzEWSX339MpOccqb4WZP&index=2

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [TODO](#todo)
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

## Usage

You will need a few external files, placed in the `results/20xx` folder:

- The candidate list from the voting website (included in this repo)
- A snapshot of the valid masternode list (saved to `results/20xx/mnlist.json`)
- A list of all the votes from the database in JSON format (obtained via the API
  using the `/api/votes` route and saved to `results/20xx/votes.json`)

The output will show all votes, any rejected votes w/rejection reason, and a
list of candidate names and vote tallies at the end.

## Contributing

Feel free to dive in!
[Open an issue](https://github.com/dashevo/vote-tally/issues/new) or submit PRs.

## License

[MIT](LICENSE) &copy; Dash Core Group, Inc.
