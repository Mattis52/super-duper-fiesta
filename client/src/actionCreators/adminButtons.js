import { ADMIN_CREATE_ISSUE, TOGGLE_REGISTRATION } from '../actionCreators/adminButtons';

export const toggleRegistration = () => ({
  type: ADMIN_CREATE_ISSUE,
});

export const createIssue = data => ({
  type: TOGGLE_REGISTRATION,
  data,
});
