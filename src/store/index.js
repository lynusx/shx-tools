import { create } from 'zustand';

// 保存所有的查询参数
const useQueryParamsStore = create((set) => ({
  dirs: ['A01-A', 'A01-B'],
  date: '20250530',
  shift: '夜班',
  times:['0', '1', '2', '3', '4', '5', '6', '20', '21', '22', '23'],
  types = ['NG_脏污_B', 'NG_脏污_C', 'NG_划伤_C', 'NG_划伤_C'],
}));