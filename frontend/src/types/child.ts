export interface Child {
  id: number;
  user_id: number;
  name: string;
  date_of_birth: string;
  gender?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ChildCreate {
  name: string;
  date_of_birth: string;
  gender?: string;
  notes?: string;
}

export interface ChildUpdate {
  name?: string;
  date_of_birth?: string;
  gender?: string;
  notes?: string;
}

export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}
