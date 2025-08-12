import { CourseItem } from "../types";

// Local concentration requirements data structure
// This mimics the backend structure but works locally for unsigned users
interface ConcentrationRequirements {
  [concentration: string]: {
    requirements_options: Record<string, string[]>;
    total_required: number;
  };
}

// CS concentration requirements matching backend structure
// Based on the actual Google Sheets data structure used by the backend
const LOCAL_REQUIREMENTS: ConcentrationRequirements = {
  "Computer Science Sc.B.": {
    requirements_options: {
      "Calculus": ["MATH 0100", "MATH 0170", "MATH 0190"],
      "Intro Part 1": ["CSCI 0111", "CSCI 0112", "CSCI 0150", "CSCI 0170", "CSCI 0190"],
      "Intro Part 2": ["CSCI 0200"],
      "Math Foundation": ["CSCI 0220", "MATH 0520", "MATH 0540", "CSCI 1450"],
      "Foundations AI": ["CSCI 1410", "CSCI 1420", "CSCI 1430", "CSCI 1460", "CSCI 1470"],
      "Foundations Systems": ["CSCI 0300", "CSCI 0320", "CSCI 0330"],
      "Foundations Theory": ["CSCI 0500", "CSCI 1010", "CSCI 1550", "CSCI 1570"],
      "Technical Courses": ["CSCI 1230", "CSCI 1234", "CSCI 1260", "CSCI 1270", "CSCI 1280", "CSCI 1300", "CSCI 1310", "CSCI 1320", "CSCI 1380", "CSCI 1410", "CSCI 1420", "CSCI 1430", "CSCI 1440", "CSCI 1450", "CSCI 1460", "CSCI 1470", "CSCI 1480", "CSCI 1490", "CSCI 1510", "CSCI 1515", "CSCI 1550", "CSCI 1570", "CSCI 1575", "CSCI 1580", "CSCI 1600", "CSCI 1620", "CSCI 1650", "CSCI 1660", "CSCI 1670", "CSCI 1680", "CSCI 1690", "CSCI 1710", "CSCI 1730", "CSCI 1760", "CSCI 1770", "CSCI 1780", "CSCI 1800", "CSCI 1805", "CSCI 1810", "CSCI 1820", "CSCI 1850", "CSCI 1870", "CSCI 1950", "CSCI 1951", "CSCI 1952", "CSCI 2240", "CSCI 2270", "CSCI 2300", "CSCI 2340", "CSCI 2440", "CSCI 2470", "CSCI 2500", "CSCI 2540", "CSCI 2660", "CSCI 2670", "CSCI 2950", "CSCI 2951", "CSCI 2952"],
      "Electives": ["APMA 1650", "APMA 1655", "APMA 1660", "APMA 1670", "APMA 1680", "APMA 1690", "APMA 1740", "CSCI 1010", "CSCI 1230", "CSCI 1234", "CSCI 1260", "CSCI 1270", "CSCI 1280", "CSCI 1300", "CSCI 1310", "CSCI 1320", "CSCI 1380", "CSCI 1410", "CSCI 1420", "CSCI 1430", "CSCI 1440", "CSCI 1450", "CSCI 1460", "CSCI 1470", "CSCI 1480", "CSCI 1490", "CSCI 1510", "CSCI 1515", "CSCI 1550", "CSCI 1570", "CSCI 1575", "CSCI 1580", "CSCI 1600", "CSCI 1620", "CSCI 1650", "CSCI 1660", "CSCI 1670", "CSCI 1680", "CSCI 1690", "CSCI 1710", "CSCI 1730", "CSCI 1760", "CSCI 1770", "CSCI 1780", "CSCI 1800", "CSCI 1805", "CSCI 1810", "CSCI 1820", "CSCI 1850", "CSCI 1870", "CSCI 1950", "CSCI 1951", "CSCI 1952", "CSCI 2240", "CSCI 2270", "CSCI 2300", "CSCI 2340", "CSCI 2440", "CSCI 2470", "CSCI 2500", "CSCI 2540", "CSCI 2660", "CSCI 2670", "CSCI 2950", "CSCI 2951", "CSCI 2952", "MATH 0200", "MATH 0350", "MATH 0420", "MATH 1010", "MATH 1040", "MATH 1260", "MATH 1410", "MATH 1530", "MATH 1540", "MATH 1560", "MATH 1580", "MATH 1610", "MATH 1620"],
      "Capstone": ["CSCI 1230", "CSCI 1234", "CSCI 1260", "CSCI 1270", "CSCI 1280", "CSCI 1300", "CSCI 1310", "CSCI 1320", "CSCI 1380", "CSCI 1410", "CSCI 1420", "CSCI 1430", "CSCI 1440", "CSCI 1460", "CSCI 1470", "CSCI 1480", "CSCI 1490", "CSCI 1510", "CSCI 1515", "CSCI 1550", "CSCI 1570", "CSCI 1575", "CSCI 1580", "CSCI 1600", "CSCI 1620", "CSCI 1650", "CSCI 1660", "CSCI 1670", "CSCI 1680", "CSCI 1690", "CSCI 1710", "CSCI 1730", "CSCI 1760", "CSCI 1770", "CSCI 1780", "CSCI 1800", "CSCI 1805", "CSCI 1810", "CSCI 1820", "CSCI 1850", "CSCI 1870", "CSCI 1950", "CSCI 1951", "CSCI 1952", "CSCI 2240", "CSCI 2270", "CSCI 2300", "CSCI 2340", "CSCI 2440", "CSCI 2470", "CSCI 2500", "CSCI 2540", "CSCI 2660", "CSCI 2670", "CSCI 2950", "CSCI 2951", "CSCI 2952"],
    },
    total_required: 15,
  },
  "Computer Science A.B.": {
    requirements_options: {
      "Intro Part 1": ["CSCI 0111", "CSCI 0112", "CSCI 0150", "CSCI 0170", "CSCI 0190"],
      "Intro Part 2": ["CSCI 0200"],
      "Math Foundation": ["CSCI 0220", "MATH 0520", "MATH 0540", "CSCI 1450"],
      "Foundations AI": ["CSCI 1410", "CSCI 1420", "CSCI 1430", "CSCI 1460", "CSCI 1470"],
      "Foundations Systems": ["CSCI 0300", "CSCI 0320", "CSCI 0330"],
      "Foundations Theory": ["CSCI 0500", "CSCI 1010", "CSCI 1550", "CSCI 1570"],
      "Technical Courses": ["CSCI 1230", "CSCI 1234", "CSCI 1260", "CSCI 1270", "CSCI 1280", "CSCI 1300", "CSCI 1310", "CSCI 1320", "CSCI 1380", "CSCI 1410", "CSCI 1420", "CSCI 1430", "CSCI 1440", "CSCI 1450", "CSCI 1460", "CSCI 1470", "CSCI 1480", "CSCI 1490", "CSCI 1510", "CSCI 1515", "CSCI 1550", "CSCI 1570", "CSCI 1575", "CSCI 1580", "CSCI 1600", "CSCI 1620", "CSCI 1650", "CSCI 1660", "CSCI 1670", "CSCI 1680", "CSCI 1690", "CSCI 1710", "CSCI 1730", "CSCI 1760", "CSCI 1770", "CSCI 1780", "CSCI 1800", "CSCI 1805", "CSCI 1810", "CSCI 1820", "CSCI 1850", "CSCI 1870", "CSCI 1950", "CSCI 1951", "CSCI 1952"],
      "Electives": ["APMA 1650", "APMA 1655", "APMA 1660", "APMA 1670", "APMA 1680", "APMA 1690", "APMA 1740", "CSCI 1010", "CSCI 1230", "CSCI 1234", "CSCI 1260", "CSCI 1270", "CSCI 1280", "CSCI 1300", "CSCI 1310", "CSCI 1320", "CSCI 1380", "CSCI 1410", "CSCI 1420", "CSCI 1430", "CSCI 1440", "CSCI 1450", "CSCI 1460", "CSCI 1470", "CSCI 1480", "CSCI 1490", "CSCI 1510", "CSCI 1515", "CSCI 1550", "CSCI 1570", "CSCI 1575", "CSCI 1580", "CSCI 1600", "CSCI 1620", "CSCI 1650", "CSCI 1660", "CSCI 1670", "CSCI 1680", "CSCI 1690", "CSCI 1710", "CSCI 1730", "CSCI 1760", "CSCI 1770", "CSCI 1780", "CSCI 1800", "CSCI 1805", "CSCI 1810", "CSCI 1820", "CSCI 1850", "CSCI 1870", "CSCI 1950", "CSCI 1951", "CSCI 1952", "MATH 0100", "MATH 0170", "MATH 0180", "MATH 0190", "MATH 0200", "MATH 0350", "MATH 0420", "MATH 1010", "MATH 1040", "MATH 1260", "MATH 1410", "MATH 1530", "MATH 1540", "MATH 1560", "MATH 1580", "MATH 1610", "MATH 1620"],
      "Capstone": ["CSCI 1230", "CSCI 1234", "CSCI 1260", "CSCI 1270", "CSCI 1280", "CSCI 1300", "CSCI 1310", "CSCI 1320", "CSCI 1380", "CSCI 1410", "CSCI 1420", "CSCI 1430", "CSCI 1440", "CSCI 1460", "CSCI 1470", "CSCI 1480", "CSCI 1490", "CSCI 1510", "CSCI 1515", "CSCI 1550", "CSCI 1570", "CSCI 1575", "CSCI 1580", "CSCI 1600", "CSCI 1620", "CSCI 1650", "CSCI 1660", "CSCI 1670", "CSCI 1680", "CSCI 1690", "CSCI 1710", "CSCI 1730", "CSCI 1760", "CSCI 1770", "CSCI 1780", "CSCI 1800", "CSCI 1805", "CSCI 1810", "CSCI 1820", "CSCI 1850", "CSCI 1870", "CSCI 1950", "CSCI 1951", "CSCI 1952"],
    },
    total_required: 10,
  },
};

export const concentrationUtils = {
  // Get requirements for a concentration
  getRequirements: (concentration: string) => {
    return LOCAL_REQUIREMENTS[concentration] || {
      requirements_options: {},
      total_required: 0,
    };
  },

  // Check which courses from user's plan satisfy requirements
  checkRequirements: (courses: CourseItem[], concentration: string) => {
    const requirements = concentrationUtils.getRequirements(concentration);
    const userCoursesCodes = courses.map(c => c.courseCode.toUpperCase());
    
    const breakdown: Record<string, string[]> = {};
    let coursesCompleted = 0;
    
    // Check each requirement category
    for (const [category, requiredCourses] of Object.entries(requirements.requirements_options)) {
      breakdown[category] = [];
      
      for (const reqCourse of requiredCourses) {
        if (userCoursesCodes.includes(reqCourse.toUpperCase())) {
          breakdown[category].push(reqCourse);
          coursesCompleted++;
        }
      }
    }
    
    return {
      user_requirements_breakdown: breakdown,
      courses_completed: coursesCompleted,
      total_required: requirements.total_required,
    };
  },

  // Get all available concentrations
  getAvailableConcentrations: () => {
    return Object.keys(LOCAL_REQUIREMENTS);
  },
};