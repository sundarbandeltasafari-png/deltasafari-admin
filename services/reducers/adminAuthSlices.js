import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'adminAuth',
  initialState :{
    user: null,
    token: null,
    isLogin: false
  },
  reducers: {
    setUser: (state, action)=> {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isLogin = true;
    },
    removeUser: (state)=> {
      state.user = null
       state.token = null;
      state.isLogin = false;
    }
  }
})

export const { setUser, removeUser } = authSlice.actions
export default authSlice.reducer