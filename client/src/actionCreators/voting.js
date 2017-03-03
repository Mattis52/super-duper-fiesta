import { DISABLE_VOTING, ENABLE_VOTING } from '../actions/voting';

export const disableVoting = () => ({
  type: DISABLE_VOTING,
});

export const enableVoting = () => ({
  type: ENABLE_VOTING,
});
