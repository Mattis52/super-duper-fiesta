const model = require('../models/issue.accessors');
const logger = require('../logging');
const { getQualifiedUsers } = require('../models/user.accessors');
const { getActiveGenfors } = require('../models/meeting.accessors');
const { getVotes } = require('../models/vote.accessors');
const { canEdit } = require('./meeting');

const permissionLevel = require('../../common/auth/permissions');
const { RESOLUTION_TYPES } = require('../../common/actionTypes/voting');
const { VOTING_IN_PROGRESS, VOTING_FINISHED } = require('../../common/actionTypes/issues');


async function endIssue(question, user) {
  logger.debug('Closing issue', { issue: question });
  const genfors = await getActiveGenfors();
  const result = await canEdit(permissionLevel.IS_MANAGER, user, genfors.id);
  if (result === true) {
    return model.endIssue(question);
  }
  throw new Error('permission denied');
}

async function addIssue(issueData, closeCurrentIssue) {
  logger.debug('Creating issue', issueData);
  const genfors = await getActiveGenfors();
  if (!genfors) throw new Error('No genfors active');
  const activeIssue = model.getActiveQuestion(genfors.id);
  if (activeIssue && activeIssue.active && !closeCurrentIssue) {
    throw new Error("There's already an active question");
  }

  const users = await getQualifiedUsers(genfors.id);
  const meetingId = genfors.id;
  const data = Object.assign(issueData, {
    meetingId,
    qualifiedVoters: users.length,
    currentVotes: 0,
  });

  const { id: issueId } = await model.addIssue(data, issueData.alternatives);
  logger.debug('Created issue', { issueId });

  return model.getIssueWithAlternatives(issueId);
}

async function deleteIssue(issue, user) {
  const genfors = await getActiveGenfors();
  const userCanEdit = await canEdit(permissionLevel.IS_MANAGER, user, genfors.id);
  if (userCanEdit) {
    return model.deleteIssue(issue);
  }
  throw new Error("You don't have permission to delete this issue");
}

const countVoteAlternatives = (alternatives, votes) => {
  const voteObjects = Object.keys(votes).map(key => votes[key]);

  // Count votes for each alternative
  return alternatives.map(alternative => (
    voteObjects.filter(vote => vote.alternativeId.toString() === alternative.id).length
  ));
};

const isBooleanAlternatives = (alternatives) => {
  const booleanAlternatives = ['Ja', 'Nei', 'Blank'].sort();
  const sortedAlternatives = alternatives.map(alternative => alternative.text).sort();
  return sortedAlternatives.every((alt, index) => booleanAlternatives[index] === alt);
};

// Maps over alternatives to see if any of them got majority vote
const calculateWinner = (issue, votes, alternativeVoteCounts) => {
  const { alternatives } = issue;
  const voteDemand = RESOLUTION_TYPES[issue.voteDemand].voteDemand;
  const numTotalVotes = Object.keys(votes).length;

  let countingTotalVotes = numTotalVotes;
  const { countingBlankVotes } = issue;
  const blankAlternative = alternatives.find(alternative => alternative.text === 'Blank');
  const blankIdx = alternatives.indexOf(blankAlternative);
  // Subtract blank votes if they don't count
  if (!countingBlankVotes) {
    countingTotalVotes -= alternativeVoteCounts[blankIdx];
  }

  // Check if any alternative meets the vote demand
  const winnerVoteCount = alternativeVoteCounts.find((alternativeVoteCount, idx) => {
    // Skip blank vote
    if (idx === blankIdx) {
      return false;
    }
    return alternativeVoteCount / countingTotalVotes > voteDemand;
  });
  if (winnerVoteCount === undefined) {
    return null;
  }
  const winningAlternative = alternatives[alternativeVoteCounts.indexOf(winnerVoteCount)];

  if (isBooleanAlternatives(alternatives) && winningAlternative.text === 'Nei') {
    // No is not a valid winner for a boolean question
    return null;
  }
  // Find alternative id
  return winningAlternative.id;
};

const voteArrayToObject = (voteCounts, alternatives) => (
  voteCounts.reduce((voteCountObject, voteCount, index) => ({
    ...voteCountObject,
    [alternatives[index].id]: voteCount,
  }), {})
);


async function getPublicIssueWithVotes(issueIdOrObj, admin = false) {
  const issueId = issueIdOrObj.id || issueIdOrObj;
  const issue = await model.getIssueWithAlternatives(issueId);
  let votes;
  try {
    votes = await (await getVotes(issue.id))
    .reduce(async (existingVotes, nextVote) => {
      const vote = await nextVote;
      return {
        ...(await existingVotes),
        [vote.id]: vote,
      };
    }, {});
  } catch (err) {
    logger.error('Getting votes for issue failed', err, { issueId });
  }
  const muhVotes = await votes;

  const issueVotes = await muhVotes;
  const voteCounts = countVoteAlternatives(issue.alternatives, issueVotes);
  const voteData = {
    ...issue,
    concludedVotes: (issue.showOnlyWinner && !admin)
      ? {} : voteArrayToObject(voteCounts, issue.alternatives),
    winner: calculateWinner(issue, issueVotes, voteCounts),
  };
  return voteData;
}

async function disableVoting(issue, user) {
  if (await !canEdit(permissionLevel.IS_MANAGER, user, (await getActiveGenfors()).id)) {
    throw new Error('User is not authorized to disable voting on this issue.');
  }
  return model.updateIssue(issue.id, { status: VOTING_FINISHED }, { new: true });
}

async function enableVoting(issue, user) {
  if (await !canEdit(permissionLevel.IS_MANAGER, user, (await getActiveGenfors()).id)) {
    throw new Error('User is not authorized to enable voting on this issue.');
  }
  return model.updateIssue(issue.id, { status: VOTING_IN_PROGRESS }, { new: true });
}

module.exports = {
  endIssue,
  addIssue,
  deleteIssue,
  disableVoting,
  enableVoting,
  getPublicIssueWithVotes,
  calculateWinner,
  countVoteAlternatives,
};
