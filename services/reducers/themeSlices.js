import { createSlice } from '@reduxjs/toolkit'

const themeSlice = createSlice({
  name: 'todos',
  initialState: {
    theme: "light",
    sidebar: false
  },
  reducers: {
    themeChange(state, action) {
      state.theme = action.payload.theme;
    },
    toggleSidebar(state){
      state.sidebar = !state.sidebar
    }
  }
})

export const { themeChange, toggleSidebar } = themeSlice.actions
export default themeSlice.reducer