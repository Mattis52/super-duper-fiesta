/* This is used to bootstrap a database for this project */

const mongoose = require('mongoose');

const addIssue = require('./models/issue').addIssue;
const getActiveQuestion = require('./models/issue').getActiveQuestion;
const addGenfors = require('./models/meeting').addGenfors;
const getActiveGenfors = require('./models/meeting').getActiveGenfors;

require('./models/essentials');

const tearDown = () => {
  mongoose.disconnect();
};

// Checks for an active issue given an AGM, and creates on if none exists.
const getIssue = genfors => new Promise((resolve, reject) => {
  getActiveQuestion(genfors).then((issue) => {
    if (issue) {
      console.log(`Currently active issue: ${issue.description}`);
      resolve('done');
    } else {
      console.log('No currently active issue. Inserting...');
      addIssue({
        genfors,
        description: 'Example Issue #1',
        options: [
          { text: 'Hello' },
          { text: 'World' },
          { text: 'FeelsBadMan' },
        ],
        voteDemand: 0.5,
        qualifiedUsers: 3,
      }).then((insertedIssue) => {
        console.log(`Inserting issue successful => ${insertedIssue.description}`);
        resolve('done');
      }).catch((err) => {
        reject(new Error(`Inserting issue failed => ${err}`));
      });
    }
  }).catch((err) => {
    console.error('Error in getting active issue.', err);
  });
});

// Wrapper function to ensure clean shutdown after getting or inserting issue
const getOrInsertIssue = (genfors) => {
  getIssue(genfors).then(() => {
    tearDown();
  }).catch((err) => {
    console.error('Something went wrong', err);
    tearDown();
  });
};

// Get the currently active genfors, or insert one if none exists.
getActiveGenfors().then((genfors) => {
  if (genfors && genfors.title) {
    console.log(`Currently active genfors: ${genfors.title}`);
    getOrInsertIssue(genfors);
  } else {
    console.log('No active genfors. Inserting...');
    addGenfors('Onlines Generalforsamling 1970',
               new Date('1970-01-01T00:00:00.000Z'), 'my beautiful password hash')
      .then((insertedGenfors) => {
        getOrInsertIssue(insertedGenfors);
      }).catch((err) => {
        console.error('Error in adding genfors.', err);
      });
  }
}).catch((err) => {
  console.error('Error in getting active genfors.', err);
});