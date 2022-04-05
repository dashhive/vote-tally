"use strict";

require("dotenv").config({ path: ".env" });

// dte2019 = "Dash Trust Elections 2019"
let voteMsgPrefix = process.env.VOTE_PREFIX;
// curl -fL https://dashvote.duckdns.org/api/votes > votes.json
let votes = require(process.env.VOTES_JSON);
// curl -fL https://dashvote.duckdns.org/api/candidates > candidates.json
let candidateList = require(process.env.CANDIDATES_JSON);
// dash-cli masternodelist json 'ENABLED' > mnlist.json
let mnSnapshot = require(process.env.MNLIST_JSON);
// ex: 2022-04-15T00:00:00Z
let tooLate = new Date(process.env.VOTING_END_DATE).valueOf();
// ex: mainnet or testnet
let network = process.env.DASH_NETWORK;

let dashcore = require("@dashevo/dashcore-lib");

function buildValidMNCollateralMap() {
  let mnCollateral = {};
  Object.values(mnSnapshot).forEach(function (mn) {
    if (mn.status === "ENABLED") {
      mnCollateral[mn.votingaddress] = true;
    }
  });
  return mnCollateral;
}

function tallyVotes() {
  // List of valid MN collateral addresses which comes from the MN list
  // snapshot.
  const mnCollateralMap = buildValidMNCollateralMap();

  // Map of valid candidate identifiers.
  const handles = candidateList.map(function (c) {
    return c.handle;
  });

  // Keep a map of MNO collateral addresses to prove there wasn't an invalid
  // dataset.  An invalid dataset is one which contains multiple votes from the
  // same collateral address.
  let seenCollateral = {};

  // user identifier / count
  let candidateTally = {};
  handles.forEach(function (handle) {
    candidateTally[handle] = 0;
  });

  votes.forEach((vote) => {
    // log entire vote so we know which one if discarded
    function logVote() {
      console.warn(
        `Vote <addr:${vote.addr}, msg:${vote.msg}, sig:${vote.sig}, ts:${vote.ts}>`
      );
    }

    // duplicate MNO collateral addresses
    if (seenCollateral[vote.addr] !== undefined) {
      // go crazy here. invalid dataset.
      console.error(
        "error: invalid dataset - duplicate collateral addresses detected"
      );
      process.exit(1);
    }
    seenCollateral[vote.addr] = 1;

    // 0. Filter votes that came in after March 31st 2019, 23:59
    let ts = Math.trunc(Date.parse(vote.ts) / 1000);
    if (ts >= tooLate) {
      logVote();
      console.warn(
        `Timestamp ${vote.ts} arrived post-deadline (cutoff == ${
          tooLate - 1
        }) -- vote discarded.`
      );
      return;
    }

    // 1. Verify the vote Dash address is in the valid MN snapshot.
    if (mnCollateralMap[vote.addr] === undefined) {
      logVote();
      console.warn(
        `Address ${vote.addr} not in valid MN snapshot -- vote discarded.`
      );
      return;
    }

    // 2. Verify the message payload has our valid prefix & in proper format.
    // ensure vote.msg =~ /^dte2019-/
    let m = vote.msg?.startsWith(voteMsgPrefix);
    if (m === null) {
      logVote();
      console.warn(
        `Message ${vote.msg} does not match valid vote prefix -- vote discarded.`
      );
      return;
    }
    let candidateVoteStr = vote.msg.slice(voteMsgPrefix.length);

    // 3. Verify the signature matches the message.
    let isValidAddr = dashcore.Address.isValid(
      vote.addr,
      process.env.DASH_NETWORK
    );
    if (isValidAddr === false) {
      logVote();
      console.warn(`Address ${vote.addr} is not valid -- vote discarded.`);
      return;
    }
    let message = dashcore.Message(vote.msg);
    let isValidSig = false;
    try {
      isValidSig = message.verify(vote.addr, vote.sig);
    } catch (err) {
      // no-op
    }
    if (isValidSig === false) {
      logVote();
      console.warn(`Signature ${vote.sig} is not valid -- vote discarded.`);
      return;
    }

    // 4. Split the payload and assign votes per candidate.
    //    a. TamperGuard - Ensure no-one was trying to game the system by
    //       including some identifier multiple times.
    //    b. Tally votes for valid candidates.
    let candidates = candidateVoteStr.split("|");
    // let candidateVoteStr = vote.msg.split(re)[1];
    // 4a
    let isValidCandidateList = tamperGuard(candidates, handles);
    if (isValidCandidateList === false) {
      logVote();
      console.warn(`Vote failed tamper guard -- vote discarded.`);
      return;
    }

    // 4b
    candidates.forEach((identifier) => {
      candidateTally[identifier] += 1;
    });
  });

  return candidateTally;
}

function tamperGuard(voteList, handles) {
  let seen = {};

  voteList.forEach(function (v) {
    // check duplicate candidate choices
    if (seen[v] !== undefined) {
      console.warn("tamper guard - duplicate entry:", v);
      return false;
    }
    seen[v] = true;

    // check invalid candidate choice
    if (!handles.includes(v)) {
      console.warn("tamper guard - invalid choice:", v);
      return false;
    }
  });

  return true;
}

function envCheck() {
  const reqd = ["DASH_NETWORK"];
  let missing = false;
  for (let i = 0; i < reqd.length; ++i) {
    if (!(reqd[i] in process.env)) {
      console.error(`error: required env var ${reqd[i]} not set`);
      missing = true;
    }
  }
  if (missing === true) {
    process.exit(1);
  }

  if (network !== "testnet" && network !== "mainnet") {
    console.error(`error: unknown Dash network '${net}'`);
    console.error(`\texpected \"mainnet\" or \"testnet\"`);
    process.exit(1);
  }
}

// ensure required env vars set
envCheck();

const tally = tallyVotes();

// Build a lookup table of candidate ids => display names
function buildDisplayNameMap() {
  let candidateIdMap = {};
  candidateList.forEach(function (c) {
    let displayName = c.name;
    if (c.handle.length > 0) {
      displayName += ` (${c.handle})`;
    }
    candidateIdMap[c.handle] = displayName;
  });
  return candidateIdMap;
}

const displayNames = buildDisplayNameMap();

// Sort the results by vote count and display them
const counts = {};
for (let userid in tally) {
  if (counts[tally[userid]] === undefined) {
    counts[tally[userid]] = [];
  }
  counts[tally[userid]] = [...counts[tally[userid]], userid];
}

const nums = Object.keys(counts);
nums.sort((a, b) => b - a);

console.info("");
console.info("=== Results ===");
console.info("");
nums.forEach(function (count) {
  if (count <= 0) {
    return;
  }
  counts[count].forEach(function (userid) {
    let name = displayNames[userid];
    console.info(`${count} - ${name}`);
  });
});
console.info("");
