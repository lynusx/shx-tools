import { useEffect, useState } from 'react';

import './index.css';
import {
  traverse,
  createValidators,
  copyFileToDirectory,
  getShiftInfo,
} from '../../utils/common';

function Home() {
  const [shiftInfo, setShiftInfo] = useState([]);
  const [files, setFiles] = useState([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState(true);

  useEffect(() => {
    const info = getShiftInfo(new Date());

    setShiftInfo(info);
  }, []);

  let dirs = [],
    // date = '20250530',
    date = shiftInfo[0],
    // shift = '夜班',
    shift = shiftInfo[1],
    // times = ['0', '1', '2', '3', '4', '5', '6', '20', '21', '22', '23'],
    times = shiftInfo[2],
    types = ['NG_脏污_B', 'NG_脏污_C', 'NG_划伤_C', 'NG_划伤_C'],
    path = '',
    out = [];

  const handleSourceClick = async () => {
    // 获取用户选择的目录句柄
    const rootDirHandle = await showDirectoryPicker({ startIn: 'desktop' });

    // 需要扫描的机台
    for await (const entry of rootDirHandle.values()) {
      if (entry.kind === 'directory' && /^A\d+/.test(entry.name)) {
        dirs.push(entry.name);
      }
    }

    const validators = createValidators(dirs, date, shift, times, types);

    setQuery(false);
    await traverse(rootDirHandle, 0, validators, path, out);

    setFiles(out);
    setQuery(true);
  };

  const handleTargetClick = async () => {
    // 获取目标目录句柄
    const targetDirHandle = await showDirectoryPicker({ startIn: 'desktop' });

    // 检查并请求目标目录写入权限
    if (
      (await targetDirHandle.queryPermission({ mode: 'readwrite' })) !==
      'granted'
    ) {
      if (
        (await targetDirHandle.requestPermission({ mode: 'readwrite' })) !==
        'granted'
      ) {
        throw new Error('写入目标目录权限被拒绝');
      }
    }

    for (let i = 0; i < files.length; i++) {
      const res = await copyFileToDirectory(files[i].handle, targetDirHandle);

      setTotal(i + 1);
    }

    console.log('copy end');
  };

  return (
    <>
      <div className="container">
        <div className="source">
          <button onClick={handleSourceClick}>选择源文件根目录</button>
          {!query ? (
            <span>扫描中...</span>
          ) : (
            <span>共找到：{files.length}张图片</span>
          )}
        </div>
        <div className="target">
          <button onClick={handleTargetClick}>选择目标目录</button>
          <span>已复制 {total} 张图片</span>
        </div>
      </div>
    </>
  );
}

export default Home;