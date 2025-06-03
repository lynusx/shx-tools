import { create } from 'zustand';
import { getShiftInfo } from '../utils/common';

const shiftInfo = getShiftInfo(new Date());

const useStore = create((set) => ({
  // File scanning state
  files: [],
  isScanning: false,
  scanError: null,

  // Plant
  plant: 'A',

  // Copy state
  copiedCount: 0,
  isCopying: false,
  copyError: null,

  // Query parameters
  queryParams: {
    dirs: [],
    date: shiftInfo[0],
    shift: shiftInfo[1],
    times: shiftInfo[2],
    types: ['NG_脏污_B', 'NG_脏污_C', 'NG_划伤_C', 'NG_划伤_C'],
  },

  // Actions
  setFiles: (files) => set({ files }),
  setPlant: (plant) => set({ plant }),
  setScanningState: (isScanning) => set({ isScanning }),
  setScanError: (error) => set({ scanError: error }),
  setCopiedCount: (count) => set({ copiedCount: count }),
  setCopyingState: (isCopying) => set({ isCopying }),
  setCopyError: (error) => set({ copyError: error }),
  updateQueryParams: (params) =>
    set((state) => ({
      queryParams: { ...state.queryParams, ...params },
    })),
}));

export default useStore;
