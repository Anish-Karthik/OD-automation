import { type StateCreator, create } from "zustand";

type UseDurationDetails = {
  dates: string[];
  addDate: (date: string) => void;
  removeDate: (date: string) => void;
  setDates: (dates: string[]) => void;
};

type MyStateCreator = StateCreator<UseDurationDetails, []>;

const durationDetailsStore: MyStateCreator = (set, get) => ({
  dates: [],
  addDate: (date) =>
    set((state) => ({
      dates: [...state.dates, date].sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      ),
    })),
  removeDate: (date) =>
    set((state) => ({
      dates: state.dates.filter((d) => d !== date),
    })),
  setDates: (dates) => set({ dates }),
});

export const useDurationDetails = create(durationDetailsStore);
