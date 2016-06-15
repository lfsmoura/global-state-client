import { createStore } from 'redux';
import io from 'socket.io-client';

function makeResetable(reducer, resetType) {
  return (state, action) => action.type === resetType ?
      reducer(action.state, action) : reducer(state, action);
}

export default function createGlobalStore({
        reducer,
        prefix = 'global',
        room = '/',
        socket = io()
      }, cb) {
  var store = createStore(makeResetable(reducer, `${prefix}.RESET`));
  var _dispatch = store.dispatch;

  store.dispatch = (action) => socket.emit(`${prefix}.action`, action);

  store.join = (room, cb) => socket.emit(`${prefix}.join`, room, (state) => {
    _dispatch.call(store, {
      type: `${prefix}.RESET`,
      state
    });
    if (cb) {
      cb(null, store);
    }
  });

  socket.on(`${prefix}.action`, (action) => _dispatch.call(store, action));

  store.join(room, cb);

  store.subscribe(() => socket.emit(`${prefix}.state`, store.getState()));

  return store;
}
