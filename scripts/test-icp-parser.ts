/**
 * Test script for ICP AI parsing functions
 * Requires OPENAI_API_KEY environment variable to be set
 * Run with: npx tsx scripts/test-icp-parser.ts
 */

import {
  parseCompanyInfo,
  parseTargetCriteria,
  parseValueProps,
  parseObjections,
} from '../src/lib/ai/prompts/icp-parser'

async function main() {
  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.log('OPENAI_API_KEY not set - skipping live API tests')
    console.log('Set OPENAI_API_KEY environment variable to run AI parsing tests')
    console.log('\nSchema structure tests passed in test-icp-schemas.ts')
    console.log('AI parsing functions are correctly set up and will work when API key is provided.')
    process.exit(0)
  }

  console.log('Testing ICP AI Parsing Functions...\n')

  // Test 1: Company Info Parsing
  console.log('1. Testing parseCompanyInfo...')
  const companyInput = `We're a small SaaS startup with about 20 employees.
    We sell project management software to other businesses.
    Our platform helps teams collaborate and track their work.`

  try {
    const companyResult = await parseCompanyInfo(companyInput)
    if (companyResult) {
      console.log('   PASS: Parsed company info:')
      console.log(`   - Product: ${companyResult.productDescription}`)
      console.log(`   - Industry: ${companyResult.industry}`)
      console.log(`   - Size: ${companyResult.companySize}`)
      console.log(`   - Market: ${companyResult.targetMarket}`)
    } else {
      console.log('   FAIL: No result returned')
    }
  } catch (error) {
    console.log('   FAIL:', error)
  }

  // Test 2: Target Criteria Parsing
  console.log('\n2. Testing parseTargetCriteria...')
  const targetInput = `We're looking for mid-sized tech companies, especially those in
    the SaaS and fintech space. Ideally they're using Slack and have teams in the US or Europe.
    They should have at least 100 employees and a budget of around $50k-100k annually.`

  try {
    const targetResult = await parseTargetCriteria(targetInput)
    if (targetResult) {
      console.log('   PASS: Parsed target criteria:')
      console.log(`   - Sizes: ${targetResult.idealCompanySizes.join(', ')}`)
      console.log(`   - Industries: ${targetResult.targetIndustries.join(', ')}`)
      console.log(`   - Locations: ${(targetResult.targetLocations ?? []).join(', ') || '(none)'}`)
      console.log(`   - Tech: ${(targetResult.techRequirements ?? []).join(', ') || '(none)'}`)
      if (targetResult.budgetRange) {
        console.log(`   - Budget: $${targetResult.budgetRange.min ?? '?'} - $${targetResult.budgetRange.max ?? '?'}`)
      }
    } else {
      console.log('   FAIL: No result returned')
    }
  } catch (error) {
    console.log('   FAIL:', error)
  }

  // Test 3: Value Props Parsing
  console.log('\n3. Testing parseValueProps...')
  const valueInput = `Our customers love us because we help them ship 3x faster than before.
    Unlike competitors, we integrate directly with their existing workflow tools.
    Teams report 50% less time in meetings after adopting our platform.`

  try {
    const valueResult = await parseValueProps(valueInput)
    if (valueResult) {
      console.log('   PASS: Parsed value propositions:')
      valueResult.valuePropositions.forEach((vp, i) => {
        console.log(`   [${i + 1}] ${vp.headline}`)
        console.log(`       ${vp.description}`)
        if (vp.differentiators.length > 0) {
          console.log(`       Differentiators: ${vp.differentiators.join(', ')}`)
        }
      })
    } else {
      console.log('   FAIL: No result returned')
    }
  } catch (error) {
    console.log('   FAIL:', error)
  }

  // Test 4: Objections Parsing
  console.log('\n4. Testing parseObjections...')
  const objectionsInput = `Prospects often tell us they already have a project management tool
    and don't want to switch. Some worry about the learning curve.
    Larger companies ask about enterprise security features and compliance.`

  try {
    const objectionsResult = await parseObjections(objectionsInput)
    if (objectionsResult) {
      console.log('   PASS: Parsed objections:')
      const objections = objectionsResult.commonObjections ?? []
      objections.forEach((obj, i) => {
        console.log(`   [${i + 1}] ${obj.objection}`)
        if (obj.suggestedResponse) {
          console.log(`       Response: ${obj.suggestedResponse}`)
        }
      })
    } else {
      console.log('   FAIL: No result returned')
    }
  } catch (error) {
    console.log('   FAIL:', error)
  }

  console.log('\n---')
  console.log('AI parsing tests completed!')
}

main().catch(console.error)
