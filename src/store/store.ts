import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: {
    //example: exampleReducer, // Adicione outros reducers aqui
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;