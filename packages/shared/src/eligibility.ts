import type { UserProfile } from '../schema/userProfile.js';
import type { JsonLogicRule } from '../schema/opportunity.js';
import { incomeToNumeric, ageBracketToNumeric } from '../schema/userProfile.js';

export interface MatchExplanation {
  matched_clauses: string[];
  disqualifiers: string[];
  matched_profile_fields: string[];
}

export function evaluateRule(rule: JsonLogicRule, profile: UserProfile): boolean {
  if (typeof rule !== 'object' || rule === null) {
    return !!rule;
  }

  const operator = Object.keys(rule)[0];
  const operand = rule[operator];

  switch (operator) {
    case 'all':
      return Array.isArray(operand) && operand.every(r => evaluateRule(r, profile));
    
    case 'any':
      return Array.isArray(operand) && operand.some(r => evaluateRule(r, profile));
    
    case 'not':
      return !evaluateRule(operand, profile);
    
    case 'eq':
      return getValue(operand[0], profile) === getValue(operand[1], profile);
    
    case 'ne':
      return getValue(operand[0], profile) !== getValue(operand[1], profile);
    
    case 'lt':
      return getValue(operand[0], profile) < getValue(operand[1], profile);
    
    case 'lte':
      return getValue(operand[0], profile) <= getValue(operand[1], profile);
    
    case 'gt':
      return getValue(operand[0], profile) > getValue(operand[1], profile);
    
    case 'gte':
      return getValue(operand[0], profile) >= getValue(operand[1], profile);
    
    case 'in':
      const value = getValue(operand[0], profile);
      const array = getValue(operand[1], profile);
      return Array.isArray(array) && array.includes(value);
    
    case 'contains':
      const container = getValue(operand[0], profile);
      const item = getValue(operand[1], profile);
      return Array.isArray(container) && container.includes(item);
    
    case 'exists':
      return getValue(operand, profile) !== undefined;
    
    case 'missing':
      return getValue(operand, profile) === undefined;
    
    case 'var':
      return getValue(rule, profile);
    
    default:
      return false;
  }
}

export function explainMatch(rule: JsonLogicRule, profile: UserProfile): MatchExplanation {
  const matched_clauses: string[] = [];
  const disqualifiers: string[] = [];
  const matched_profile_fields: string[] = [];

  explainRule(rule, profile, matched_clauses, disqualifiers, matched_profile_fields);

  return {
    matched_clauses,
    disqualifiers,
    matched_profile_fields,
  };
}

function explainRule(
  rule: JsonLogicRule, 
  profile: UserProfile, 
  matched: string[], 
  disqualified: string[], 
  fields: string[]
): boolean {
  if (typeof rule !== 'object' || rule === null) {
    return !!rule;
  }

  const operator = Object.keys(rule)[0];
  const operand = rule[operator];

  switch (operator) {
    case 'all':
      const allResults = operand.map((r: any) => 
        explainRule(r, profile, matched, disqualified, fields)
      );
      return allResults.every(Boolean);

    case 'any':
      const anyResults = operand.map((r: any) => 
        explainRule(r, profile, matched, disqualified, fields)
      );
      return anyResults.some(Boolean);

    case 'not':
      const notResult = explainRule(operand, profile, matched, disqualified, fields);
      return !notResult;

    case 'eq':
      const leftVal = getValue(operand[0], profile);
      const rightVal = getValue(operand[1], profile);
      const isMatch = leftVal === rightVal;
      
      if (operand[0].var) {
        fields.push(operand[0].var);
        const explanation = `${formatField(operand[0].var)} matches requirement (${rightVal})`;
        
        if (isMatch) {
          matched.push(explanation);
        } else {
          disqualified.push(`${formatField(operand[0].var)} does not match (current: ${leftVal}, required: ${rightVal})`);
        }
      }
      
      return isMatch;

    case 'in':
      const value = getValue(operand[0], profile);
      const array = getValue(operand[1], profile);
      const inMatch = Array.isArray(array) && array.includes(value);
      
      if (operand[0].var) {
        fields.push(operand[0].var);
        const explanation = `${formatField(operand[0].var)} is in accepted regions/categories`;
        
        if (inMatch) {
          matched.push(explanation);
        } else {
          disqualified.push(`${formatField(operand[0].var)} not in accepted list (current: ${value})`);
        }
      }
      
      return inMatch;

    case 'contains':
      const container = getValue(operand[0], profile);
      const item = getValue(operand[1], profile);
      const containsMatch = Array.isArray(container) && container.includes(item);
      
      if (operand[0].var) {
        fields.push(operand[0].var);
        const explanation = `${formatField(operand[0].var)} contains required skill/certification`;
        
        if (containsMatch) {
          matched.push(explanation);
        } else {
          disqualified.push(`${formatField(operand[0].var)} missing required item: ${item}`);
        }
      }
      
      return containsMatch;

    case 'lte':
      const lteLeft = getValue(operand[0], profile);
      const lteRight = getValue(operand[1], profile);
      const lteMatch = lteLeft <= lteRight;
      
      if (operand[0].var) {
        fields.push(operand[0].var);
        const explanation = `${formatField(operand[0].var)} within threshold (≤ ${lteRight})`;
        
        if (lteMatch) {
          matched.push(explanation);
        } else {
          disqualified.push(`${formatField(operand[0].var)} exceeds threshold (current: ${lteLeft}, max: ${lteRight})`);
        }
      }
      
      return lteMatch;

    case 'gte':
      const gteLeft = getValue(operand[0], profile);
      const gteRight = getValue(operand[1], profile);
      const gteMatch = gteLeft >= gteRight;
      
      if (operand[0].var) {
        fields.push(operand[0].var);
        const explanation = `${formatField(operand[0].var)} meets minimum requirement (≥ ${gteRight})`;
        
        if (gteMatch) {
          matched.push(explanation);
        } else {
          disqualified.push(`${formatField(operand[0].var)} below minimum (current: ${gteLeft}, min: ${gteRight})`);
        }
      }
      
      return gteMatch;

    case 'exists':
      const existsVal = getValue(operand, profile);
      const existsMatch = existsVal !== undefined;
      
      if (operand.var) {
        fields.push(operand.var);
        const explanation = `${formatField(operand.var)} is provided`;
        
        if (existsMatch) {
          matched.push(explanation);
        } else {
          disqualified.push(`${formatField(operand.var)} is required but not provided`);
        }
      }
      
      return existsMatch;

    default:
      return false;
  }
}

