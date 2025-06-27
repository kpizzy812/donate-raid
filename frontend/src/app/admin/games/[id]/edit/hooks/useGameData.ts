// frontend/src/app/admin/games/[id]/edit/hooks/useGameData.ts
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export interface Subcategory {
  id?: number
  name: string
  description: string
  sort_order: number
  enabled: boolean
}

export interface InputField {
  id?: number
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea'
  required: boolean
  placeholder?: string
  help_text?: string
  options?: string[]
  validation_regex?: string
  min_length?: number
  max_length?: number
  subcategory_id?: number | null
}

export interface GameData {
  name: string
  description: string
  instructions: string
  faq: string
  subcategoryDescription: string
  autoSupport: boolean
  enabled: boolean
  sortOrder: number
  bannerUrl: string
  logoUrl: string
  subcategories: Subcategory[]
  inputFields: InputField[]
}

export function useGameData(id: string | undefined) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [gameData, setGameData] = useState<GameData>({
    name: '',
    description: '',
    instructions: '',
    faq: '',
    subcategoryDescription: '',
    autoSupport: true,
    enabled: true,
    sortOrder: 0,
    bannerUrl: '',
    logoUrl: '',
    subcategories: [],
    inputFields: []
  })

  // Загрузка данных игры
  useEffect(() => {
    if (!id) return
    loadGameData()
  }, [id])

  const loadGameData = async () => {
    try {
      console.log('🎮 Загрузка данных игры ID:', id)
      const response = await api.get(`/admin/games/${id}`)
      const data = response.data
      console.log('🎮 Данные игры получены:', data)
      console.log('🏷️ Подкатегории в ответе:', data.subcategories)
      console.log('📝 Поля ввода в ответе:', data.input_fields)

      setGameData({
        name: data.name || '',
        description: data.description || '',
        instructions: data.instructions || '',
        faq: data.faq_content || '',
        subcategoryDescription: data.subcategory_description || '',
        autoSupport: data.auto_support ?? true,
        enabled: data.enabled ?? true,
        sortOrder: data.sort_order || 0,
        bannerUrl: data.banner_url || '',
        logoUrl: data.logo_url || '',
        subcategories: data.subcategories?.map((sub: any) => {
          console.log('🏷️ Маппинг подкатегории:', sub)
          return {
            id: sub.id,
            name: sub.name,
            description: sub.description || '',
            sort_order: sub.sort_order,
            enabled: sub.enabled
          }
        }) || [],
        inputFields: data.input_fields?.map((field: any) => {
          console.log('📝 Маппинг поля ввода:', field)
          return {
            id: field.id,
            name: field.name,
            label: field.label,
            type: field.field_type || field.type || 'text',
            required: field.required,
            placeholder: field.placeholder || '',
            help_text: field.help_text || '',
            options: field.options || [],
            validation_regex: field.validation_regex || '',
            min_length: field.min_length,
            max_length: field.max_length,
            subcategory_id: field.subcategory_id
          }
        }) || []
      })

      console.log('🎮 Загружено подкатегорий:', data.subcategories?.length || 0)
      console.log('🎮 Загружено полей ввода:', data.input_fields?.length || 0)

    } catch (error: any) {
      console.error('❌ Ошибка загрузки игры:', error)
      alert(`Ошибка загрузки игры: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const updateGameData = (updates: Partial<GameData>) => {
    setGameData(prev => ({ ...prev, ...updates }))
  }

  const saveGame = async (): Promise<boolean> => {
    if (!gameData.name.trim()) {
      alert('Введите название игры')
      return false
    }

    setSaving(true)

    try {
      console.log('🎮 Начинаем обновление игры...')
      const token = localStorage.getItem('access_token')

      // ШАГ 1: Обновляем подкатегории
      console.log('🏷️ Обновляем подкатегории...')
      const subcategoryIdMapping = await updateSubcategories(token!)

      // ШАГ 2: Подготавливаем поля ввода
      const mappedInputFields = mapInputFields(subcategoryIdMapping)

      // ШАГ 3: Обновляем игру
      await updateGame(token!, mappedInputFields)

      console.log('✅ Игра полностью обновлена')
      alert('✅ Игра успешно обновлена!')
      return true

    } catch (error: any) {
      console.error('❌ Ошибка обновления игры:', error)
      alert(`❌ Ошибка обновления игры: ${error.message}`)
      return false
    } finally {
      setSaving(false)
    }
  }

  const updateSubcategories = async (token: string): Promise<{ [index: number]: number }> => {
    // Получаем текущие подкатегории
    const currentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/subcategories/game/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    let subcategoryIdMapping: { [index: number]: number } = {}

    if (currentResponse.ok) {
      const currentSubcategories = await currentResponse.json()
      const currentIds = currentSubcategories.map((sub: any) => sub.id)
      const newIds = gameData.subcategories.filter(sub => sub.id).map(sub => sub.id)
      const toDelete = currentIds.filter((subId: number) => !newIds.includes(subId))

      // Удаляем лишние подкатегории
      for (const deleteId of toDelete) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/subcategories/${deleteId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          })
          console.log(`🗑️ Удалена подкатегория ${deleteId}`)
        } catch (error) {
          console.error(`❌ Ошибка удаления подкатегории ${deleteId}:`, error)
        }
      }
    }

    // Обновляем/создаем подкатегории
    for (let i = 0; i < gameData.subcategories.length; i++) {
      const subcategory = gameData.subcategories[i]
      if (!subcategory.name.trim()) continue

      const subcategoryData = {
        name: subcategory.name.trim(),
        description: subcategory.description.trim() || null,
        sort_order: subcategory.sort_order,
        enabled: subcategory.enabled
      }

      try {
        if (subcategory.id) {
          // Обновляем существующую
          const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/subcategories/${subcategory.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(subcategoryData)
          })
          if (updateResponse.ok) {
            subcategoryIdMapping[i] = subcategory.id
          }
        } else {
          // Создаем новую
          const createResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/subcategories/game/${id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(subcategoryData)
          })
          if (createResponse.ok) {
            const created = await createResponse.json()
            subcategoryIdMapping[i] = created.id
          }
        }
      } catch (error) {
        console.error('❌ Ошибка обработки подкатегории:', error)
      }
    }

    return subcategoryIdMapping
  }

  const mapInputFields = (subcategoryIdMapping: { [index: number]: number }) => {
    return gameData.inputFields.map(field => {
      let mappedSubcategoryId = field.subcategory_id

      if (field.subcategory_id !== null && field.subcategory_id !== undefined) {
        const subcategoryIndex = gameData.subcategories.findIndex(sub => sub.id === field.subcategory_id)
        if (subcategoryIndex !== -1 && subcategoryIdMapping[subcategoryIndex]) {
          mappedSubcategoryId = subcategoryIdMapping[subcategoryIndex]
        } else if (field.subcategory_id < 0) {
          const index = Math.abs(field.subcategory_id) - 1
          mappedSubcategoryId = subcategoryIdMapping[index] || null
        }
      }

      return {
        name: field.name,
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder || null,
        help_text: field.help_text || null,
        options: field.options && field.options.length > 0 ? field.options : null,
        validation_regex: field.validation_regex || null,
        min_length: field.min_length || null,
        max_length: field.max_length || null,
        subcategory_id: mappedSubcategoryId
      }
    })
  }

  const updateGame = async (token: string, mappedInputFields: any[]) => {
    const requestData = {
      name: gameData.name.trim(),
      description: gameData.description.trim() || null,
      instructions: gameData.instructions.trim() || null,
      faq_content: gameData.faq.trim() || null,
      banner_url: gameData.bannerUrl || null,
      logo_url: gameData.logoUrl || null,
      subcategory_description: gameData.subcategoryDescription.trim() || null,
      auto_support: gameData.autoSupport,
      enabled: gameData.enabled,
      sort_order: gameData.sortOrder,
      input_fields: mappedInputFields
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/games/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Ошибка обновления игры')
    }
  }

  // ======== НОВЫЕ ФУНКЦИИ УПРАВЛЕНИЯ ИНТЕРФЕЙСОМ ========

  // Функции управления подкатегориями
  const addSubcategory = () => {
    setGameData(prev => ({
      ...prev,
      subcategories: [...prev.subcategories, {
        name: '',
        description: '',
        sort_order: prev.subcategories.length,
        enabled: true
      }]
    }))
  }

  const removeSubcategory = (index: number) => {
    setGameData(prev => ({
      ...prev,
      subcategories: prev.subcategories.filter((_, i) => i !== index)
    }))
  }

  const updateSubcategory = (index: number, field: keyof Subcategory, value: any) => {
    setGameData(prev => {
      const updated = [...prev.subcategories]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, subcategories: updated }
    })
  }

  // Функции управления полями ввода
  const addInputField = () => {
    setGameData(prev => ({
      ...prev,
      inputFields: [...prev.inputFields, {
        name: '',
        label: '',
        type: 'text',
        required: true,
        placeholder: '',
        help_text: ''
      }]
    }))
  }

  const removeInputField = (index: number) => {
    setGameData(prev => ({
      ...prev,
      inputFields: prev.inputFields.filter((_, i) => i !== index)
    }))
  }

  const updateInputField = (index: number, field: keyof InputField, value: any) => {
    setGameData(prev => {
      const updated = [...prev.inputFields]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, inputFields: updated }
    })
  }

  return {
    loading,
    saving,
    gameData,
    updateGameData,
    saveGame,
    // Функции управления подкатегориями
    addSubcategory,
    removeSubcategory,
    updateSubcategory,
    // Функции управления полями ввода
    addInputField,
    removeInputField,
    updateInputField
  }
}