import { connect } from 'react-redux';
import Issue from '../components/Issue';

const mapStateToProps = (state) => ({
  issue: state.issues.length ?
    state.issues[state.issues.length - 1].text :
    undefined,
});

export default connect(
  mapStateToProps,
)(Issue);
