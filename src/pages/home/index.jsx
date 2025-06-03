import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../store';
import {
  traverse,
  createValidators,
  copyFileToDirectory,
} from '../../utils/common';
import { Toast } from '../../components/Toast';
import './index.css';

function Home() {
  const {
    files,
    isScanning,
    scanError,
    copiedCount,
    isCopying,
    copyError,
    queryParams,
    setFiles,
    setScanningState,
    setScanError,
    setCopiedCount,
    setCopyingState,
    setCopyError,
  } = useStore();

  const [toast, setToast] = useState({ open: false });

  const showToast = (title, description, type) => {
    setToast({ open: true, title, description, type });
  };

  const handleSourceClick = useCallback(async () => {
    try {
      setFiles([]);
      setScanError(null);

      const rootDirHandle = await showDirectoryPicker({ startIn: 'desktop' });
      setScanningState(true);
      showToast('扫描开始', '正在扫描文件...', 'info');

      console.log(queryParams);
      const dirs = [];
      for await (const entry of rootDirHandle.values()) {
        if (entry.kind === 'directory' && /^A\d+/.test(entry.name)) {
          dirs.push(entry.name);
        }
      }

      const validators = createValidators(
        dirs,
        queryParams.date,
        queryParams.shift,
        queryParams.times,
        queryParams.types
      );

      const out = [];
      await traverse(rootDirHandle, 0, validators, '', out);
      setFiles(out);
      showToast('扫描完成', `共找到 ${out.length} 张图片`, 'success');
    } catch (error) {
      setScanError(error.message);
      showToast('扫描失败', error.message, 'error');
      console.error('Scanning error:', error);
    } finally {
      setScanningState(false);
    }
  }, [queryParams, setFiles, setScanningState, setScanError]);

  const handleTargetClick = useCallback(async () => {
    if (!files.length) return;

    try {
      setCopyError(null);
      setCopiedCount(0);

      const targetDirHandle = await showDirectoryPicker({ startIn: 'desktop' });
      showToast('复制开始', '正在复制文件...', 'info');

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

      setCopyingState(true);

      for (let i = 0; i < files.length; i++) {
        await copyFileToDirectory(files[i].handle, targetDirHandle);
        setCopiedCount(i + 1);
      }

      showToast('复制完成', `已复制 ${files.length} 张图片`, 'success');
    } catch (error) {
      setCopyError(error.message);
      showToast('复制失败', error.message, 'error');
      console.error('Copy error:', error);
    } finally {
      setCopyingState(false);
    }
  }, [files, setCopyingState, setCopyError, setCopiedCount]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8"
      >
        <h1 className="text-3xl font-bold mb-8 text-gray-800 text-center">
          图片拷贝
        </h1>

        <div className="space-y-8">
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={handleSourceClick}
              disabled={isScanning || isCopying}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-lg font-medium shadow-md hover:from-blue-600 hover:to-blue-700 transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isScanning ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  扫描中...
                </span>
              ) : (
                '选择源文件根目录'
              )}
            </button>
            {scanError && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-sm"
              >
                {scanError}
              </motion.p>
            )}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-600 text-center"
            >
              共找到：{files.length} 张图片
            </motion.p>
          </motion.div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={handleTargetClick}
              disabled={!files.length || isScanning || isCopying}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-medium shadow-md hover:from-green-600 hover:to-green-700 transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isCopying ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  复制中...
                </span>
              ) : (
                '选择目标目录'
              )}
            </button>
            {copyError && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-sm"
              >
                {copyError}
              </motion.p>
            )}
            {copiedCount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative pt-1"
              >
                <div className="flex mb-2 items-center justify-between">
                  <div className="text-xs font-semibold inline-block text-green-600">
                    {Math.round((copiedCount / files.length) * 100)}%
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(copiedCount / files.length) * 100}%`,
                    }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                  />
                </div>
                <p className="text-gray-600 text-center">
                  已复制 {copiedCount} / {files.length} 张图片
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>

      <Toast
        open={toast.open}
        setOpen={(open) => setToast({ ...toast, open })}
        title={toast.title}
        description={toast.description}
        type={toast.type}
      />
    </div>
  );
}

export default Home;
