import {  useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store/Store';

// Hook personalizado com tipagem correta para o dispatch
export const useAppDispatch: () => AppDispatch = useDispatch;

// Hook personalizado com tipagem correta para o selector
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
