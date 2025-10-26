# FHE Donations Platform - Technical Architecture

## System Architecture Overview

### Core Components

#### 1. Smart Contract Layer
```
contracts/
├── DonationFactory.sol         # Factory for creating funding rounds
├── QuadraticFunding.sol        # QF mechanism with FHE
├── DonationPool.sol            # Individual donation pools
├── MilestoneManager.sol        # Milestone tracking and releases
├── MatchingPool.sol            # Matching fund management
├── libraries/
│   ├── FHEDonationOps.sol     # FHE donation operations
│   ├── QuadraticFormula.sol   # QF calculations with encryption
│   └── PrivacyPreserving.sol  # Privacy utilities
└── interfaces/
    ├── IDonation.sol           # Donation interface
    └── IProject.sol            # Project interface
```

#### 2. Frontend Architecture
```
frontend/src/
├── components/
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectDetail.tsx
│   │   ├── MilestoneTracker.tsx
│   │   └── ImpactMetrics.tsx
│   ├── donation/
│   │   ├── DonationForm.tsx
│   │   ├── AnonymityToggle.tsx
│   │   ├── ContributionHistory.tsx
│   │   └── MatchingCalculator.tsx
│   ├── funding/
│   │   ├── FundingRound.tsx
│   │   ├── QuadraticDisplay.tsx
│   │   └── LeaderboardPrivate.tsx
│   └── shared/
│       ├── PrivacyIndicator.tsx
│       └── FundingProgress.tsx
├── hooks/
│   ├── useDonation.ts
│   ├── useQuadraticFunding.ts
│   └── useMilestones.ts
├── services/
│   ├── donationService.ts
│   ├── encryptionService.ts
│   └── projectService.ts
└── utils/
    ├── quadraticMath.ts
    └── privacyHelpers.ts
```

### Data Flow Architecture

#### Donation Flow
1. **Donation Intent**: User selects project and amount
2. **Privacy Selection**: Choose anonymous or public
3. **Amount Encryption**: Donation amount encrypted client-side
4. **Transaction Submission**: Encrypted donation sent to contract
5. **Pool Update**: Homomorphic addition to project pool
6. **Matching Calculation**: QF matching computed on encrypted values

#### Quadratic Funding Flow
1. **Round Initialization**: Set matching pool and parameters
2. **Contribution Collection**: Encrypted donations aggregated
3. **Quadratic Calculation**: √(sum of √contributions) on encrypted data
4. **Matching Distribution**: Proportional allocation from matching pool
5. **Final Distribution**: Funds released to projects

### Privacy Features

#### Donor Privacy
- Optional full anonymity
- Encrypted contribution amounts
- Private donation history
- Anonymous impact tracking

#### Project Privacy
- Private donor lists
- Encrypted funding goals
- Confidential milestone progress
- Private supporter count

### Security Architecture

#### Anti-Sybil Measures
- Gitcoin Passport integration
- BrightID verification
- Proof of Humanity
- Minimal contribution thresholds

#### Fund Security
- Time-locked releases
- Multi-sig milestone approval
- Escrow mechanisms
- Emergency pause functionality

### Performance Optimization

#### Gas Optimization
- Batch donation processing
- Optimized QF calculations
- Merkle tree for distributions
- Event-based tracking

#### Scalability
- L2 deployment options
- Off-chain aggregation
- IPFS for project data
- Pagination for large rounds

### Integration Points

#### External Services
- Gitcoin Passport for identity
- IPFS for project metadata
- The Graph for indexing
- Chainlink for price feeds

#### Payment Methods
- Multiple ERC-20 tokens
- Native currency support
- Stablecoin preferences
- Cross-chain donations

### Monitoring & Analytics

#### Key Metrics
- Total funds raised (encrypted)
- Number of unique donors
- Average donation (private)
- Matching pool efficiency
- Project success rate

#### Impact Tracking
- Milestone completion rate
- Fund utilization metrics
- Donor retention (anonymous)
- Project outcome tracking