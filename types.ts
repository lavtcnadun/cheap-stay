
export enum AdStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Property {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price_per_night: number;
  location: string;
  bedrooms: number;
  amenities: string[];
  images: string[];
  advertisement_number: string;
  status: AdStatus;
  approval_date?: string;
  expiry_date?: string;
  created_at: string;
  profiles?: UserProfile; // Joined data
}

export interface Payment {
  id: string;
  property_id: string;
  reference_number: string;
  slip_image: string;
  amount: number;
  status: 'pending' | 'verified' | 'failed';
  approved_by?: string;
  approved_date?: string;
  created_at: string;
}

export interface HomepageSettings {
  id: number;
  logo_url: string;
  hero_image: string;
  slider_images: string[];
  homepage_heading: string;
  homepage_description: string;
}
