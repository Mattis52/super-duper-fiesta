import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import DocumentTitle from 'react-document-title';
import { activeIssueExists, getIssueText, getIssueKey } from 'features/issue/selectors';
import Card from '../../Card';
import Loader from '../Loader';
import css from './Issue.css';

const Issue = ({ issueExists, text, secret, showOnlyWinner, countingBlankVotes, voteDemand }) => (
  <DocumentTitle title={text}>
    <Card
      classes={css.issue}
      subtitle={'Aktiv sak'}
    >
      <p>{text}</p>
      {text === Issue.defaultProps.text && (
        <Loader />
      )}
      {issueExists && <div>
        <p className={css.infoTags}>{
          `Hemmelig: ${(secret ? ' Ja' : ' Nei')}`
        }</p>
        <p className={css.infoTags}>{
          `Vis bare vinner: ${(showOnlyWinner ? ' Ja' : ' Nei')}`
        }</p>
        <p className={css.infoTags}>{
          `Blanke stemmer telles: ${(countingBlankVotes ? ' Ja' : ' Nei')}`
        }</p>
        <p className={css.infoTags}>{
          `Minimum stemmer for vedtak: ${(voteDemand === 'regular' ? '1/2' : '2/3')}`
        }</p>
      </div>}
    </Card>
  </DocumentTitle>
);

Issue.defaultProps = {
  issueExists: false,
  text: 'Ingen aktiv sak for øyeblikket.',
  secret: false,
  showOnlyWinner: false,
  countingBlankVotes: false,
  voteDemand: 'regular',
};

Issue.propTypes = {
  issueExists: PropTypes.bool,
  text: PropTypes.string,
  secret: PropTypes.bool,
  showOnlyWinner: PropTypes.bool,
  countingBlankVotes: PropTypes.bool,
  voteDemand: PropTypes.string,
};


const mapStateToProps = state => ({
  issueExists: activeIssueExists(state),
  text: getIssueText(state),
  secret: getIssueKey(state, 'secret'),
  showOnlyWinner: getIssueKey(state, 'showOnlyWinner'),
  countingBlankVotes: getIssueKey(state, 'countingBlankVotes'),
  voteDemand: getIssueKey(state, 'voteDemand'),
});

export default Issue;
export const IssueContainer = connect(
  mapStateToProps,
)(Issue);
