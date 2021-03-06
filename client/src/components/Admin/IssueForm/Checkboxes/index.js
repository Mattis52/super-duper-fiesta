import React from 'react';
import PropTypes from 'prop-types';
import css from './Checkboxes.css';


const Checkboxes = ({
  countBlankVotes, secretVoting, showOnlyWinner,
  handleUpdateCountBlankVotes, handleUpdateSecretVoting, handleUpdateShowOnlyWinner,
}) => (
  <div>
    <h2 className={css.title}>Innstillinger</h2>
    <label className={css.checkbox}>
      <input
        type="checkbox"
        onChange={e => handleUpdateSecretVoting(e.target.checked)}
        checked={secretVoting}
      />
      Hemmelig valg
    </label>

    <label className={css.checkbox}>
      <input
        type="checkbox"
        onChange={e => handleUpdateShowOnlyWinner(e.target.checked)}
        checked={showOnlyWinner}
      />
      Vis kun vinner
    </label>

    <label className={css.checkbox}>
      <input
        type="checkbox"
        onChange={e => handleUpdateCountBlankVotes(e.target.checked)}
        checked={countBlankVotes}
      />
      Tellende blanke stemmer
    </label>
  </div>
);

Checkboxes.propTypes = {
  handleUpdateCountBlankVotes: PropTypes.func.isRequired,
  countBlankVotes: PropTypes.bool.isRequired,
  secretVoting: PropTypes.bool.isRequired,
  showOnlyWinner: PropTypes.bool.isRequired,
  handleUpdateSecretVoting: PropTypes.func.isRequired,
  handleUpdateShowOnlyWinner: PropTypes.func.isRequired,
};

export default Checkboxes;
