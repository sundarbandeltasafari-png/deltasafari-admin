import { createSlice } from '@reduxjs/toolkit'

const permisionSlice = createSlice({
    name: 'adminAuth',
    initialState: {
        permisions: [],
        fetched: false
    },
    reducers: {
        updatePermision: (state, action) => {
            state.permisions = action.payload.permisions;
            state.fetched = true;
        },
        removePermision: (state, action) => {
            state.permisions = [];
            state.fetched = false;
        }
    }
})

export const { updatePermision, removePermision } = permisionSlice.actions
export default permisionSlice.reducer