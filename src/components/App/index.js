import React from 'react';
import LiveVoteCount from '../../containers/LiveVoteCount';
import VoteHandler from '../../containers/VoteHandler';
import ActiveIssue from '../../containers/ActiveIssue';
import Heading from '../Heading';
import ConcludedIssueListContainer from '../../containers/ConcludedIssueListContainer';

const App = () => (
  <div className="App">
    <Heading />
    <ActiveIssue />
    <LiveVoteCount />
    <VoteHandler />
    <ConcludedIssueListContainer />
  </div>
  );

export default App;
