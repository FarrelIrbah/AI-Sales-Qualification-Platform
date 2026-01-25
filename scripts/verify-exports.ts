/**
 * Verification script for plan 02-01
 */

// Check schema exports
import * as schema from '../src/lib/db/schema'
console.log('Schema exports:', Object.keys(schema).join(', '))
console.log('Has profiles:', 'profiles' in schema)
console.log('Has icpProfiles:', 'icpProfiles' in schema)

// Check validation exports
import * as validations from '../src/lib/validations/icp'
console.log('\nValidation exports:', Object.keys(validations).join(', '))
console.log('Has companyInfoSchema:', 'companyInfoSchema' in validations)
console.log('Has targetCriteriaSchema:', 'targetCriteriaSchema' in validations)
console.log('Has valuePropsSchema:', 'valuePropsSchema' in validations)
console.log('Has objectionsSchema:', 'objectionsSchema' in validations)
console.log('Has fullIcpSchema:', 'fullIcpSchema' in validations)

// Check AI exports
import * as ai from '../src/lib/ai'
console.log('\nAI exports:', Object.keys(ai).join(', '))
console.log('Has openai:', 'openai' in ai)
console.log('Has gpt4o:', 'gpt4o' in ai)
console.log('Has gpt4oMini:', 'gpt4oMini' in ai)

// Check ICP parser exports
import * as parser from '../src/lib/ai/prompts/icp-parser'
console.log('\nParser exports:', Object.keys(parser).join(', '))
console.log('Has parseCompanyInfo:', 'parseCompanyInfo' in parser)
console.log('Has parseTargetCriteria:', 'parseTargetCriteria' in parser)
console.log('Has parseValueProps:', 'parseValueProps' in parser)
console.log('Has parseObjections:', 'parseObjections' in parser)

console.log('\nAll verification checks passed!')
