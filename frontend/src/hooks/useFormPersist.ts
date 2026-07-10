import { useEffect, useRef } from 'react'
import type { FieldValues, UseFormSetValue } from 'react-hook-form'
import { useDebounce } from './useDebounce'
import { getStorageItem, setStorageItem } from '../utils/storage'

/**
 * 表单防抖持久化 Hook
 *
 * 功能 A（初始化回填）：组件挂载时从 localStorage 读取草稿，调用 setValue 回填表单。
 * 功能 B（防抖写入）：监听 watch() 数据变化，延迟 500ms 后写入 localStorage，
 *   避免每次按键都触发写操作。
 *
 * @param watchedValues - react-hook-form 的 watch() 返回值（整个表单数据）
 * @param setValue - react-hook-form 的 setValue 函数
 * @param storageKey - localStorage 存储键名（使用 STORAGE_KEYS.FORM_DRAFT）
 *
 * @example
 * const { watch, setValue } = useForm<ResumeFormValues>()
 * const watchedValues = watch()
 * useFormPersist(watchedValues, setValue, STORAGE_KEYS.FORM_DRAFT)
 */
export function useFormPersist<T extends FieldValues>(
  watchedValues: T,
  setValue: UseFormSetValue<T>,
  storageKey: string,
): void {
  /** 标记是否已经从 localStorage 回填过，防止回填触发写回 */
  const hasHydrated = useRef(false)

  // ─── 功能 A：初始化回填 ───
  useEffect(() => {
    if (hasHydrated.current) return

    const saved = getStorageItem<T>(storageKey)
    if (saved) {
      // 逐字段回填，避免覆盖默认值中不存在的字段
      const keys = Object.keys(saved) as Array<keyof T>
      for (const key of keys) {
        if (saved[key] !== undefined) {
          setValue(key, saved[key], { shouldDirty: false, shouldTouch: false })
        }
      }
    }

    hasHydrated.current = true
  }, [storageKey, setValue])

  // ─── 功能 B：防抖写入 ───
  const debouncedValues = useDebounce(watchedValues, 500)

  useEffect(() => {
    // 首次回填阶段不写入，避免用默认空值覆盖已有草稿
    if (!hasHydrated.current) return

    setStorageItem(storageKey, debouncedValues)
  }, [debouncedValues, storageKey])
}
