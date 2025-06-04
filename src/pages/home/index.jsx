import { useCallback } from 'react'
import useStore from '../../store'
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
  CheckboxGroup,
  DataList,
  Badge,
  Callout,
  Spinner,
} from '@radix-ui/themes'
import {
  traverse,
  createValidators,
  writePathsToFile,
  copyFilesInBatches,
} from '../../utils/common'
import { Toast } from '../../components/Toast'
import './index.css'
import { useToast } from '../../hooks/useToast'

function Home() {
  const {
    files,
    plant,
    types,
    isScanning,
    scanError,
    copiedCount,
    isCopying,
    copyError,
    queryParams,
    setFiles,
    setPlant,
    setTypes,
    setScanningState,
    setScanError,
    setCopiedCount,
    setCopyingState,
    setCopyError,
  } = useStore()

  const { toast, showToast, hideToast } = useToast()

  const _types = types.flatMap((item) => {
    if (item === '脏污') {
      return ['NG_脏污_B', 'NG_脏污_C']
    } else if (item === '划伤') {
      return ['NG_划伤_B', 'NG_划伤_C']
    }
  })

  const handleSourceClick = useCallback(async () => {
    try {
      setFiles([])
      setScanError(null)

      const rootDirHandle = await showDirectoryPicker({
        startIn: 'desktop',
      }).catch(() => {
        throw new Error('请选择有效目录')
      })

      if (rootDirHandle.name !== 'DC') {
        throw new Error('请选择名为 DC 的目录')
      }

      setScanningState(true)
      showToast('扫描开始', '正在扫描文件...', 'info')

      const dirs = []
      for await (const entry of rootDirHandle.values()) {
        const regStr = new RegExp(`^${plant}\\d+`)

        if (entry.kind === 'directory' && regStr.test(entry.name)) {
          dirs.push(entry.name)
        }
      }

      const validators = createValidators(
        dirs,
        queryParams.date,
        queryParams.shift,
        queryParams.times,
        _types,
      )

      const out = []
      await traverse(rootDirHandle, 0, validators, '', out)
      setFiles(out)

      showToast('扫描完成', `共找到 ${out.length} 张图片`, 'success')
    } catch (error) {
      setScanError(error.message)
      showToast('扫描失败', error.message, 'error')
      console.error('Scanning error:', error)
    } finally {
      setScanningState(false)
    }
  }, [
    setFiles,
    setScanError,
    setScanningState,
    showToast,
    queryParams.date,
    queryParams.shift,
    queryParams.times,
    _types,
    plant,
  ])

  const handleTargetClick = useCallback(async () => {
    if (!files.length) return

    try {
      setCopyError(null)
      setCopiedCount(0)

      const targetDirHandle = await showDirectoryPicker({
        startIn: 'desktop',
      }).catch(() => {
        throw new Error('请选择有效的目录')
      })

      if (
        (await targetDirHandle.queryPermission({ mode: 'readwrite' })) !==
        'granted'
      ) {
        if (
          (await targetDirHandle.requestPermission({ mode: 'readwrite' })) !==
          'granted'
        ) {
          throw new Error('写入目标目录权限被拒绝')
        }
      }

      showToast('复制开始', '正在复制文件...', 'info')

      setCopyingState(true)

      // Write paths to source.txt
      await writePathsToFile(
        targetDirHandle,
        files.map((file) => file.path),
        'source.txt',
      )

      // for (let i = 0; i < files.length; i++) {
      //   await copyFileToDirectory(files[i].handle, targetDirHandle)
      //   setCopiedCount(i + 1)
      // }
      // 使用批量复制功能
      await copyFilesInBatches(files, targetDirHandle, 10, (progress) => {
        setCopiedCount(progress)
      })

      showToast('复制完成', `已复制 ${files.length} 张图片`, 'success')
    } catch (error) {
      setCopyError(error.message)
      showToast('复制失败', error.message, 'error')
      // console.error('Copy error:', error)
    } finally {
      setCopyingState(false)
    }
  }, [files, setCopyError, setCopiedCount, showToast, setCopyingState])

  return (
    <Container size="2">
      <Card size="4" style={{ marginTop: '2rem' }}>
        <Heading size="6" align="center" mb="6" color="blue">
          图片拷贝
        </Heading>

        <Box mb="6">
          <Flex align="center" gap="4">
            <Text size="3" weight="bold" color="blue">
              厂区选择
            </Text>
            <RadioGroup.Root defaultValue={plant} onValueChange={setPlant}>
              <Flex gap="2">
                <RadioGroup.Item value="A">
                  <Text size="2">东区</Text>
                </RadioGroup.Item>
                <RadioGroup.Item value="B">
                  <Text size="2">西区</Text>
                </RadioGroup.Item>
              </Flex>
            </RadioGroup.Root>
          </Flex>
        </Box>

        <Box mb="6">
          <Flex align="center" gap="4">
            <Text size="3" weight="bold" color="blue">
              类型选择
            </Text>
            <CheckboxGroup.Root
              defaultValue={types}
              name="types"
              onValueChange={setTypes}
            >
              <Flex gap="2">
                <CheckboxGroup.Item value="脏污" disabled>
                  <Text size="2">脏污</Text>
                </CheckboxGroup.Item>
                <CheckboxGroup.Item value="划伤">
                  <Text size="2">划伤</Text>
                </CheckboxGroup.Item>
              </Flex>
            </CheckboxGroup.Root>
          </Flex>
        </Box>

        <Card mb="6">
          <Callout.Root size="1" mb="4">
            <Callout.Text>本次扫描的文件范围</Callout.Text>
          </Callout.Root>

          <DataList.Root>
            <DataList.Item align="center">
              <DataList.Label minWidth="88px">厂区</DataList.Label>
              <DataList.Value>
                <Badge color="jade" variant="soft" radius="full" mr="2">
                  {plant === 'A' ? '东区' : '西区'}
                </Badge>
              </DataList.Value>
            </DataList.Item>
            <DataList.Item align="center">
              <DataList.Label minWidth="88px">日期</DataList.Label>
              <DataList.Value>
                <Badge color="jade" variant="soft" radius="full" mr="2">
                  {queryParams.date}
                </Badge>
              </DataList.Value>
            </DataList.Item>
            <DataList.Item align="center">
              <DataList.Label minWidth="88px">班次</DataList.Label>
              <DataList.Value>
                <Badge color="jade" variant="soft" radius="full" mr="2">
                  {queryParams.shift}
                </Badge>
              </DataList.Value>
            </DataList.Item>
            <DataList.Item align="center">
              <DataList.Label minWidth="88px">时段</DataList.Label>
              <DataList.Value>
                {queryParams.times.map((item) => (
                  <Badge
                    color="jade"
                    variant="soft"
                    radius="full"
                    key={item}
                    mr="2"
                  >
                    {item}
                  </Badge>
                ))}
              </DataList.Value>
            </DataList.Item>
            <DataList.Item align="center">
              <DataList.Label minWidth="88px">类型</DataList.Label>
              <DataList.Value>
                {_types.map((item) => (
                  <Badge
                    color="jade"
                    variant="soft"
                    radius="full"
                    key={item}
                    mr="2"
                  >
                    {item}
                  </Badge>
                ))}
              </DataList.Value>
            </DataList.Item>
          </DataList.Root>
        </Card>

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
              {isScanning ? (
                <>
                  <Spinner /> 扫描中
                </>
              ) : (
                <Text>选择DC目录</Text>
              )}
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
              {isCopying ? (
                <>
                  <Spinner /> 复制中
                </>
              ) : (
                <Text>选择目标目录</Text>
              )}
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
        setOpen={hideToast}
        title={toast.title}
        description={toast.description}
        type={toast.type}
      />
    </Container>
  )
}

export default Home
