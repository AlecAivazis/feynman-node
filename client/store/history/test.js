// external impots
import { Stack, Map, fromJS } from 'immutable'
import _ from 'lodash'
// local imports
import historyEnhancer from '.'
import { commit, undo, redo, goto } from 'actions/history'

describe('Reducers', () => {
    describe('History Store Enhancer', () => {
        // the initial state of our mock wrapped reducer
        const reducerInitial = {innerState: 'world'}
        // the reducer to wrap
        const reducer = (state=reducerInitial, {type, payload}) => type === 'test' ? ({...state, innerState: payload}) : state
        const reducerAction = payload => ({type: 'test', payload})
        // wrap the reducer
        const wrapped = historyEnhancer(reducer)

        // the initial state of the reducer being tested
        let initial

        beforeEach(() => {
            // the initial state
            initial = wrapped(undefined, {})
        })

        test('silently wraps a reducer', () => {
            const wrappedState = wrapped(reducerInitial, reducerAction('moon'))
            const reducerState = reducer(reducerInitial, reducerAction('moon'))
            // make sure the result is the same as the unwrapped version
            expect(wrappedState).toMatchObject(reducerState)
        })

        test('head and log accomodate reducer initial state', () => {
            expect(initial.history).toEqual(Map({
                head: 0,
                log: Stack.of(
                    Map({
                        message: '',
                        state: reducerInitial,
                    })
                )
            }))
        })

        test('can set initial message', () => {
            // wrap the reducer
            const reducerWithMessage = historyEnhancer(reducer, {initialMessage: "hello"})
            initial = reducerWithMessage(undefined, {})

            expect(initial.history).toEqual(Map({
                head: 0,
                log: Stack.of(
                    Map({
                        message: "hello",
                        state: reducerInitial,
                    })
                )
            }))
        })

        test('committing a appends the current state to the log', () => {
            // mutate the state and commit it
            const middle = wrapped(initial, reducerAction('middle state'))
            const committed = wrapped(middle, commit('test msg'))

            // mutate the state and commit it
            let final = wrapped(committed, reducerAction('final state'))
            const { state, history } = wrapped(final, commit('test msg2'))

            // make sure the head still points to the most recent value
            expect(history.get('head')).toEqual(0)

            // and that the rest of the log
            expect(history.get('log').get(2).get('state')).toMatchObject(
                _.omit(initial, 'history')
            )
            expect(history.get('log').get(1).get('state')).toMatchObject(
                _.omit(committed, 'history')
            )
            expect(history.get('log').get(0).get('state')).toMatchObject(
                _.omit(state, 'history')
            )
        })

        test('undo bumps the head by one and mutates the state', () => {
            // perform a mutation
            const mutated = wrapped(initial, reducerAction('moon'))
            // commit the new state and return to the original location
            const committed = wrapped(mutated, commit('test msg'))

            const mutated2 = wrapped(committed, reducerAction('moon2'))
            const committed2 = wrapped(mutated2, commit('test msg2'))

            const {history, ...undoState} = wrapped(committed2, undo())

            // make sure we are back where we started
            expect(undoState).toEqual(_.omit(committed, 'history'))

            // make sure the head has been increased (this wont exist so dont go further)
            expect(history.get('head')).toEqual(1)
        })

        test('redo reduces the head bumps the head by one and mutates the state', function() {
            // perform a mutation
            const mutated = wrapped(initial, reducerAction('moon'))

            // commit the new state, return to the original location, and then move forward one
            const committed = wrapped(mutated, commit('test msg'))
            const undoState = wrapped(committed, undo())

            const {history, ...redoState} = wrapped(undoState, redo())

            // make sure the head has been increased back to the most recent change
            expect(history.get('head')).toEqual(0)
            // make sure we are back where we belong
            expect(redoState).toEqual(_.omit(committed, 'history'))
        })

        test('goto sets the head to a specific index', () => {
            // perform and commit a mutation
            const mutated = wrapped(initial, reducerAction('first state'))
            const committed = wrapped(mutated, commit('first msg'))
            // perform and commit a mutation
            const mutated2 = wrapped(committed, reducerAction('second state'))
            const committed2 = wrapped(mutated2, commit('second msg'))
            // perform and commit a mutation
            const mutated3 = wrapped(committed2, reducerAction('third state'))
            const committed3 = wrapped(mutated3, commit('third msg'))

            // go to the state 2 commits ago
            const gotoState = wrapped(committed3, goto(2))
            // the head of the log
            const head = gotoState.history.get('head')

            // make sure the head has been set
            expect(head).toEqual(2)
            // make sure the state of the reducer is what we expect
            expect(_.omit(gotoState, 'history')).toMatchObject(_.omit(committed, 'history'))
        })
    })
})