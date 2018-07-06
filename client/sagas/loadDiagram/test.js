// external imports
import { put } from 'redux-saga/effects'
// local imports
import { loadDiagramWorker } from '.'
import { loadDiagram, loadPattern } from 'actions/elements'
import { setDiagramTitle } from 'actions/info'

describe('Sagas', () => {
    describe('Load Diagram', () => {
        test('loads elements over the current state', () => {
            // the description of the anchor to create
            const desc = {
                elements: 'hello',
                title: 'hello',
            }

            // get the generator
            const gen = loadDiagramWorker(loadDiagram(desc))

            // the first thing to do is clear all visible elements
            expect(gen.next().value).toEqual(put(loadPattern({ elements: desc.elements })))

            // then we need to set the title of the diagram
            expect(gen.next().value).toEqual(put(setDiagramTitle(desc.title)))

            // should add a commit of the new state
            expect(gen.next().value).toEqual(put(commit('loaded diagram: hello')))

            // we should be finished
            expect(gen.next().done).toBeTruthy()
        })
    })
})
