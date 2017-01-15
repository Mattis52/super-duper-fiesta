import React from 'react';
import ActiveIssue from '../containers/ActiveIssue';

class AdminPanel extends React.Component {
  constructor() {
    super();

    this.state = {
      openRegistration: false,
    };

    this.toggleRegistration = this.toggleRegistration.bind(this);
    this.userAdministration = this.userAdministration.bind(this);
    this.endGAM = this.endGAM.bind(this);
  }

  toggleRegistration() {
    this.props.toggleRegistration();
  }

  userAdministration() {
    // This should take you to the user administration
  }

  endGAM() {
    // This should close the general annual meeting.
  }

  render() {
    const registrationOpen = this.state.registrationOpen ?
      'Registreringen åpen' : 'Registrering lukket';

    return (
      <div className="AdminPanel">
        <h2>Admin panel</h2>
        <ActiveIssue className="fefef" />
        <div className="MeetingAdmin">
          <button onClick={this.toggleRegistration}>{registrationOpen}</button>
          <button onClick={this.userAdministration}>Brukeradministrasjon</button>
          <button onClick={this.endGAM}>Avslutt generalforsamling</button>
        </div>
      </div>
    );
  }
}

export default AdminPanel;
