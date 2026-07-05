export interface CompanyMeta {
  id: "megacorp" | "altai" | "nanoshield" | "biowrap";
  name: string;
  nameJa: string;
  role: string;
  companyRole: "enterprise" | "startup";
  industry: string;
  country: string;
  color: string;
  capabilityTags: string[];
  needTags: string[];
}
