export const allProgramElectives = [
  'Agent Based Modelling & Simulations',
  'Cloud Computing',
  'Compiler Design',
  'Computer Graphics and Multimedia',
  'Computer Vision',
  'Data Mining',
  'Distributed Computing',
  'High-Performance Computing',
  'Information Retrieval',
  'Introduction to Cyber Security',
  'Machine Learning',
  'Natural Language Processing',
  'Principles of Cyber Physical System Computation',
  'Soft Computing and Evolutionary AI',
];

export const allInstituteElectives = [
  'Applied Stochastic Models',
  'Brain Computer Interaction',
  'Cryptography',
  'Digital Image Processing',
  'Introduction to Data Analytics',
];

export const allSeedCourses = [
  'Energy and Environment',
  'Ethics in Everyday Life',
  'Skills for Employability',
  'Quantitative and Reasoning Aptitude',
  'Personal Growth Programme',
  'Macro-economics and Personal Finance',
  'IT Project Management',
  'Innovation and Entrepreneurship',
  'Climate Change and its Implications',
  'ICT for Development',
  'Startup 101',
  'Organizational Behavior',
];

export const futureSemesters = {
  4: {
    label: 'Semester 4',
    date: 'Spring 2026 – Summer 2026',
    limits: null,
    courses: [
      { name: 'Computer Communication Networks (CCN)', credits: 4, prereq: 'None', type: 'core', warning: null },
      { name: 'Artificial Intelligence (AI)', credits: 4, prereq: 'None', type: 'core', warning: null },
      { name: 'Theory of Computation (TOC)', credits: 4, prereq: 'OS', type: 'core', warning: null },
      { name: 'Full Stack Dev (FFSD)', credits: 4, prereq: 'None', type: 'core', warning: null },
      { name: 'Advanced Communication Skills (ACS)', credits: 2, prereq: 'EE, OPC, PC', type: 'core', warning: null },
      { name: 'Logical Reasoning (LR)', credits: 2, prereq: 'None', type: 'core', warning: null },
      { name: 'Deep Learning (DL)', credits: 4, prereq: 'ML', type: 'core', warning: 'Prerequisite ML not met.' },
    ],
  },
  5: {
    label: 'Semester 5',
    date: 'Fall 2026 – Winter 2027',
    limits: { PE: 4, IE: 0, SEED: 2 },
    courses: [
      { name: 'Framework Driven Front-End Development (FDFED)', credits: 4, prereq: 'None', type: 'core', warning: null },
    ],
  },
  6: {
    label: 'Semester 6',
    date: 'Spring 2027 – Summer 2027',
    limits: { PE: 3, IE: 1, SEED: 1 },
    courses: [
      { name: 'Web Services and Backend Development (WBD)', credits: 4, prereq: 'None', type: 'core', warning: null },
    ],
  },
  7: {
    label: 'Semester 7',
    date: 'Fall 2027 – Winter 2028',
    limits: { PE: 1, IE: 1, SEED: 1 },
    courses: [],
  },
  8: {
    label: 'Semester 8',
    date: 'Spring 2028 – Summer 2028',
    limits: { PE: 1, IE: 1, SEED: 1 },
    courses: [],
  },
};

export const semSequence = {
  5: [5],
  6: [5, 6],
  7: [5, 6, 7],
  8: [5, 6, 7, 8],
};

export const fallbackSemHistory = {
  1: {
    title: 'Semester 1',
    date: 'Aug 2024 – Dec 2024',
    isCurrent: false,
    coursesSummary: 'CP, DLD, OCW, DSMA, EE, FHVE',
    courses: [
      { name: 'Computer Programming', credits: 4 },
      { name: 'Digital Logic Design', credits: 4 },
      { name: 'Overview of Computer Workshop', credits: 4 },
      { name: 'Discrete Structures', credits: 4 },
      { name: 'Essential English', credits: 2 },
      { name: 'Human Values and Ethics', credits: 2 },
    ],
    totalCredits: 20,
  },
  2: {
    title: 'Semester 2',
    date: 'Jan 2025 – May 2025',
    isCurrent: false,
    coursesSummary: 'DSA, CA, SS, PS, OPC, EEN',
    courses: [
      { name: 'Data Structures & Algorithms', credits: 4 },
      { name: 'Computer Architecture', credits: 4 },
      { name: 'Signals & Systems', credits: 4 },
      { name: 'Probability & Statistics', credits: 4 },
      { name: 'Operational Communication', credits: 2 },
      { name: 'Energy & Environment', credits: 2 },
    ],
    totalCredits: 20,
  },
  3: {
    title: 'Semester 3',
    date: 'Aug 2025 – Dec 2025',
    isCurrent: false,
    coursesSummary: 'ADSA, RANAC, OS, OOP, DBMS, PC',
    courses: [
      { name: 'Advanced Data Structures & Algorithms', credits: 4 },
      { name: 'Operating Systems', credits: 4 },
      { name: 'Database Management Systems', credits: 4 },
      { name: 'Object Oriented Programming', credits: 4 },
      { name: 'Analysis and Calculus', credits: 4 },
      { name: 'Professional Communication', credits: 2 },
    ],
    totalCredits: 22,
  },
};
