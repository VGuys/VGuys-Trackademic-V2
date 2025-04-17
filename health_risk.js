function calculateHealthRisk(data) {
    const { age, height, weight, systolic, diastolic, familyHistory } = data;

    if (!age || !height || !weight || !Array.isArray(familyHistory)) {
        throw new Error('Missing required fields');
    }

    if (height < 60) {
        throw new Error('Minimum height must be at least 60 cm');
    }

    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);

    let riskScore = 0;

    // Age scoring
    if (age < 30) riskScore += 0;
    else if (age < 45) riskScore += 10;
    else if (age < 60) riskScore += 20;
    else riskScore += 30;

    // BMI scoring
    if (bmi >= 30) riskScore += 75;
    else if (bmi >= 25) riskScore += 30;

    // Blood pressure scoring
    if (systolic && diastolic) {
        if (systolic > 180 || diastolic > 120) riskScore += 100;
        else if (systolic >= 140 || diastolic >= 90) riskScore += 75;
        else if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) riskScore += 30;
        else if (systolic >= 120 && systolic <= 129 && diastolic < 80) riskScore += 15;
    }

    // Family history scoring
    if (familyHistory.includes("diabetes")) riskScore += 10;
    if (familyHistory.includes("cancer")) riskScore += 10;
    if (familyHistory.includes("heart disease")) riskScore += 10;

    // Risk category
    let riskCategory = 'Low Risk';
    if (riskScore > 75) riskCategory = 'Uninsurable';
    else if (riskScore > 50) riskCategory = 'High Risk';
    else if (riskScore > 20) riskCategory = 'Moderate Risk';

    return {
        riskCategory,
        riskScore,
        bmi: bmi.toFixed(2)
    };
}

module.exports = calculateHealthRisk;
