import { z } from "zod";
export declare const entityTypeSchema: z.ZodEnum<{
    individual: "individual";
    company: "company";
    trust: "trust";
    smsf: "smsf";
    paf: "paf";
    puaf: "puaf";
}>;
export declare const portfolioStatusSchema: z.ZodEnum<{
    new: "new";
    existing_clean: "existing_clean";
    existing_reconciliation: "existing_reconciliation";
    complex_cleanup: "complex_cleanup";
}>;
export declare const serviceCodeSchema: z.ZodEnum<{
    customised_reporting: "customised_reporting";
    acnc_ais: "acnc_ais";
    responsible_person: "responsible_person";
    audit_liaison: "audit_liaison";
    franking_credit_refund_support: "franking_credit_refund_support";
    sub_fund_monthly_statements: "sub_fund_monthly_statements";
    standard_investment_administration: "standard_investment_administration";
    standard_investment_reporting: "standard_investment_reporting";
    annual_reporting: "annual_reporting";
    quarterly_reporting: "quarterly_reporting";
    monthly_reporting: "monthly_reporting";
    bas: "bas";
    asic_agent: "asic_agent";
}>;
export declare const entityInputSchema: z.ZodObject<{
    id: z.ZodString;
    entityName: z.ZodString;
    entityType: z.ZodEnum<{
        individual: "individual";
        company: "company";
        trust: "trust";
        smsf: "smsf";
        paf: "paf";
        puaf: "puaf";
    }>;
    portfolioStatus: z.ZodEnum<{
        new: "new";
        existing_clean: "existing_clean";
        existing_reconciliation: "existing_reconciliation";
        complex_cleanup: "complex_cleanup";
    }>;
    portfolioHin: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    abn: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    tfn: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    registeredForGst: z.ZodOptional<z.ZodBoolean>;
    listedInvestmentCount: z.ZodNumber;
    unlistedInvestmentCount: z.ZodNumber;
    propertyCount: z.ZodNumber;
    wrapCount: z.ZodNumber;
    otherAssetsText: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    hasCrypto: z.ZodDefault<z.ZodBoolean>;
    hasForeignInvestments: z.ZodDefault<z.ZodBoolean>;
    serviceCodes: z.ZodArray<z.ZodEnum<{
        customised_reporting: "customised_reporting";
        acnc_ais: "acnc_ais";
        responsible_person: "responsible_person";
        audit_liaison: "audit_liaison";
        franking_credit_refund_support: "franking_credit_refund_support";
        sub_fund_monthly_statements: "sub_fund_monthly_statements";
        standard_investment_administration: "standard_investment_administration";
        standard_investment_reporting: "standard_investment_reporting";
        annual_reporting: "annual_reporting";
        quarterly_reporting: "quarterly_reporting";
        monthly_reporting: "monthly_reporting";
        bas: "bas";
        asic_agent: "asic_agent";
    }>>;
    commencementDate: z.ZodString;
}, z.core.$strip>;
export declare const applicationInputSchema: z.ZodObject<{
    primaryContactName: z.ZodString;
    email: z.ZodEmail;
    phone: z.ZodString;
    applicantRole: z.ZodString;
    adviserDetails: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    groupName: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    servicesComments: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    entities: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        entityName: z.ZodString;
        entityType: z.ZodEnum<{
            individual: "individual";
            company: "company";
            trust: "trust";
            smsf: "smsf";
            paf: "paf";
            puaf: "puaf";
        }>;
        portfolioStatus: z.ZodEnum<{
            new: "new";
            existing_clean: "existing_clean";
            existing_reconciliation: "existing_reconciliation";
            complex_cleanup: "complex_cleanup";
        }>;
        portfolioHin: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        abn: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        tfn: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        registeredForGst: z.ZodOptional<z.ZodBoolean>;
        listedInvestmentCount: z.ZodNumber;
        unlistedInvestmentCount: z.ZodNumber;
        propertyCount: z.ZodNumber;
        wrapCount: z.ZodNumber;
        otherAssetsText: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        hasCrypto: z.ZodDefault<z.ZodBoolean>;
        hasForeignInvestments: z.ZodDefault<z.ZodBoolean>;
        serviceCodes: z.ZodArray<z.ZodEnum<{
            customised_reporting: "customised_reporting";
            acnc_ais: "acnc_ais";
            responsible_person: "responsible_person";
            audit_liaison: "audit_liaison";
            franking_credit_refund_support: "franking_credit_refund_support";
            sub_fund_monthly_statements: "sub_fund_monthly_statements";
            standard_investment_administration: "standard_investment_administration";
            standard_investment_reporting: "standard_investment_reporting";
            annual_reporting: "annual_reporting";
            quarterly_reporting: "quarterly_reporting";
            monthly_reporting: "monthly_reporting";
            bas: "bas";
            asic_agent: "asic_agent";
        }>>;
        commencementDate: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
/** Individuals step — matches public form validation. */
export declare const individualRelationshipRoleSchema: z.ZodEnum<{
    individual: "individual";
    trustee: "trustee";
    director: "director";
    company_secretary: "company_secretary";
}>;
export declare const individualInputSchema: z.ZodObject<{
    id: z.ZodString;
    relationshipRoles: z.ZodArray<z.ZodEnum<{
        individual: "individual";
        trustee: "trustee";
        director: "director";
        company_secretary: "company_secretary";
    }>>;
    title: z.ZodString;
    fullName: z.ZodString;
    streetAddress: z.ZodString;
    streetAddressLine2: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    taxFileNumber: z.ZodString;
    dateOfBirth: z.ZodString;
    countryOfBirth: z.ZodString;
    city: z.ZodString;
    occupation: z.ZodString;
    employer: z.ZodString;
    email: z.ZodEmail;
}, z.core.$strip>;
/** Document routing checkboxes: trustee/adviser, not required, or unset. */
export declare const documentSendToValueSchema: z.ZodUnion<readonly [z.ZodArray<z.ZodEnum<{
    trustee: "trustee";
    adviser: "adviser";
}>>, z.ZodLiteral<"not_required">, z.ZodLiteral<"">]>;
/**
 * Full public form POST body: core pricing/entities plus individuals, adviser, and admin preferences.
 */
export declare const fullApplicationSubmissionSchema: z.ZodObject<{
    primaryContactName: z.ZodString;
    email: z.ZodEmail;
    phone: z.ZodString;
    applicantRole: z.ZodString;
    adviserDetails: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    groupName: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    servicesComments: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    entities: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        entityName: z.ZodString;
        entityType: z.ZodEnum<{
            individual: "individual";
            company: "company";
            trust: "trust";
            smsf: "smsf";
            paf: "paf";
            puaf: "puaf";
        }>;
        portfolioStatus: z.ZodEnum<{
            new: "new";
            existing_clean: "existing_clean";
            existing_reconciliation: "existing_reconciliation";
            complex_cleanup: "complex_cleanup";
        }>;
        portfolioHin: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        abn: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        tfn: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        registeredForGst: z.ZodOptional<z.ZodBoolean>;
        listedInvestmentCount: z.ZodNumber;
        unlistedInvestmentCount: z.ZodNumber;
        propertyCount: z.ZodNumber;
        wrapCount: z.ZodNumber;
        otherAssetsText: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        hasCrypto: z.ZodDefault<z.ZodBoolean>;
        hasForeignInvestments: z.ZodDefault<z.ZodBoolean>;
        serviceCodes: z.ZodArray<z.ZodEnum<{
            customised_reporting: "customised_reporting";
            acnc_ais: "acnc_ais";
            responsible_person: "responsible_person";
            audit_liaison: "audit_liaison";
            franking_credit_refund_support: "franking_credit_refund_support";
            sub_fund_monthly_statements: "sub_fund_monthly_statements";
            standard_investment_administration: "standard_investment_administration";
            standard_investment_reporting: "standard_investment_reporting";
            annual_reporting: "annual_reporting";
            quarterly_reporting: "quarterly_reporting";
            monthly_reporting: "monthly_reporting";
            bas: "bas";
            asic_agent: "asic_agent";
        }>>;
        commencementDate: z.ZodString;
    }, z.core.$strip>>;
    individuals: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        relationshipRoles: z.ZodArray<z.ZodEnum<{
            individual: "individual";
            trustee: "trustee";
            director: "director";
            company_secretary: "company_secretary";
        }>>;
        title: z.ZodString;
        fullName: z.ZodString;
        streetAddress: z.ZodString;
        streetAddressLine2: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        taxFileNumber: z.ZodString;
        dateOfBirth: z.ZodString;
        countryOfBirth: z.ZodString;
        city: z.ZodString;
        occupation: z.ZodString;
        employer: z.ZodString;
        email: z.ZodEmail;
    }, z.core.$strip>>;
    adviserName: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    adviserCompany: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    adviserAddress: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    adviserTel: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    adviserFax: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    adviserEmail: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    nominateAdviserPrimaryContact: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodLiteral<"">]>>;
    authoriseAdviserAccessStatements: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodLiteral<"">]>>;
    authoriseDealWithAdviserDirect: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodLiteral<"">]>>;
    annualReportSendTo: z.ZodDefault<z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodEnum<{
        trustee: "trustee";
        adviser: "adviser";
    }>>, z.ZodLiteral<"not_required">, z.ZodLiteral<"">]>>>;
    meetingProxySendTo: z.ZodDefault<z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodEnum<{
        trustee: "trustee";
        adviser: "adviser";
    }>>, z.ZodLiteral<"not_required">, z.ZodLiteral<"">]>>>;
    investmentOffersSendTo: z.ZodDefault<z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodEnum<{
        trustee: "trustee";
        adviser: "adviser";
    }>>, z.ZodLiteral<"not_required">, z.ZodLiteral<"">]>>>;
    dividendPreference: z.ZodDefault<z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"cash">, z.ZodLiteral<"reinvest">, z.ZodLiteral<"">]>>>;
}, z.core.$strip>;
export type EntityInput = z.infer<typeof entityInputSchema>;
export type ApplicationInput = z.infer<typeof applicationInputSchema>;
export type IndividualInput = z.infer<typeof individualInputSchema>;
export type FullApplicationSubmission = z.infer<typeof fullApplicationSubmissionSchema>;
/** Strip extended fields for pricing / assessment (unchanged behaviour). */
export declare function toApplicationInput(full: FullApplicationSubmission): ApplicationInput;
export type RoutingOutcome = "pg_fit" | "jm_fit" | "manual_review";
export type PricingStatus = "indicative" | "review_required" | "manual_review" | "not_available";
export interface EntityAssessment {
    entityId: string;
    entityName: string;
    entityType: EntityInput["entityType"];
    routingOutcome: RoutingOutcome;
    pricingStatus: PricingStatus;
    complexityPoints: number;
    annualFeeEstimate: number | null;
    onboardingFeeEstimate: number | null;
    jmReasons: string[];
    reviewReasons: string[];
}
export interface ApplicationAssessment {
    overallOutcome: RoutingOutcome;
    indicativePricingAvailable: boolean;
    annualSubtotal: number;
    onboardingSubtotal: number;
    groupDiscountAmount: number;
    totalEstimate: number | null;
    requiresJmFollowUp: boolean;
    requiresManualReview: boolean;
    entityAssessments: EntityAssessment[];
}
//# sourceMappingURL=application.d.ts.map