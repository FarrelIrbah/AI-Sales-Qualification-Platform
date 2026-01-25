/**
 * Test script to verify ICP Zod schemas work correctly
 * Run with: npx tsx scripts/test-icp-schemas.ts
 */

import {
  companyInfoSchema,
  targetCriteriaSchema,
  valuePropsSchema,
  objectionsSchema,
  fullIcpSchema,
} from '../src/lib/validations/icp'

// Test data
const validCompanyInfo = {
  productDescription: 'We provide AI-powered sales qualification tools for B2B companies',
  industry: 'SaaS',
  companySize: 'small' as const,
  targetMarket: 'b2b' as const,
}

const validTargetCriteria = {
  idealCompanySizes: ['medium', 'large', 'enterprise'],
  targetIndustries: ['SaaS', 'Technology', 'Finance'],
  targetLocations: ['United States', 'Canada', 'United Kingdom'],
  techRequirements: ['Salesforce', 'HubSpot'],
  budgetRange: { min: 5000, max: 50000 },
}

const validValueProps = {
  valuePropositions: [
    {
      headline: 'Qualify leads 10x faster',
      description: 'Our AI analyzes company data and provides instant qualification scores with actionable insights',
      differentiators: ['Real-time analysis', 'ICP-personalized recommendations'],
    },
  ],
}

const validObjections = {
  commonObjections: [
    {
      objection: 'We already have a lead scoring system in place',
      suggestedResponse: 'Our system provides personalized insights based on YOUR specific ICP, not generic scoring',
    },
  ],
}

// Run tests
console.log('Testing ICP Schemas...\n')

// Test 1: Company Info
console.log('1. Testing companyInfoSchema...')
const companyResult = companyInfoSchema.safeParse(validCompanyInfo)
if (companyResult.success) {
  console.log('   PASS: Valid company info accepted')
} else {
  console.log('   FAIL:', companyResult.error.issues)
}

// Test 1b: Invalid company info
const invalidCompanyResult = companyInfoSchema.safeParse({ productDescription: 'short' })
if (!invalidCompanyResult.success) {
  console.log('   PASS: Invalid company info rejected')
} else {
  console.log('   FAIL: Should have rejected invalid company info')
}

// Test 2: Target Criteria
console.log('\n2. Testing targetCriteriaSchema...')
const targetResult = targetCriteriaSchema.safeParse(validTargetCriteria)
if (targetResult.success) {
  console.log('   PASS: Valid target criteria accepted')
} else {
  console.log('   FAIL:', targetResult.error.issues)
}

// Test 2b: With defaults
const minimalTarget = targetCriteriaSchema.safeParse({
  idealCompanySizes: ['enterprise'],
  targetIndustries: ['Healthcare'],
})
if (minimalTarget.success && minimalTarget.data.targetLocations.length === 0) {
  console.log('   PASS: Default empty arrays applied')
} else {
  console.log('   FAIL: Defaults not applied correctly')
}

// Test 3: Value Props
console.log('\n3. Testing valuePropsSchema...')
const valueResult = valuePropsSchema.safeParse(validValueProps)
if (valueResult.success) {
  console.log('   PASS: Valid value props accepted')
} else {
  console.log('   FAIL:', valueResult.error.issues)
}

// Test 4: Objections
console.log('\n4. Testing objectionsSchema...')
const objectionsResult = objectionsSchema.safeParse(validObjections)
if (objectionsResult.success) {
  console.log('   PASS: Valid objections accepted')
} else {
  console.log('   FAIL:', objectionsResult.error.issues)
}

// Test 4b: Empty objections (should pass - objections are optional)
const emptyObjections = objectionsSchema.safeParse({})
if (emptyObjections.success) {
  console.log('   PASS: Empty objections accepted (optional)')
} else {
  console.log('   FAIL: Empty objections should be valid')
}

// Test 5: Full ICP Schema
console.log('\n5. Testing fullIcpSchema...')
const fullIcp = {
  ...validCompanyInfo,
  ...validTargetCriteria,
  ...validValueProps,
  ...validObjections,
}
const fullResult = fullIcpSchema.safeParse(fullIcp)
if (fullResult.success) {
  console.log('   PASS: Full ICP schema validated')
} else {
  console.log('   FAIL:', fullResult.error.issues)
}

console.log('\n---')
console.log('All schema tests completed!')
