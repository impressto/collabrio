// School registration number to name mapping utility

// Get school mappings from environment variables
const getSchoolMappings = () => {
  // Get valid school numbers
  const envNumbers = import.meta.env.VITE_VALID_SCHOOL_NUMBERS || '906484,894362'
  const numbers = envNumbers.split(',').map(num => num.trim())
  
  // Get school names (if provided)
  const envNames = import.meta.env.VITE_SCHOOL_NAMES || 'Earl of March,Bell High School'
  const names = envNames.split(',').map(name => name.trim())
  
  // Create mapping object
  const mappings = {}
  numbers.forEach((number, index) => {
    mappings[number] = names[index] || `School ${number}`
  })
  
  return mappings
}

// Get array of valid school numbers
export const getValidSchoolNumbers = () => {
  const envNumbers = import.meta.env.VITE_VALID_SCHOOL_NUMBERS || '906484,894362'
  return envNumbers.split(',').map(num => num.trim())
}

// Get school name for a given registration number
export const getSchoolName = (schoolNumber) => {
  const mappings = getSchoolMappings()
  return mappings[schoolNumber] || `School ${schoolNumber}`
}

// Get all school mappings as array of objects
export const getAllSchools = () => {
  const numbers = getValidSchoolNumbers()
  return numbers.map(number => ({
    number: number,
    name: getSchoolName(number)
  }))
}

// Validate if a school number is valid
export const isValidSchoolNumber = (schoolNumber) => {
  const validNumbers = getValidSchoolNumbers()
  return validNumbers.includes(schoolNumber.trim())
}

export default {
  getValidSchoolNumbers,
  getSchoolName,
  getAllSchools,
  isValidSchoolNumber
}