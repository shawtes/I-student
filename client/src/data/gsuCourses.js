// Common Georgia State University undergraduate course catalog.
// Grouped by department so the UI can show them in an optgroup or filter list.
// Not exhaustive - covers the ones students most commonly look for tutoring on.

export const GSU_COURSES = [
  // Math
  { code: 'MATH 1111', name: 'College Algebra', dept: 'Math' },
  { code: 'MATH 1113', name: 'Precalculus', dept: 'Math' },
  { code: 'MATH 1220', name: 'Survey of Calculus', dept: 'Math' },
  { code: 'MATH 2211', name: 'Calculus I', dept: 'Math' },
  { code: 'MATH 2212', name: 'Calculus II', dept: 'Math' },
  { code: 'MATH 2215', name: 'Calculus III', dept: 'Math' },
  { code: 'MATH 2420', name: 'Discrete Mathematics', dept: 'Math' },
  { code: 'MATH 2641', name: 'Linear Algebra', dept: 'Math' },
  { code: 'MATH 3030', name: 'Math of Money', dept: 'Math' },
  { code: 'STAT 1101', name: 'Intro to Statistics', dept: 'Math' },

  // Computer Science
  { code: 'CSC 1301', name: 'Principles of CS I', dept: 'Computer Science' },
  { code: 'CSC 1302', name: 'Principles of CS II', dept: 'Computer Science' },
  { code: 'CSC 2720', name: 'Data Structures', dept: 'Computer Science' },
  { code: 'CSC 3320', name: 'System-Level Programming', dept: 'Computer Science' },
  { code: 'CSC 3410', name: 'Data Structures & Algorithms', dept: 'Computer Science' },
  { code: 'CSC 4320', name: 'Operating Systems', dept: 'Computer Science' },
  { code: 'CSC 4350', name: 'Software Engineering', dept: 'Computer Science' },
  { code: 'CSC 4520', name: 'Design & Analysis of Algorithms', dept: 'Computer Science' },
  { code: 'CSC 4710', name: 'Database Systems', dept: 'Computer Science' },
  { code: 'CSC 4760', name: 'Big Data Programming', dept: 'Computer Science' },

  // Biology
  { code: 'BIOL 1103', name: 'Introductory Biology I', dept: 'Biology' },
  { code: 'BIOL 1104', name: 'Introductory Biology II', dept: 'Biology' },
  { code: 'BIOL 2107', name: 'Biology of the Cell', dept: 'Biology' },
  { code: 'BIOL 2108', name: 'Biology of Organisms', dept: 'Biology' },
  { code: 'BIOL 3800', name: 'Genetics', dept: 'Biology' },

  // Chemistry
  { code: 'CHEM 1151', name: 'Survey of Chemistry I', dept: 'Chemistry' },
  { code: 'CHEM 1211', name: 'Principles of Chemistry I', dept: 'Chemistry' },
  { code: 'CHEM 1212', name: 'Principles of Chemistry II', dept: 'Chemistry' },
  { code: 'CHEM 3410', name: 'Organic Chemistry I', dept: 'Chemistry' },
  { code: 'CHEM 3420', name: 'Organic Chemistry II', dept: 'Chemistry' },

  // Physics
  { code: 'PHYS 1111', name: 'Introductory Physics I', dept: 'Physics' },
  { code: 'PHYS 1112', name: 'Introductory Physics II', dept: 'Physics' },
  { code: 'PHYS 2211', name: 'Principles of Physics I', dept: 'Physics' },
  { code: 'PHYS 2212', name: 'Principles of Physics II', dept: 'Physics' },

  // English
  { code: 'ENGL 1101', name: 'English Composition I', dept: 'English' },
  { code: 'ENGL 1102', name: 'English Composition II', dept: 'English' },
  { code: 'ENGL 2110', name: 'World Literature', dept: 'English' },

  // Social Sciences
  { code: 'HIST 2110', name: 'Survey of US History', dept: 'Social Sciences' },
  { code: 'POLS 1101', name: 'American Government', dept: 'Social Sciences' },
  { code: 'PSYC 1101', name: 'Intro to Psychology', dept: 'Social Sciences' },
  { code: 'SOCI 1101', name: 'Intro to Sociology', dept: 'Social Sciences' },

  // Business
  { code: 'ACCT 2101', name: 'Principles of Accounting I', dept: 'Business' },
  { code: 'ACCT 2102', name: 'Principles of Accounting II', dept: 'Business' },
  { code: 'ECON 2105', name: 'Principles of Macroeconomics', dept: 'Business' },
  { code: 'ECON 2106', name: 'Principles of Microeconomics', dept: 'Business' },
  { code: 'BUSA 2106', name: 'Legal Environment of Business', dept: 'Business' },
  { code: 'FI 3300', name: 'Corporation Finance', dept: 'Business' },
  { code: 'MGS 3100', name: 'Managerial Decision Analysis', dept: 'Business' },
  { code: 'MK 3010', name: 'Basic Marketing', dept: 'Business' },

  // Languages
  { code: 'SPAN 1001', name: 'Elementary Spanish I', dept: 'Languages' },
  { code: 'SPAN 1002', name: 'Elementary Spanish II', dept: 'Languages' },
  { code: 'FREN 1001', name: 'Elementary French I', dept: 'Languages' },
];

export function byDept() {
  const groups = {};
  for (const c of GSU_COURSES) {
    if (!groups[c.dept]) groups[c.dept] = [];
    groups[c.dept].push(c);
  }
  return groups;
}

export function findByCode(code) {
  return GSU_COURSES.find(c => c.code === code);
}
