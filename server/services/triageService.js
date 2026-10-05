/**
 * Rule-Based Offline AI Triage Engine
 * Fully deterministic, explainable, and zero-dependency decision support
 */

export function evaluateTriage({ age = 30, gender = 'unspecified', bodyParts = [], symptoms = [], vitals = {}, text = '' }) {
  const reasons = [];
  let score = 0; // 0-10: Green (0-3), Yellow (4-6), Red (7-10)
  
  const parsedAge = Number(age) || 30;
  const spo2 = Number(vitals.spo2);
  const sysBP = Number(vitals.systolicBP);
  const diaBP = Number(vitals.diastolicBP);
  const tempF = Number(vitals.temperature);
  const feverDays = Number(vitals.feverDays) || 1;

  const symptomList = (symptoms || []).map(s => s.toLowerCase());
  const bodyList = (bodyParts || []).map(b => b.toLowerCase());
  const narrative = (text || '').toLowerCase();

  // Helper check
  const has = (term) => symptomList.includes(term) || bodyList.includes(term) || narrative.includes(term);

  // --- RED CRITERIA (Life-Threatening / Emergency) ---
  if ((has('chest pain') || has('chest')) && (has('breathlessness') || has('shortness of breath') || has('cough'))) {
    reasons.push('Combined chest pain and respiratory distress can indicate an acute cardiovascular or severe pulmonary emergency.');
    score += 8;
  }

  if (has('snake bite') || narrative.includes('snake')) {
    reasons.push('Suspected snake envenomation requires immediate medical antivenom administration.');
    score += 10;
  }

  if (has('heavy bleeding') || has('bleeding') || narrative.includes('blood loss')) {
    reasons.push('Active heavy blood loss requires emergency stabilization.');
    score += 7;
  }

  if (has('unconscious') || has('fainting') || narrative.includes('passed out')) {
    reasons.push('Loss of consciousness indicates severe neurological or hemodynamic compromise.');
    score += 9;
  }

  if (!isNaN(spo2) && spo2 > 0 && spo2 < 90) {
    reasons.push(`Critical hypoxemia detected: Oxygen saturation is dangerously low at ${spo2}%.`);
    score += 8;
  }

  if ((!isNaN(sysBP) && sysBP >= 180) || (!isNaN(diaBP) && diaBP >= 120)) {
    reasons.push(`Hypertensive crisis range detected: Blood pressure ${sysBP}/${diaBP} mmHg.`);
    score += 7;
  }

  if (narrative.includes('pregnancy') && (has('bleeding') || has('severe headache') || has('convulsions'))) {
    reasons.push('Severe obstetric red-flag signs during pregnancy require immediate tertiary care.');
    score += 8;
  }

  // --- YELLOW CRITERIA (Urgent Attention Required) ---
  if (has('fever') && feverDays >= 3) {
    reasons.push(`Prolonged pyrexia (${feverDays} days) warrants urgent investigation for malaria, dengue, or typhoid.`);
    score += 4;
  }

  if (has('fever') && (parsedAge < 5 || parsedAge > 65)) {
    reasons.push(`Fever in high-risk demographic group (Age: ${parsedAge}) has higher vulnerability to rapid dehydration or sepsis.`);
    score += 4;
  }

  if (has('vomiting') && (has('weakness') || narrative.includes('cannot keep food'))) {
    reasons.push('Persistent vomiting with dehydration risk necessitates clinical rehydration and evaluation.');
    score += 4;
  }

  if (!isNaN(spo2) && spo2 >= 90 && spo2 <= 93) {
    reasons.push(`Borderline low blood oxygen level (${spo2}%). Careful monitoring and clinical examination required.`);
    score += 4;
  }

  if (!isNaN(tempF) && tempF >= 102.5) {
    reasons.push(`Elevated core temperature recorded: ${tempF}°F.`);
    score += 3;
  }

  if ((!isNaN(sysBP) && sysBP >= 150) || (!isNaN(diaBP) && diaBP >= 95)) {
    reasons.push(`Elevated blood pressure stage 2: ${sysBP}/${diaBP} mmHg.`);
    score += 3;
  }

  // --- GREEN CRITERIA (Mild / Manageable) ---
  if (reasons.length === 0) {
    score = 2;
    reasons.push('Symptoms appear mild with stable physiological vitals.');
  }

  // Final Level Calculation
  let level = 'GREEN';
  let advice = 'Your symptoms appear mild and stable. A remote doctor is available for routine consultation and home care advice.';
  let recommendedAction = 'Routine Teleconsultation & Medication';

  if (score >= 7) {
    level = 'RED';
    advice = 'EMERGENCY: Immediate clinical intervention required. Priority doctor alert triggered. Kiosk operator is arranging immediate dispatch / emergency assistance.';
    recommendedAction = 'Immediate Emergency Video Call & Hospital Transfer';
  } else if (score >= 4) {
    level = 'YELLOW';
    advice = 'URGENT: Symptoms require clinical evaluation today to prevent escalation. You have been prioritized in the consultation queue.';
    recommendedAction = 'Priority Doctor Teleconsultation within 15 minutes';
  }

  return {
    level,
    score: Math.min(10, score),
    reasons,
    advice,
    recommendedAction,
    timestamp: new Date().toISOString()
  };
}
