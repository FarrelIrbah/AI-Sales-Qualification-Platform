'use server'

import { createClient } from '@/lib/supabase/server'
import {
  parseCompanyInfo,
  parseTargetCriteria,
  parseValueProps,
  parseObjections,
} from '@/lib/ai/prompts/icp-parser'
import type {
  CompanyInfoInput,
  TargetCriteriaInput,
  ValuePropsInput,
  ObjectionsInput,
} from '@/lib/validations/icp'

/**
 * Parse company info from natural language using AI
 */
export async function parseCompanyInfoAction(
  input: string
): Promise<CompanyInfoInput | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const result = await parseCompanyInfo(input)
    return result
  } catch (error) {
    console.error('parseCompanyInfoAction error:', error)
    return null
  }
}

/**
 * Parse target criteria from natural language using AI
 */
export async function parseTargetCriteriaAction(
  input: string
): Promise<TargetCriteriaInput | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const result = await parseTargetCriteria(input)
    return result
  } catch (error) {
    console.error('parseTargetCriteriaAction error:', error)
    return null
  }
}

/**
 * Parse value propositions from natural language using AI
 */
export async function parseValuePropsAction(
  input: string
): Promise<ValuePropsInput | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const result = await parseValueProps(input)
    return result
  } catch (error) {
    console.error('parseValuePropsAction error:', error)
    return null
  }
}

/**
 * Parse objections from natural language using AI
 */
export async function parseObjectionsAction(
  input: string
): Promise<ObjectionsInput | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const result = await parseObjections(input)
    return result
  } catch (error) {
    console.error('parseObjectionsAction error:', error)
    return null
  }
}
