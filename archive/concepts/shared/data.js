/* Shared content layer: every concept renders this same data so only the DESIGN changes.
   Source of truth for wording = the CKF mission / vision / tagline supplied by the client.
   Anything marked sample:true is placeholder content for layout only and must be replaced. */
window.CKF = {
  name: 'CKF Foundation',
  fullName: 'The Obi (Prof.) Chukuka Okonjo and Prof. Kamene Okonjo Foundation',
  short: 'CKF',
  place: 'Ogwashi-Ukwu, Delta State, Nigeria',
  tagline: 'Education. Health. Opportunity. A legacy that lives on.',
  taglineWords: ['Education', 'Health', 'Opportunity'],
  mission: "The Obi (Prof.) Chukuka Okonjo and Prof. Kamene Okonjo Foundation (CKF) honors our parents' lifelong commitment to education, service, and community by helping less privileged Nigerians, especially in Ogwashi-Ukwu, Delta State, build healthier and more self-reliant lives. We give scholarships and support to students in need, offer technology and practical skills training, expand access to primary health care, improve community welfare through efforts like environmental cleanups, and back small businesses and job creation for young people.",
  missionShort: "Carrying our parents' legacy forward by investing in education, health, and opportunity for the people of Ogwashi-Ukwu and beyond.",
  vision: "We see an Ogwashi-Ukwu, and a Nigeria, where every child can get an education, every family can get quality primary care, and every young person has the skills and opportunity to build a livelihood and lift their community.",
  visionShort: 'Healthy, educated, thriving communities where no one is held back by poverty.',
  pillars: [
    { id: 'education', n: '01', title: 'Education', line: 'Every child can get an education.',
      text: 'Scholarships and support for students in need, so that a family’s circumstances never decide a child’s future.', img: 'classroom-kids' },
    { id: 'health', n: '02', title: 'Health', line: 'Every family can get quality primary care.',
      text: 'Expanding access to primary health care for families in Ogwashi-Ukwu and the communities around it.', img: 'nurse-clinic' },
    { id: 'opportunity', n: '03', title: 'Opportunity', line: 'Every young person can build a livelihood.',
      text: 'Technology and practical skills training, plus backing for small businesses and job creation for young people.', img: 'man-portrait' },
  ],
  programmes: [
    { id: 'scholarships', pillar: 'education', title: 'Scholarships & student support', text: 'Financial and practical support for students in need.', img: 'books-stack' },
    { id: 'skills', pillar: 'opportunity', title: 'Technology & skills training', text: 'Practical training that turns learning into work.', img: 'woman-portrait' },
    { id: 'primary-care', pillar: 'health', title: 'Primary health care', text: 'Bringing quality primary care within reach of more families.', img: 'hands-holding' },
    { id: 'community', pillar: 'community', title: 'Community welfare', text: 'Environmental cleanups and efforts that improve everyday life.', img: 'volunteers-boxes' },
    { id: 'enterprise', pillar: 'opportunity', title: 'Small business & jobs', text: 'Backing small businesses and creating jobs for young people.', img: 'farm-worker' },
  ],
  // Layout-only sample stories. Replace with real stories, names and dates.
  stories: [
    { sample: true, tag: 'Education', title: 'Sample story: a scholarship cohort begins the new term', date: 'Sample date', img: 'classroom-empty' },
    { sample: true, tag: 'Health', title: 'Sample story: a community health day opens its doors', date: 'Sample date', img: 'hands-reaching' },
    { sample: true, tag: 'Community', title: 'Sample story: neighbours come together for a cleanup', date: 'Sample date', img: 'volunteer-back' },
  ],
  // Structural facts only. No performance numbers are invented here.
  facts: [
    { v: 3, label: 'Pillars: education, health and opportunity' },
    { v: 5, label: 'Programme areas supported by CKF' },
    { v: 1, label: 'Home community: Ogwashi-Ukwu, Delta State' },
  ],
  imgDir: '../../public/assets/img/',
  img(k) { return this.imgDir + k + '.jpg'; },
  credit: 'Photographs are illustrative stock images (Unsplash) used as placeholders. They do not depict CKF programmes, beneficiaries or events and must be replaced with CKF photography.',
};
