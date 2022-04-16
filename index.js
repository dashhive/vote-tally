(function (exports) {
  "use strict";

  require("dotenv").config({ path: ".env" });

  let electionSep = "-";
  let candidateSep = "|";

  // dte2019 = "Dash Trust Elections 2019"
  let voteMsgPrefix = process.env.REACT_APP_VOTE_TAG;
  // curl -fL https://dashvote.duckdns.org/api/votes > votes.json
  let votes = require(process.env.REACT_APP_VOTES_JSON);
  // curl -fL https://dashvote.duckdns.org/api/candidates > candidates.json
  let candidateList = require(process.env.REACT_APP_CANDIDATES_JSON);
  // dash-cli masternodelist json 'ENABLED' > mnlist.json
  let mnSnapshot = require(process.env.REACT_APP_MNLIST_JSON);
  // ex: 2022-04-03T00:00:00Z
  let tooEarly = new Date(process.env.REACT_APP_VOTING_START_DATE).valueOf();
  // ex: 2022-04-15T00:00:00Z
  let tooLate = new Date(process.env.REACT_APP_VOTING_END_DATE).valueOf();
  // Show votes if we're past the result date
  let now = Date.now();
  let resultDate = new Date(process.env.REACT_APP_VOTING_RESULT_DATE).valueOf();
  let showVotes = now > resultDate;
  // ex: mainnet or testnet
  let network = process.env.REACT_APP_DASH_NETWORK;

  let dashcore = require("@dashevo/dashcore-lib");

  function envCheck() {
    const reqd = [
      "REACT_APP_VOTING_START_DATE",
      "REACT_APP_VOTING_END_DATE",
      "REACT_APP_VOTING_RESULT_DATE",
      "REACT_APP_VOTE_TAG",
      "REACT_APP_DASH_NETWORK",
      "REACT_APP_API_BASE_URL",
      "REACT_APP_CANDIDATES_JSON",
      "REACT_APP_VOTES_JSON",
      "REACT_APP_MNLIST_JSON",
    ];
    let missing = false;
    for (let i = 0; i < reqd.length; i += 1) {
      if (!(reqd[i] in process.env)) {
        console.error(`error: required env var ${reqd[i]} not set`);
        missing = true;
      }
    }
    if (missing === true) {
      process.exit(1);
    }

    if (network !== "testnet" && network !== "mainnet") {
      console.error(`error: unknown Dash network '${network}'`);
      console.error(`\texpected \"mainnet\" or \"testnet\"`);
      process.exit(1);
    }
  }

  // ensure required env vars set
  envCheck();

  function buildValidMNCollateralMap() {
    let mnCollateral = {};
    Object.values(mnSnapshot).forEach(function (mn) {
      if (mn.status !== "ENABLED") {
        return;
      }

      let addrInfo = mnCollateral[mn.votingaddress];
      if (!addrInfo) {
        addrInfo = {
          addr: mn.votingaddress,
          collateralAddrs: [],
        };
        mnCollateral[mn.votingaddress] = addrInfo;
      }

      if (!addrInfo.collateralAddrs.includes(mn.collateraladdress)) {
        addrInfo.collateralAddrs.push(mn.collateralAddress);
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
      candidateTally[handle] = {
        handle: handle,
        total: 0,
        unique: 0,
      };
    });

    // Sort Descending
    // (most recent votes come first)
    votes.sort(function (a, b) {
      let aDate = new Date(a.ts).valueOf();
      let bDate = new Date(b.ts).valueOf();
      if (!aDate || !bDate) {
        let aVote = JSON.stringify(a);
        let bVote = JSON.stringify(b);
        throw new Error(`invalid timestamp:\na: ${aVote}\nb:${bVote}`);
      }
      return bDate - aDate;
    });

    function isVoteValid(vote) {
      // log entire vote so we know which one if discarded
      function logVote() {
        /*
      console.warn(
        `Vote <addr:${vote.addr}, msg:${vote.msg}, sig:${vote.sig}, ts:${vote.ts}>`
      );
      */
      }

      // 0. Verify the message payload is for *this* election
      //    (ex: starts with 'dte2022-')
      let hasPrefix = vote.msg?.startsWith(`${voteMsgPrefix}${electionSep}`);
      if (!hasPrefix) {
        logVote();
        let prefix = (vote.msg || "").split(electionSep)[0];
        console.warn(`${vote.addr} | ERR_PREF | discard vote for '${prefix}'`);
        return false;
      }

      // 1. Verify the address is a Dash mainnet address
      let isValidAddr = dashcore.Address.isValid(
        vote.addr,
        process.env.REACT_APP_DASH_NETWORK
      );
      if (isValidAddr === false) {
        logVote();
        console.warn(
          `${vote.addr} | ERR_ADDR | discard non-Dash, non-mainnet address`
        );
        return false;
      }

      // 2. Verify the signature matches the message.
      let message = dashcore.Message(vote.msg);
      let isValidSig = false;
      try {
        isValidSig = message.verify(vote.addr, vote.sig);
      } catch (err) {
        // no-op
      }
      if (!isValidSig) {
        logVote();
        console.warn(`${vote.addr} | ERR_VSIG | discard invalid signature`);
        return false;
      }

      let ts = new Date(vote.ts);
      vote.ts = vote.ts.replace("T", "").replace(/\.\d+/, "");

      // 3. Discard votes that were cast too late
      if (ts >= tooLate) {
        logVote();
        console.warn(
          `${vote.addr} | ERR_LATE | discard vote cast at ${vote.ts}`
        );
        return false;
      }

      // 4. Discard votes that were cast too early
      if (ts < tooEarly) {
        logVote();
        console.warn(
          `${vote.addr} | ERR_EARL | discard vote cast at ${vote.ts}`
        );
        return false;
      }

      // 5. Ignore duplicate (earlier) votes
      if (seenCollateral[vote.addr]) {
        // go crazy here. invalid dataset.
        console.warn(
          `${vote.addr} | ERR_DUPL | discard duplicate (earlier) vote`
        );
        return false;
      }
      seenCollateral[vote.addr] = true;

      // 6. Split the payload and assign votes per candidate.
      //    a. TamperGuard - Ensure no-one was trying to game the system by
      //       including some identifier multiple times.
      let candidateVoteStr = vote.msg.slice(
        `${voteMsgPrefix}${electionSep}`.length
      );
      let candidates = candidateVoteStr.split(candidateSep);

      // 7. Only qualified candidates can be voted for, and only once
      let isValidCandidateList = tamperGuard(candidates, handles);
      if (!isValidCandidateList) {
        logVote();
        console.warn(
          `${vote.addr} | ERR_CUST | discarded vote with write-in candidate(s)`
        );
        return false;
      }

      // 8. Verify the vote Dash address is in the valid MN snapshot.
      if (!mnCollateralMap[vote.addr]) {
        logVote();
        console.warn(
          `${vote.addr} | ERR_UNKN | discarded non-registered address`
        );
        return false;
      }

      return true;
    }

    let validVotes = votes.filter(isVoteValid);

    // Tally votes for valid candidates.
    validVotes.forEach(function (vote) {
      let weight = mnCollateralMap[vote.addr].collateralAddrs.length;

      // ex: dte2022-mike|sally|yo-gaba-gaba
      let candidateVoteStr = vote.msg
        .split(electionSep)
        .slice(1)
        .join(electionSep);

      let candidatesMap = {};
      candidateVoteStr.split(candidateSep).forEach(function (handle) {
        candidatesMap[handle] = true;
      });

      let candidates = Object.keys(candidatesMap);
      candidates.forEach((identifier) => {
        candidateTally[identifier].total += weight;
        candidateTally[identifier].unique += 1;
      });
    });

    let tallies = Object.keys(candidateTally).map(function (handle) {
      return candidateTally[handle];
    });

    tallies.sort(function (a, b) {
      return b.total - a.total;
    });

    return tallies;
  }

  function tamperGuard(voteList, handles) {
    let seen = {};

    function isValid(v) {
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

      return true;
    }

    return voteList.every(isValid);
  }

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

  const tallies = tallyVotes();

  console.info("");
  console.info("=== Results ===");
  console.info("");
  tallies.forEach(function (tally) {
    // show **** instead of name
    let name = displayNames[tally.handle];
    if (!showVotes) {
      name = name
        .split("")
        .map(function () {
          return "*";
        })
        .join("");
    }
    console.info(`${tally.total} (from ${tally.unique} voters) - ${name}`);
  });
  console.info("");
})(("undefined" === module && window) || module.exports);
