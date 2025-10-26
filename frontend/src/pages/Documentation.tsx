import { Layout } from '../components/Layout';
import { Card } from 'antd';
import {
  BookOutlined,
  RocketOutlined,
  LockOutlined,
  TeamOutlined,
  DollarOutlined,
  SafetyOutlined,
  ApiOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

export default function Documentation() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Documentation
          </h1>
          <p className="text-lg text-muted-foreground">
            Learn how SealedGood enables privacy-preserving quadratic funding
          </p>
        </div>

        {/* Table of Contents */}
        <Card className="mb-8 card-shadow">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <BookOutlined className="text-primary" />
            Table of Contents
          </h2>
          <ul className="space-y-2 text-muted-foreground">
            <li><a href="#overview" className="text-primary hover:underline">Overview</a></li>
            <li><a href="#rounds-projects" className="text-primary hover:underline">Rounds and Projects</a></li>
            <li><a href="#how-it-works" className="text-primary hover:underline">How It Works</a></li>
            <li><a href="#fhe-encryption" className="text-primary hover:underline">FHE Encryption</a></li>
            <li><a href="#quadratic-funding" className="text-primary hover:underline">Quadratic Funding Mechanism</a></li>
            <li><a href="#privacy-guarantees" className="text-primary hover:underline">Privacy Guarantees</a></li>
          </ul>
        </Card>

        {/* Overview */}
        <section id="overview" className="mb-12">
          <Card className="card-shadow">
            <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
              <RocketOutlined className="text-primary" />
              Overview
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                SealedGood is a privacy-first quadratic funding platform built on Fully Homomorphic Encryption (FHE)
                using Zama's fhEVM protocol. It enables donors to contribute to public goods projects while keeping
                their donation amounts completely private.
              </p>
              <p>
                Unlike traditional donation platforms where all contributions are public, SealedGood ensures that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Donation amounts remain encrypted on-chain</li>
                <li>No one can see how much you donated - not even the project owners</li>
                <li>Quadratic funding calculations happen on encrypted data</li>
                <li>Matching pools are distributed fairly without revealing individual contributions</li>
              </ul>
            </div>
          </Card>
        </section>

        {/* Rounds and Projects */}
        <section id="rounds-projects" className="mb-12">
          <Card className="card-shadow">
            <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
              <TeamOutlined className="text-primary" />
              Understanding Rounds and Projects
            </h2>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                  <DollarOutlined className="text-primary" />
                  What are Funding Rounds?
                </h3>
                <p className="mb-3">
                  A <strong>Funding Round</strong> is a time-limited fundraising campaign with a dedicated matching pool.
                  Think of it as a seasonal grant program where:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Time-bounded</strong>: Each round has a start date and end date</li>
                  <li><strong>Matching Pool</strong>: Contains funds (e.g., 4 ETH) to be distributed among participating projects</li>
                  <li><strong>Multiple Projects</strong>: Many projects can participate in the same round</li>
                  <li><strong>Quadratic Matching</strong>: The matching pool is distributed using quadratic funding formula</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                  <ApiOutlined className="text-primary" />
                  What are Projects?
                </h3>
                <p className="mb-3">
                  A <strong>Project</strong> is a public good initiative seeking funding. Projects:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Register Once</strong>: Created by project owners with metadata (name, description)</li>
                  <li><strong>Join Rounds</strong>: Automatically participate when they receive their first donation in a round</li>
                  <li><strong>Receive Donations</strong>: Accept encrypted contributions from donors</li>
                  <li><strong>Get Matched</strong>: Receive additional funds from the matching pool based on community support</li>
                </ul>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircleOutlined className="text-primary" />
                  Relationship Between Rounds and Projects
                </h3>
                <div className="space-y-3">
                  <p><strong>One-to-Many Relationship</strong></p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>One round can have many projects (e.g., "Spring 2025" round with 10 projects)</li>
                    <li>One project can participate in multiple rounds over time</li>
                    <li>Each donation specifies both the round and the project</li>
                  </ul>

                  <p className="mt-4"><strong>Example Flow</strong></p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>Community creates "Q1 2025" round with 10 ETH matching pool</li>
                    <li>Project "OpenZeppelin SDK" registers on the platform</li>
                    <li>Alice donates 0.1 ETH to OpenZeppelin in Q1 2025 round</li>
                    <li>Bob donates 0.05 ETH to OpenZeppelin in Q1 2025 round</li>
                    <li>OpenZeppelin now participates in Q1 2025 round with 2 donors</li>
                    <li>At round end, OpenZeppelin receives matching funds based on donor count and amounts</li>
                  </ol>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="mb-12">
          <Card className="card-shadow">
            <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
              <RocketOutlined className="text-primary" />
              How It Works
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">1. Round Creation</h3>
                <p className="text-muted-foreground">
                  Anyone can create a funding round by specifying:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Round name and description</li>
                  <li>Start and end dates</li>
                  <li>Matching pool amount</li>
                  <li>Min/max donation limits</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">2. Project Registration</h3>
                <p className="text-muted-foreground">
                  Project owners register their projects with:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Project name and description</li>
                  <li>Metadata stored on-chain (no IPFS required)</li>
                  <li>Optional verification for credibility</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">3. Private Donations</h3>
                <p className="text-muted-foreground mb-2">
                  When you donate, the following happens:
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4 text-muted-foreground">
                  <li><strong>Browser Encryption</strong>: Your donation amount is encrypted in your browser using FHE</li>
                  <li><strong>Transaction Submission</strong>: Encrypted data is sent to the blockchain</li>
                  <li><strong>On-chain Storage</strong>: Your encrypted donation is stored without revealing the amount</li>
                  <li><strong>Privacy Preserved</strong>: No one can decrypt your donation amount</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">4. Quadratic Matching</h3>
                <p className="text-muted-foreground">
                  At the end of the round:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Quadratic funding formula is applied to encrypted donations</li>
                  <li>Matching pool is distributed proportionally</li>
                  <li>Projects with more unique donors receive larger matches</li>
                  <li>All calculations preserve privacy</li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* FHE Encryption */}
        <section id="fhe-encryption" className="mb-12">
          <Card className="card-shadow">
            <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
              <LockOutlined className="text-primary" />
              FHE Encryption Mechanism
            </h2>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">What is Fully Homomorphic Encryption?</h3>
                <p>
                  Fully Homomorphic Encryption (FHE) is a revolutionary cryptographic technology that allows
                  computations to be performed on encrypted data without decrypting it. In SealedGood:
                </p>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                <h4 className="font-semibold text-foreground mb-3">Encryption Process</h4>
                <ol className="list-decimal list-inside space-y-3">
                  <li>
                    <strong>Client-Side Encryption</strong>
                    <p className="ml-6 mt-1">Your browser encrypts the donation amount (e.g., 0.1 ETH) using Zama's FHE SDK</p>
                  </li>
                  <li>
                    <strong>Proof Generation</strong>
                    <p className="ml-6 mt-1">A cryptographic proof is generated to verify the encryption is valid</p>
                  </li>
                  <li>
                    <strong>On-chain Verification</strong>
                    <p className="ml-6 mt-1">Smart contract verifies the proof and accepts the encrypted data</p>
                  </li>
                  <li>
                    <strong>Encrypted Storage</strong>
                    <p className="ml-6 mt-1">Encrypted amount is stored on-chain as euint32 type</p>
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Encrypted Operations</h3>
                <p className="mb-3">
                  The smart contracts can perform operations on encrypted data:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Addition</strong>: Sum encrypted donations without decryption</li>
                  <li><strong>Comparison</strong>: Check if donation exceeds limits (min/max)</li>
                  <li><strong>Selection</strong>: Choose values based on encrypted conditions</li>
                  <li><strong>Calculation</strong>: Compute quadratic funding on encrypted amounts</li>
                </ul>
              </div>

              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <SafetyOutlined className="text-destructive" />
                  Security Properties
                </h4>
                <ul className="space-y-2">
                  <li><strong>End-to-End Encryption</strong>: Data is encrypted from your browser to the blockchain</li>
                  <li><strong>Zero Knowledge</strong>: No one can learn your donation amount, not even miners or validators</li>
                  <li><strong>Computation on Ciphertext</strong>: All calculations happen on encrypted data</li>
                  <li><strong>Access Control</strong>: Only you can view your own donations (via FHE ACL)</li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* Quadratic Funding */}
        <section id="quadratic-funding" className="mb-12">
          <Card className="card-shadow">
            <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
              <DollarOutlined className="text-primary" />
              Quadratic Funding Mechanism
            </h2>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">What is Quadratic Funding?</h3>
                <p>
                  Quadratic Funding (QF) is a mathematically optimal way to fund public goods in a democratic manner.
                  It prioritizes projects with broad community support over those with a few large donors.
                </p>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                <h4 className="font-semibold text-foreground mb-3">The Formula</h4>
                <div className="bg-background/50 p-4 rounded font-mono text-sm mb-3">
                  Matching = (Σ √contribution)² - Σ contribution
                </div>
                <p>
                  For each project, sum the square roots of all contributions, square the result, then subtract
                  the total contributions. Projects with more unique donors get exponentially more matching funds.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Example</h3>
                <div className="bg-background border border-border rounded-lg p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-foreground">Project A: 10 donors × 0.1 ETH each = 1 ETH total</p>
                    <p className="text-sm">Matching calculation: (10 × √0.1)² - 1 = ~3 ETH match</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Project B: 1 donor × 1 ETH = 1 ETH total</p>
                    <p className="text-sm">Matching calculation: (1 × √1)² - 1 = 0 ETH match</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Both projects raised 1 ETH, but Project A receives 3× more matching funds due to broader community support!
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Privacy-Preserving QF</h3>
                <p>
                  In SealedGood, quadratic funding calculations are performed on <strong>encrypted donation amounts</strong> using FHE:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                  <li>Individual donations remain private throughout the calculation</li>
                  <li>Only the final matching distribution is revealed</li>
                  <li>Prevents donation amount manipulation and gaming</li>
                  <li>Ensures fair distribution based on true community support</li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* Privacy Guarantees */}
        <section id="privacy-guarantees" className="mb-12">
          <Card className="card-shadow">
            <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
              <SafetyOutlined className="text-primary" />
              Privacy Guarantees
            </h2>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <CheckCircleOutlined className="text-primary" />
                    What's Private
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Your donation amounts</li>
                    <li>• Your total contributions</li>
                    <li>• Individual donor amounts</li>
                    <li>• Donation distribution patterns</li>
                  </ul>
                </div>

                <div className="bg-background border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <BookOutlined />
                    What's Public
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• That you donated (wallet address)</li>
                    <li>• Which project you supported</li>
                    <li>• Which round you participated in</li>
                    <li>• Number of unique donors (count only)</li>
                  </ul>
                </div>
              </div>

              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
                <h4 className="font-semibold text-foreground mb-3">Important Notes</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Donation amounts are encrypted using FHE and stored on-chain permanently</li>
                  <li>• Only you can view your own donation amounts (via FHE access control)</li>
                  <li>• Project owners cannot see who donated how much</li>
                  <li>• The matching algorithm runs on encrypted data without revealing individual amounts</li>
                  <li>• In fhEVM v0.8.0, decryption requires Gateway oracle for specific use cases</li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* Footer */}
        <div className="text-center py-8 text-muted-foreground">
          <p>
            Built with Zama fhEVM v0.8.0 • Deployed on Ethereum Sepolia Testnet
          </p>
          <p className="text-sm mt-2">
            For more technical details, visit the{' '}
            <a
              href="https://github.com/fm4v436x6r/fhe-donations"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              GitHub repository
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
}
