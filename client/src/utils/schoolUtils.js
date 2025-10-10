// School registration number to name mapping utility

// Get school mappings from environment variables
const getSchoolMappings = () => {
  // Get school names mapping (format: number1:Name 1,number2:Name 2)
  const envNames = import.meta.env.VITE_SCHOOL_NAMES || '906484:Earl of March Secondary School,894362:Bell High School'
  
  // Create mapping object
  const mappings = {}
  
  envNames.split(',').forEach(pair => {
    const [number, name] = pair.split(':').map(s => s.trim())
    if (number && name) {
      mappings[number] = name
    }
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