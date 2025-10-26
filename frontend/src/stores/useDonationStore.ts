import { create } from 'zustand';
import { Donation } from '@/types';

interface DonationStore {
  userDonations: Donation[];
  isEncrypting: boolean;
  setUserDonations: (donations: Donation[]) => void;
  addDonation: (donation: Donation) => void;
  setIsEncrypting: (isEncrypting: boolean) => void;
}

export const useDonationStore = create<DonationStore>((set) => ({
  userDonations: [],
  isEncrypting: false,
  setUserDonations: (donations) => set({ userDonations: donations }),
  addDonation: (donation) =>
    set((state) => ({
      userDonations: [donation, ...state.userDonations],
    })),
  setIsEncrypting: (isEncrypting) => set({ isEncrypting }),
}));
