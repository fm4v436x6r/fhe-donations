import { create } from 'zustand';
import { Round, Project } from '@/types';

interface RoundStore {
  activeRounds: Round[];
  selectedRound: Round | null;
  roundProjects: Record<number, Project[]>;
  setActiveRounds: (rounds: Round[]) => void;
  selectRound: (round: Round | null) => void;
  setRoundProjects: (roundId: number, projects: Project[]) => void;
}

export const useRoundStore = create<RoundStore>((set) => ({
  activeRounds: [],
  selectedRound: null,
  roundProjects: {},
  setActiveRounds: (rounds) => set({ activeRounds: rounds }),
  selectRound: (round) => set({ selectedRound: round }),
  setRoundProjects: (roundId, projects) =>
    set((state) => ({
      roundProjects: { ...state.roundProjects, [roundId]: projects },
    })),
}));
