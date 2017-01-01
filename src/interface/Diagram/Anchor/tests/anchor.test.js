// external imports
import React from 'react'
import TestBackend from 'react-dnd-test-backend'
import { DragDropContext } from 'react-dnd'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'
// local imports
import { sidebarWidth } from 'interface/Sidebar/styles'
import Diagram from 'interface/Diagram'
import { DraggableAnchor } from '..'
import { createStore } from 'store'
import { addAnchors, selectElements } from 'actions/elements'
import { relativePosition, fixPositionToGrid } from 'utils'
import Anchor from '..'

// a test component
const Test = DragDropContext(TestBackend)(
    React.createClass({
      render: function () {
        return (
            <Provider store={this.props.store}>
                <Diagram/>
            </Provider>
        )
      }
    })
)


describe('Interface Components', function() {
    describe('Anchor', function() {
        it('updates the appropriate entry in the store when dragged (snaps to grid)', function() {
            // a store to test with
            const store = createStore()
            // add an anchor
            store.dispatch(addAnchors(
                {
                    id: 1,
                    x: 50,
                    y: 50
                }
            ))

            // mount the anchor/diagram combo
            const wrapper = mount(<Test store={store} />)

            // obtain a reference to the dnd backend
            const backend = wrapper.get(0).getManager().getBackend()
            // get the handler id of the anchor
            const sourceId = wrapper.find(DraggableAnchor).get(0).getHandlerId()

            // the location to move the anchor to
            const move = {x: 398, y: 205}

            // move the anchor 50 to the right
            backend.simulateBeginDrag([sourceId], {
                clientOffset: move, // this should be offset by sidebarWidth
                getSourceClientOffset: () => ({x: 0, y: 0})
            })

            // figure out the move in the diagram coordinates
            const expectedMove = fixPositionToGrid(relativePosition(move), store.getState().info.gridSize)

            // make sure the anchor was moved to the appropriate place
            expect(store.getState().elements.anchors[1].x).to.equal(expectedMove.x)
            expect(store.getState().elements.anchors[1].y).to.equal(expectedMove.y)
        })

        it('clicking on the anchor selects it', function() {
                        // a store to test with
            const store = createStore()
            // add an anchor
            store.dispatch(addAnchors(
                {
                    id: 1,
                    x: 50,
                    y: 50
                }
            ))
            // mount the anchor/diagram combo
            const wrapper = mount(<Test store={store} />)

            // find the anchor and click it
            wrapper.find(Anchor).simulate('click')

            // make sure there is only one selected element
            expect(store.getState().elements.selection).to.deep.equal([{type: 'anchors', id: 1}])
        })
    })
})