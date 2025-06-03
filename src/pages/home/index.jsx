import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../store';
import {
  Container,
  Box,
  Button,
  Text,
  RadioGroup,
  Flex,
  Card,
  Heading,
  Progress,
} from '@radix-ui/themes';
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
    plant,
    isScanning,
    scanError,
    copiedCount,
    isCopying,
    copyError,
    queryParams,
    setFiles,
    setPlant,
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

      const dirs = [];
      for await (const entry of rootDirHandle.values()) {
        const regStr = new RegExp(`^${plant}\\d+`);

        if (entry.kind === 'directory' && regStr.test(entry.name)) {
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
  }, [queryParams, plant, setFiles, setScanningState, setScanError]);

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
    <Container size="2">
      <Card size="4" style={{ marginTop: '2rem' }}>
        <Heading size="6" align="center" mb="6">
          图片拷贝
        </Heading>

        <Box mb="6">
          <Flex align="center" gap="4">
            <Text weight="bold">厂区选择</Text>
            <RadioGroup.Root defaultValue={plant} onValueChange={setPlant}>
              <Flex gap="2">
                <RadioGroup.Item value="A">东区</RadioGroup.Item>
                <RadioGroup.Item value="B">西区</RadioGroup.Item>
              </Flex>
            </RadioGroup.Root>
          </Flex>
        </Box>

        <Flex direction="column" gap="6">
          <Box>
            <Button
              size="3"
              variant="soft"
              color="blue"
              onClick={handleSourceClick}
              disabled={isScanning || isCopying}
              style={{ width: '100%' }}
            >
              {isScanning ? '扫描中...' : '选择源文件根目录'}
            </Button>
            {scanError && (
              <Text color="red" size="2" mt="2">
                {scanError}
              </Text>
            )}
            <Text align="center" color="gray" size="2" mt="2">
              共找到：{files.length} 张图片
            </Text>
          </Box>

          <Box>
            <Button
              size="3"
              variant="soft"
              color="green"
              onClick={handleTargetClick}
              disabled={!files.length || isScanning || isCopying}
              style={{ width: '100%' }}
            >
              {isCopying ? '复制中...' : '选择目标目录'}
            </Button>
            {copyError && (
              <Text color="red" size="2" mt="2">
                {copyError}
              </Text>
            )}
            {copiedCount > 0 && (
              <Box mt="4">
                <Flex justify="between" mb="2">
                  <Text size="2" color="gray">
                    进度
                  </Text>
                  <Text size="2" color="gray">
                    {Math.round((copiedCount / files.length) * 100)}%
                  </Text>
                </Flex>
                <Progress
                  value={(copiedCount / files.length) * 100}
                  color="green"
                />
                <Text align="center" color="gray" size="2" mt="2">
                  已复制 {copiedCount} / {files.length} 张图片
                </Text>
              </Box>
            )}
          </Box>
        </Flex>
      </Card>

      <Toast
        open={toast.open}
        setOpen={(open) => setToast({ ...toast, open })}
        title={toast.title}
        description={toast.description}
        type={toast.type}
      />
    </Container>
  );
}

export default Home;