let state = false;

const getState = () => state;

/**
 * Update the state of order processing.
 *
 * @param {boolean} newState
 */
const setState = (newState) => {
  state = newState;
};

export default {
  getState,
  setState,
};
