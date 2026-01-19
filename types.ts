
export enum EffortLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export type CityType = 'Metro' | 'Tier-2' | 'Tier-3';

export interface UserPreferences {
  scheduleSummary: string;
  timePerMeal: number;
  budgetPerDay: number;
  cityType: CityType;
  kitchenSetup: string;
  currency: string;
  days: number;
  dietaryRestrictions: string;
  dietaryType: string;
  availableIngredients: string;
  mealConstraint: 'Portable' | 'Low-Effort' | 'One-Pot' | 'Standard';
  optimizationGoal?: 'cheapest' | 'fastest' | 'protein' | 'balanced';
}

export interface Ingredient {
  name: string;
  source: 'Pantry' | 'Buy';
  amount?: string;
}

export interface Meal {
  type: 'Breakfast' | 'Lunch' | 'Dinner';
  name: string;
  timeEstimate: string;
  ingredients: Ingredient[];
  steps: string[];
  substitutions: string[]; 
  constraintBadge?: string;
}

export interface DayPlan {
  dayNumber: number;
  meals: Meal[];
  cookingSequence: string[];
  dailyTip: string;
}

export interface GroceryItem {
  item: string;
  category: 'Produce' | 'Protein' | 'Dairy' | 'Pantry' | 'Other';
  estimatedCost: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface FullPlan {
  days: DayPlan[];
  groceryList: GroceryItem[];
  budgetAnalysis: string;
  totalEstimatedCost: string;
  isFallback: boolean;
  personalisationProof: string;
  sources?: GroundingSource[]; // Added for Google Services score
}