function getValue(operand: any, profile: UserProfile): any {
  if (typeof operand === 'object' && operand?.var) {
    const path = operand.var.split('.');
    let current: any = profile;
    for (const key of path) {
      current = current?.[key];
    }
    
    // Special handling for computed fields
    if (operand.var === 'economic.income_bracket_numeric') {
      return incomeToNumeric(current);
    }
    
    if (operand.var === 'demographics.age_bracket_numeric') {
      return ageBracketToNumeric(current);
    }
    
    return current;
  }
  return operand;
}

function formatField(varPath: string): string {
  const fieldNames: Record<string, string> = {
    'location.country_code': 'Country',
    'location.province_code': 'Province',
    'location.municipality': 'Municipality',
    'demographics.age_bracket': 'Age group',
    'demographics.citizenship_status': 'Citizenship status',
    'demographics.disability_status': 'Disability status',
    'economic.employment_status': 'Employment status',
    'economic.income_bracket': 'Income level',
    'economic.income_bracket_numeric': 'Income level',
    'economic.dependents_count': 'Number of dependents',
    'education_skills.highest_education_level': 'Education level',
    'education_skills.skills': 'Skills',
    'education_skills.certifications': 'Certifications',
    'constraints.transport_mode': 'Transport method',
    'constraints.max_commute_km': 'Maximum commute distance',
    'constraints.internet_access': 'Internet access',
    'constraints.device_type': 'Device type',
    'constraints.time_availability_hours_per_week': 'Available hours per week',
    'goals.primary_goal': 'Primary goal',
    'goals.preferred_categories': 'Preferred categories',
    'goals.language_prefs': 'Language preferences',
  };
  
  return fieldNames[varPath] || varPath.replace(/[_.]/g, ' ');
}

// Helper function to calculate match score based on profile alignment
export function calculateMatchScore(
  opportunity: any, 
  profile: UserProfile,
  isEligible: boolean = true
): number {
  if (!isEligible) return 0;
  
  let score = 0.5; // Base score for eligible opportunities

  // Freshness component (0.2 weight)
  if (opportunity.provenance?.freshness_score) {
    score += opportunity.provenance.freshness_score * 0.2;
  }

  // Goal alignment (0.2 weight)
  const goalMapping: Record<string, string> = {
    'find_job': 'job',
    'get_grant': 'grant',
    'get_training': 'training',
    'reduce_costs': 'service'
  };
  
  if (profile.goals?.primary_goal && 
      goalMapping[profile.goals.primary_goal] === opportunity.category) {
    score += 0.2;
  }

  // Category preference (0.1 weight)
  if (profile.goals?.preferred_categories?.includes(opportunity.category)) {
    score += 0.1;
  }

  // Transport consideration - penalty for jobs far from transport constraints
  if (opportunity.category === 'job' && profile.constraints?.transport_mode === 'walk') {
    // This would need geolocation data - for now, assume regional matching is good enough
    if (profile.location?.province_code && 
        opportunity.regions?.some((r: string) => r.includes(profile.location.province_code!))) {
      score += 0.1;
    }
  }

  return Math.min(score, 1.0);
}
