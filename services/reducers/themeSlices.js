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
    },
    closeSidebar(state){
      state.sidebar = false
    }
  }
})

export const { themeChange, toggleSidebar, closeSidebar } = themeSlice.actions
export default themeSlice.reducer