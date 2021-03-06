const logger = require('../logging');
const { canEdit } = require('../managers/meeting');
const permissionLevel = require('../../common/auth/permissions');
const { getIssueById, getIssueWithAlternatives } = require('../models/issue.accessors');
const model = require('../models/vote.accessors');
const { VOTING_NOT_STARTED, VOTING_FINISHED } = require('../../common/actionTypes/issues');
const generateSillyName = require('../utils/sillyName');

async function getUserVote(issueId, userId) {
  const issue = await getIssueById(issueId);
  if (issue.secret) {
    return model.getAnonymousUserVote(issueId, userId);
  }
  return model.getUserVote(issueId, userId);
}

async function createVote(voterId, issueId, alternativeId) {
  const issue = await getIssueById(issueId);
  if (issue.secret) {
    return model.createAnonymousVote(voterId, issueId, alternativeId);
  }
  return model.createUserVote(voterId, issueId, alternativeId);
}

async function haveIVoted(issueId, userId) {
  const vote = await getUserVote(issueId, userId);
  return !!vote;
}

async function addVote(issueId, user, alternative, voter) {
  let issue;
  try {
    issue = await getIssueWithAlternatives(issueId);
  } catch (err) {
    logger.error('Retrieving issue for vote failed!', err, { issueId });
    throw new Error('Noe gikk galt. Vennligst prøv igjen.');
  }
  logger.debug('Storing vote.', { issueId, user: user.onlinewebId });
  if (!issue.active) {
    logger.warn('Tried to vote on inactive issue!', { issueId, user: user.onlinewebId });
    throw new Error('Saken du stemte på er ikke lenger aktiv');
  } else if (issue.status === VOTING_NOT_STARTED) {
    throw new Error('Votering for denne saken har ikke startet enda.');
  } else if (issue.status === VOTING_FINISHED) {
    throw new Error('Votering for denne saken har blitt avsluttet.');
  }
  if (!user.canVote) {
    logger.warn('Tried to vote without the right to vote!', { issueId, user: user.onlinewebId });
    throw new Error('Du er ikke stemmeberettiget');
  }
  logger.silly('Checking permissions.', { issueId, user: user.onlinewebId });
  try {
    await canEdit(permissionLevel.CAN_VOTE, user, issue.meetingId);
    const validAlternative = issue.alternatives.some(alt => alt.id.toString() === alternative);
    if (!validAlternative) {
      throw new Error('Alternativet du stemte på finnes ikke');
    }
    const alreadyVoted = await haveIVoted(issueId, voter);
    if (!alreadyVoted) {
      logger.debug('Storing vote.', { issueId, user: user.onlinewebId, voter });
      return createVote(voter, issueId, alternative);
    }
    logger.debug('User has already voted!', { issueId, user: user.onlinewebId, voter });
    throw new Error('Du har allerede stemt.');
  } catch (err) {
    logger.warn('Failed to store vote.', {
      err,
      issueId,
      user: user.onlinewebId,
      requiredPerms: permissionLevel.CAN_VOTE,
      hadPerms: user.permissions,
    });
    throw err;
  }
}

const getPublicVote = (vote, secret, showOnlyWinner) => ({
  id: vote.id,
  issueId: vote.issueId,
  userId: (showOnlyWinner || secret) ? '' : vote.userId,
  alternativeId: showOnlyWinner ? '' : vote.alternativeId,
  randomName: secret ? generateSillyName(vote.issueId + vote.anonymoususerId) : null,
});

const generatePublicVote = async (id, vote) => {
  let issue;
  if (typeof id === 'string') {
    issue = await getIssueById(id);
  } else issue = id;

  return getPublicVote(vote, issue.secret, issue.showOnlyWinner);
};

module.exports = {
  addVote,
  generatePublicVote,
  getPublicVote,
  getUserVote,
};
