// external imports
import { Map, Stack, fromJS } from 'immutable'
// local imports
import {
    COMMIT,
    UNDO,
    REDO,
    GOTO,
} from 'actions/history'

// the default configuration
const defaultConfig = {
    initialMessage: ''
}

// history is implemented as a store enhancer (higher-order reducer)
export default function historyEnhancer(reducer, config = defaultConfig) {
    // the reducer's initial state
    const wrappedInitial = reducer(undefined, {})
    // the initial state of the enhanced reducer
    const initialState = {
        history: Map({
            head: 0,
            log: Stack()
        })
    }

    return ({history, ...state} = initialState, {type, payload}) => {
        // the user's state
        const userState = Object.values(state).length > 0 ? state : undefined
        // the next state of the store
        const next = reducer(userState, {type, payload})

        // if we have to commit a new state to the log
        if (type === COMMIT) {
            // the new entry in the commit log
            const entry = Map({
                message: payload,
                state,
            })

            // the log after the commit needs to include this entry and clear everything after
            let log = history.get('log')
            // add the entry to the top of the current location in the log
            log = log.takeLast(log.size - history.get('head')).push(entry)

            // return the previous state with the current one appended to the log (head goes to 0)
            return {
                ...next,
                history: history
                            .set('head', 0)
                            .set('log', log)
            }
        }

        // if we have to step back in history
        if (type === UNDO) {
            // the current head
            const head = history.get('head')
            const newHead = head === history.get('log').size - 1 ? head : head + 1
            // retrieve the appropriate entry in the log
            const entry = history.get('log').get(newHead)
            // get the state stored within
            const state = entry.get('state')

            // return the appropriate state and decrement the head
            return {
                ...state,
                history: history.set('head', newHead)
            }
        }

        // if we have to go forward in history
        if (type === REDO) {
            // the current head
            const head = history.get('head')
            const newHead = head > 0 ? head - 1 : 0
            // retrieve the appropriate entry in the log
            const entry = history.get('log').get(newHead)

            // if we passed the end of time
            if (!entry) {
                return {
                    ...next,
                    history
                }
            }

            // get the state stored within
            const state = entry.get('state')

            // return the appropriate state and decrement the head
            return {
                ...state,
                history: history.set('head', newHead)
            }
        }

        // if we have to go to a specific commit
        if (type === GOTO) {
            // retrieve the appropriate entry in the log
            const entry = history.get('log').get(payload)
            // get the state stored within
            const state = entry.get('state')

            // return the appropriate state and decrement the head
            return {
                ...state,
                history: history.set('head', payload)
            }

        }


        // we didn't change anything so just pass along whatever the wrapper reducer gave us
        return {
            ...next,
            history: history,
        }
    }
}
