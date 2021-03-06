jest.mock('child_process');
jest.mock('../../models/meeting.accessors');
jest.mock('../../models/issue.accessors');
jest.mock('../../models/vote.accessors');
jest.mock('../../models/user.accessors');
jest.mock('../../utils/socketAction');
const { execSync } = require('child_process');

execSync.mockImplementation(() => Buffer.from('fake_git_hash'));
const connection = require('../connection');
const { getActiveGenfors } = require('../../models/meeting.accessors');
const { getAnonymousUser, getUsers } = require('../../models/user.accessors');
const { getVotes, getUserVote, getAnonymousUserVote } = require('../../models/vote.accessors');
const { getActiveQuestion, getIssueWithAlternatives, getConcludedIssues, getIssueById } = require('../../models/issue.accessors');
const { waitForAction } = require('../../utils/socketAction');
const { generateSocket, generateGenfors, generateAnonymousUser, generateIssue, generateVote, generateUser } = require('../../utils/generateTestData');
const permissionLevels = require('../../../common/auth/permissions');
const { VOTING_FINISHED } = require('../../../common/actionTypes/issues');

describe('connection', () => {
  beforeEach(() => {
    getActiveGenfors.mockImplementation(async () => generateGenfors());
    getAnonymousUser.mockImplementation(
      async (passwordHash, onlinewebId, meetingId) => generateAnonymousUser({
        passwordHash,
        meetingId,
      },
    ));
    getActiveQuestion.mockImplementation(async () => generateIssue());
    getIssueWithAlternatives.mockImplementation(async () => generateIssue({ id: '2' }));
    getConcludedIssues.mockImplementation(async meetingId => [
      generateIssue({ meetingId, id: '2' }),
      generateIssue({ meetingId, id: '2' }),
      generateIssue({ meetingId, id: '2' }),
      generateIssue({ meetingId, id: '2' }),
    ]);
    getVotes.mockImplementation(async issueId => [
      generateVote({ issueId, id: '1' }),
      generateVote({ issueId, id: '2' }),
      generateVote({ issueId, id: '3' }),
      generateVote({ issueId, id: '4' }),
    ]);
    getUserVote.mockImplementation(
      async () => null,
    );
    getAnonymousUserVote.mockImplementation(
      async () => null,
    );
    getUsers.mockImplementation(async () => [generateUser()]);
    getIssueById.mockImplementation(async id => generateIssue({ id }));
    waitForAction.mockImplementation(async () => ({ passwordHash: 'fake_password_hash' }));
  });

  it('emits correct actions when signed in and active genfors', async () => {
    const socket = generateSocket();
    await connection(socket);

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });

  it('emits correct actions when signed in and no active genfors', async () => {
    getActiveGenfors.mockImplementation(async () => null);
    const socket = generateSocket();
    await connection(socket);

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });

  it('emits correct actions when user has not completed registration and no genfors is active', async () => {
    getActiveGenfors.mockImplementation(async () => null);
    const socket = generateSocket({ completedRegistration: false });
    await connection(socket);

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });

  it('emits correct actions when validation of password hash returns false', async () => {
    getAnonymousUser.mockImplementation(async () => null);
    const socket = generateSocket({ completedRegistration: true });
    await connection(socket);

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });

  it('emits correct actions when validation of password hash returns throws error', async () => {
    getAnonymousUser.mockImplementation(async () => { throw new Error('Failed'); });
    getActiveGenfors.mockImplementation(async () => null);
    const socket = generateSocket({ completedRegistration: false });
    await connection(socket);

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });

  it('emits correct actions when there is no active question', async () => {
    getActiveQuestion.mockImplementation(async () => null);
    const socket = generateSocket();
    await connection(socket);

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });

  it('emits correct actions when retrieving votes fails', async () => {
    getVotes.mockImplementation(async () => { throw new Error('Failed'); });
    const socket = generateSocket();
    await connection(socket);

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });

  it('emits correct actions when active question is secret', async () => {
    getActiveQuestion.mockImplementation(async () => generateIssue({ secret: true }));
    getIssueById.mockImplementation(async id => generateIssue({ id, secret: true }));
    const socket = generateSocket();
    await connection(socket);

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });

  it('emits correct actions when user has already voted', async () => {
    getUserVote.mockImplementation(
      async (issueId, userId) => generateVote({ issueId, userId }),
    );
    const socket = generateSocket();
    await connection(socket);

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });

  it('emits correct actions when retrieving active question fails', async () => {
    getActiveQuestion.mockImplementation(async () => { throw new Error('Failed'); });
    const socket = generateSocket();
    await connection(socket);

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });

  it('emits correct actions when retrieving questions fails', async () => {
    getConcludedIssues.mockImplementation(async () => { throw new Error('Failed'); });
    const socket = generateSocket();
    await connection(socket);

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });

  it('emits sensitive data like meeting pin if user is manager', async () => {
    const socket = generateSocket({ permissions: permissionLevels.IS_MANAGER });
    await connection(socket);

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });

  it('emits final votes for issue if user is manager and voting is finished', async () => {
    getActiveQuestion.mockImplementation(async () => generateIssue({ status: VOTING_FINISHED }));
    const socket = generateSocket({ permissions: permissionLevels.IS_MANAGER });
    await connection(socket);

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });

  it('emits question without final votes if voting is finished and user is not manager', async () => {
    getActiveQuestion.mockImplementation(async () => generateIssue({ status: VOTING_FINISHED }));
    const socket = generateSocket({ permissions: permissionLevels.CAN_VOTE });
    await connection(socket);

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });

  it('emits correct actions when retrieving active genfors fails', async () => {
    getActiveGenfors.mockImplementation(async () => { throw new Error('Failed'); });
    const socket = generateSocket();
    await connection(socket);

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });
});

describe('connection when no meeting', () => {
  it('warns about no active meeting', async () => {
    const socket = generateSocket({ meetingId: null });
    await connection(socket);

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });
});
