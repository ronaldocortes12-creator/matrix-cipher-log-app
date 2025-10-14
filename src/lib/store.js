import { create } from 'zustand'
import { supabase } from './supabase'

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,
  
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({ session, user: session?.user ?? null, loading: false })
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null })
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ loading: false })
    }
  },
  
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  }
}))

export const useProgressStore = create((set) => ({
  lessons: [],
  modules: [],
  loading: true,
  
  setLessons: (lessons) => set({ lessons }),
  setModules: (modules) => set({ modules }),
  setLoading: (loading) => set({ loading }),
  
  loadProgress: async (userId) => {
    if (!userId) return
    
    try {
      const { data: progress, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .order('lesson_day', { ascending: true })
      
      if (error) throw error
      
      set({ lessons: progress || [], loading: false })
    } catch (error) {
      console.error('Error loading progress:', error)
      set({ loading: false })
    }
  },
  
  updateLessonProgress: async (userId, lessonDay) => {
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: userId,
          lesson_day: lessonDay,
          completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_day'
        })
        .select()
      
      if (error) throw error
      
      // Reload progress after update
      await useProgressStore.getState().loadProgress(userId)
      
      return data
    } catch (error) {
      console.error('Error updating lesson progress:', error)
      throw error
    }
  }
}))

export const useChatStore = create((set) => ({
  messages: [],
  loading: true,
  
  setMessages: (messages) => set({ messages }),
  setLoading: (loading) => set({ loading }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  loadMessages: async (userId) => {
    if (!userId) return
    
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      set({ messages: messages || [], loading: false })
    } catch (error) {
      console.error('Error loading messages:', error)
      set({ loading: false })
    }
  },
  
  saveMessage: async (userId, role, content) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          role,
          content
        })
        .select()
      
      if (error) throw error
      
      return data[0]
    } catch (error) {
      console.error('Error saving message:', error)
      throw error
    }
  }
}))

