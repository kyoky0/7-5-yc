/**
 * Hackathon demo secrets. This module only ever runs inside the enclave
 * runner -- it is never imported by, or shipped to, the Parent EC2 API or
 * the frontend. In a non-demo deployment these values would come from
 * `attestedDecrypt()` in ../kms/attestedDecrypt.ts via KMS.
 */
export interface CompanySecrets {
  megacorp: string;
  altai: string;
  nanoshield: string;
  biowrap: string;
}

export const DEMO_SECRETS: CompanySecrets = {
  megacorp: [
    "EV thermal management is the #1 priority for FY2027.",
    "Current battery cooling system fails above 45°C ambient.",
    "Budget: $12M allocated for thermal R&D partnerships.",
    "Internal deadline: prototype by Q2 2027.",
    "Patent pending on liquid immersion cooling approach.",
  ].join(" "),
  altai: [
    "Developed ultra-lightweight ceramic insulation rated to 1,400°C.",
    "Currently used in oil refinery applications only.",
    "Manufacturing capacity: 50 tonnes/month, expandable to 200.",
    "Looking for automotive or aerospace applications to diversify.",
    "Proprietary sintering process reduces weight by 40% vs competitors.",
  ].join(" "),
  nanoshield: [
    "Nano-coating technology with dual thermal and electrical insulation.",
    "Proven in deep-sea equipment at pressures up to 600 bar.",
    "R&D team exploring automotive battery applications internally.",
    "Cost per unit area is 3x current automotive thermal solutions.",
    "Partnership with Tsinghua University on next-gen formulation.",
  ].join(" "),
  biowrap: [
    "Bio-polymer with unexpected EMI shielding properties discovered.",
    "Medical packaging certification (ISO 11607) already obtained.",
    "Material is biodegradable within 180 days in industrial composting.",
    "Shielding effectiveness: 35 dB at 1 GHz frequency range.",
    "Seeking non-medical applications to scale production volume.",
  ].join(" "),
};
