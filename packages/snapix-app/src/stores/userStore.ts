import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface FacebookData {
  pages?: any[];
  insights?: any;
}

interface UserState {
  facebookData: FacebookData;
  setFacebookData: (data: FacebookData) => void;
  clearFacebookData: () => void;
}

export const useUserStore = create<UserState>()(
  immer((set) => ({
    facebookData: {},

    setFacebookData: (data) =>
      set((state) => {
        state.facebookData = { ...state.facebookData, ...data };
      }),

    clearFacebookData: () =>
      set((state) => {
        state.facebookData = {};
      }),
  }))
);