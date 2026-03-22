export declare const ENTITY_BASE_FEES: {
    readonly individual: 1800;
    readonly company: 1800;
    readonly trust: 1800;
    readonly smsf: 2000;
};
export declare const COMPLEXITY_POINTS: {
    readonly listedInvestment: 1;
    readonly unlistedInvestment: 5;
    readonly investmentProperty: 6;
    readonly wrapAccount: 3;
    readonly crypto: 5;
    readonly foreignInvestments: 3;
};
export declare const COMPLEXITY_BANDS: readonly [{
    readonly min: 0;
    readonly max: 10;
    readonly annualFee: 0;
    readonly pricingStatus: "indicative";
}, {
    readonly min: 11;
    readonly max: 20;
    readonly annualFee: 700;
    readonly pricingStatus: "indicative";
}, {
    readonly min: 21;
    readonly max: 30;
    readonly annualFee: 1300;
    readonly pricingStatus: "indicative";
}, {
    readonly min: 31;
    readonly max: 40;
    readonly annualFee: 2000;
    readonly pricingStatus: "indicative";
}, {
    readonly min: 41;
    readonly max: 50;
    readonly annualFee: 2800;
    readonly pricingStatus: "indicative";
}, {
    readonly min: 51;
    readonly max: number;
    readonly annualFee: 0;
    readonly pricingStatus: "manual_review";
}];
export declare const REPORTING_ADD_ONS: {
    readonly quarterly_reporting: 1200;
    readonly monthly_reporting: 3000;
};
export declare const OTHER_ADD_ONS: {
    readonly bas: 900;
    readonly asic_agent: 300;
};
export declare const ONBOARDING_FEES: {
    readonly new: 750;
    readonly existing_clean: 1500;
    readonly existing_reconciliation: 2500;
};
export declare const JM_ONLY_SERVICES: Set<string>;
//# sourceMappingURL=pricing.d.ts.map