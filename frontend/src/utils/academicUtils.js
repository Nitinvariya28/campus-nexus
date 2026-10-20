/**
 * Academic Progression and Semester Calculator
 * Automatically calculates student semester, academic year, and graduation status
 * using admission year and the institution's official academic calendar:
 * - Odd Semesters (1, 3, 5, 7): July 1 - December 31
 * - Even Semesters (2, 4, 6, 8): January 1 - June 30
 */
export const calculateStudentSemester = (admissionYear, currentDate = new Date()) => {
  let resolvedYear = null;
  if (admissionYear) {
    const num = Number(admissionYear);
    if (!isNaN(num)) {
      resolvedYear = num < 100 ? 2000 + num : num;
    }
  }

  const currYear = currentDate.getFullYear();
  const currMonth = currentDate.getMonth() + 1; // 1-12

  if (!resolvedYear) {
    resolvedYear = currYear;
  }

  const yearsElapsed = currYear - resolvedYear;
  const expectedGraduationYear = resolvedYear + 4;

  let calculatedSem = 1;
  if (yearsElapsed < 0) {
    calculatedSem = 1;
  } else if (currMonth >= 7) {
    // Odd Semesters (1, 3, 5, 7): July - December
    calculatedSem = yearsElapsed * 2 + 1;
  } else {
    // Even Semesters (2, 4, 6, 8): January - June
    calculatedSem = yearsElapsed * 2;
  }

  const isGraduated = calculatedSem > 8;

  if (isGraduated) {
    return {
      semester: 8,
      semester_label: 'Graduated',
      academic_year: 4,
      academic_year_label: 'Graduated',
      is_graduated: true,
      admission_year: resolvedYear,
      expected_graduation_year: expectedGraduationYear,
    };
  }

  if (calculatedSem < 1) {
    return {
      semester: 1,
      semester_label: 'Semester 1',
      academic_year: 1,
      academic_year_label: '1st Year',
      is_graduated: false,
      admission_year: resolvedYear,
      expected_graduation_year: expectedGraduationYear,
    };
  }

  const academicYear = Math.floor((calculatedSem + 1) / 2);
  const suffixes = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th' };
  const academicYearLabel = `${suffixes[academicYear] || `${academicYear}th`} Year`;

  return {
    semester: calculatedSem,
    semester_label: `Semester ${calculatedSem}`,
    academic_year: academicYear,
    academic_year_label: academicYearLabel,
    is_graduated: false,
    admission_year: resolvedYear,
    expected_graduation_year: expectedGraduationYear,
  };
};

export default calculateStudentSemester;
