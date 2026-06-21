import React from 'react'

const internals = 
  React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
  React.__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

if (internals) {
  // Map ReactCurrentDispatcher to wrap H inside a getter for the 'current' property,
  // since React 19's H is the dispatcher itself, but Recoil expects dispatcherRef.current.
  if (!Object.prototype.hasOwnProperty.call(internals, 'ReactCurrentDispatcher')) {
    const dispatcherWrapper = {};
    Object.defineProperty(dispatcherWrapper, 'current', {
      get() {
        return internals.H;
      },
      set(val) {
        internals.H = val;
      },
      configurable: true,
      enumerable: true
    });

    Object.defineProperty(internals, 'ReactCurrentDispatcher', {
      get() {
        return dispatcherWrapper;
      },
      configurable: true,
      enumerable: true
    });
  }

  if (!Object.prototype.hasOwnProperty.call(internals, 'ReactCurrentOwner')) {
    Object.defineProperty(internals, 'ReactCurrentOwner', {
      get() {
        return internals.T || { currentDispatcher: null };
      },
      set(val) {
        internals.T = val;
      },
      configurable: true,
      enumerable: true
    });
  }

  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = internals;
} else {
  if (typeof React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED === 'undefined') {
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
      ReactCurrentDispatcher: {
        current: null
      },
      ReactCurrentOwner: {
        currentDispatcher: null
      }
    };
  }
}
