jest.mock('../../models/meeting.accessors');
jest.mock('../../models/user.accessors');
const { AUTH_REGISTER } = require('../../../common/actionTypes/auth');
const { listener, register } = require('../auth');
const { getActiveGenfors } = require('../../models/meeting.accessors');
const { getAnonymousUser, addAnonymousUser, getUserByUsername } = require('../../models/user.accessors');
const { generateGenfors, generateSocket, generateAnonymousUser, generateUser } = require('../../utils/generateTestData');

beforeEach(() => {
  getActiveGenfors.mockImplementation(async () => generateGenfors({ pin: 1234567890 }));
  getAnonymousUser.mockImplementation(async () => null);
  addAnonymousUser.mockImplementation(
    async () => {},
  );
  getUserByUsername.mockImplementation(async (username, genfors) =>
    generateUser({ username, genfors, completedRegistration: false }));
});

const generateData = data => (Object.assign({
  pin: 1234567890,
  passwordHash: null,
  type: AUTH_REGISTER,
}, data));


describe('register', () => {
  it('emits registration status', async () => {
    const socket = generateSocket({ completedRegistration: false });
    await register(socket, generateData());

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toMatchSnapshot();
  });

  it('emits error when registration is closed', async () => {
    getActiveGenfors.mockImplementation(async () => generateGenfors({ registrationOpen: false }));
    const socket = generateSocket({ completedRegistration: false });
    await register(socket, generateData());

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });

  it('emits error when pin code is wrong', async () => {
    getActiveGenfors.mockImplementation(async () => generateGenfors({ pin: 5453577654 }));
    const socket = generateSocket({ completedRegistration: false });
    await register(socket, generateData());

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });


  it('emits error when user is already registered with wrong personal code', async () => {
    const socket = generateSocket({ completedRegistration: true }, { passwordHash: 'correct' });
    await register(
      socket,
      generateData({ passwordHash: 'wrong' }),
    );

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });


  it('emits registered when user is already registered with correct personal code', async () => {
    getAnonymousUser.mockImplementation(
      async (passwordHash, onlinewebId, meetingId) => generateAnonymousUser({
        passwordHash,
        meetingId,
      },
    ));
    const socket = generateSocket({ completedRegistration: true }, { passwordHash: 'correct' });
    await register(
      socket,
      generateData({ passwordHash: 'correct' }),
    );

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });

  it('emits error when handling errors when validating hash', async () => {
    getAnonymousUser.mockImplementation(
      async () => {
        throw new Error('Failed');
      },
    );
    const socket = generateSocket({ completedRegistration: true }, { passwordHash: 'correct' });
    await register(
      socket,
      generateData({ passwordHash: 'correct' }),
    );

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });

  it('emits error when handling errors when saving anonymous user', async () => {
    addAnonymousUser.mockImplementation(
      async () => {
        throw new Error('Failed');
      },
    );
    const socket = generateSocket({ completedRegistration: false });
    await register(
      socket,
      generateData(),
    );

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });
});

describe('listener', () => {
  it('listens to AUTH_REGISTER', async () => {
    const socket = generateSocket({ completedRegistration: false });
    await listener(socket);

    await socket.mockEmit('action', generateData());

    expect(socket.emit).toBeCalled();
    expect(socket.broadcast.emit).toBeCalled();
  });

  it('ignores INVALID_ACTION', async () => {
    const socket = generateSocket({ completedRegistration: false });
    await listener(socket);

    await socket.mockEmit('action', generateData({ type: 'INVALID_ACTION' }));

    expect(socket.emit).not.toBeCalled();
    expect(socket.broadcast.emit).not.toBeCalled();
  });
});

describe('login to registered user', () => {
  beforeEach(() => {
    getAnonymousUser.mockImplementation(
      async (passwordHash, onlinewebId, meetingId) => generateAnonymousUser({
        passwordHash,
        meetingId,
      },
    ));
  });

  it('logs you in if you have a session', async () => {
    const socket = generateSocket({ completedRegistration: true });
    await register(socket, generateData({ pin: undefined, passwordHash: 'correct' }));

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });

  it('logs you in if you supply correct personal code', async () => {
    const socket = generateSocket({
      completedRegistration: true,
      passwordHash: 'correct',
    });
    await register(socket, generateData({ pin: undefined, passwordHash: 'correct' }));

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });

  it('returns error if trying to log in with incorrect personal code', async () => {
    getAnonymousUser.mockImplementation(async () => null);
    const socket = generateSocket({ completedRegistration: true });
    await register(socket, generateData({ pin: undefined, passwordHash: 'incorrect' }));

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });

  it('works even if registration is closed', async () => {
    getActiveGenfors.mockImplementation(async () => generateGenfors({ registrationOpen: false }));

    const socket = generateSocket({
      completedRegistration: true,
      passwordHash: 'correct',
    });
    await register(socket, generateData({ passwordHash: 'correct' }));

    expect(socket.emit.mock.calls).toMatchSnapshot();
    expect(socket.broadcast.emit.mock.calls).toEqual([]);
  });
});
