import { combineReducers } from 'redux';
import { issues } from './issues';
import { voterKey } from './voterKey';
import { totalUsers } from './totalUsers';
import votingEnabled from './votingEnabled';

const votingApp = combineReducers({
  issues,
  voterKey,
  totalUsers,
  votingEnabled,
});

export default votingApp;
