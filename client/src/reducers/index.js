import { combineReducers } from 'redux';
import issues from './issues';
import meeting from './meeting';
import voterKey from './voterKey';
import totalUsers from './totalUsers';
import votingEnabled from './votingEnabled';
import registrationEnabled from './adminButtons';

const votingApp = combineReducers({
  issues,
  meeting,
  voterKey,
  totalUsers,
  votingEnabled,
  registrationEnabled,
});

export default votingApp;