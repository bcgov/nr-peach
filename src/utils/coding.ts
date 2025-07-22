/**
 * A complete mapping of registered PIES code systems, their respective codes and associated metadata.
 * This object provides a structured representation of application process codes,
 * where each code is mapped to a `CodeMap` containing its code set hierarchy and display label.
 */
export const CodingDictionary: Record<
  string, // Codesystem
  Record<
    string, // Code
    {
      codeSet: [string] | [string, string] | [string, string, string];
      display: string;
    }
  >
> = Object.freeze({
  'https://bcgov.github.io/nr-pies/docs/spec/code_system/application_process': {
    APPLICATION: {
      codeSet: ['APPLICATION'],
      display: 'Application'
    },
    ALLOWED: {
      codeSet: ['APPLICATION', 'DECISION', 'ALLOWED'],
      display: 'Allowed'
    },
    DECISION_REVIEW: {
      codeSet: ['APPLICATION', 'DECISION', 'DECISION_REVIEW'],
      display: 'Decision Review'
    },
    DECISION: {
      codeSet: ['APPLICATION', 'DECISION'],
      display: 'Decision'
    },
    DECLINED: {
      codeSet: ['APPLICATION', 'ISSUANCE', 'DECLINED'],
      display: 'Declined'
    },
    DISALLOWED: {
      codeSet: ['APPLICATION', 'DECISION', 'DISALLOWED'],
      display: 'Disallowed'
    },
    DRAFT: {
      codeSet: ['APPLICATION', 'PRE_APPLICATION', 'DRAFT'],
      display: 'Draft'
    },
    FIRST_NATIONS_CONSULTATION: {
      codeSet: ['APPLICATION', 'TECH_REVIEW_COMMENT', 'FIRST_NATIONS_CONSULTATION'],
      display: 'First Nations Consultation'
    },
    INITIAL_SUBMISSION_REVIEW: {
      codeSet: ['APPLICATION', 'INITIAL_SUBMISSION_REVIEW'],
      display: 'Initial Submission Review'
    },
    ISSUANCE: {
      codeSet: ['APPLICATION', 'ISSUANCE'],
      display: 'Issuance'
    },
    ISSUED: {
      codeSet: ['APPLICATION', 'ISSUANCE', 'ISSUED'],
      display: 'Issued'
    },
    OFFERED: {
      codeSet: ['APPLICATION', 'ISSUANCE', 'OFFERED'],
      display: 'Offered'
    },
    PRE_APPLICATION: {
      codeSet: ['APPLICATION', 'PRE_APPLICATION'],
      display: 'Pre-Application'
    },
    REFERRAL: {
      codeSet: ['APPLICATION', 'TECH_REVIEW_COMMENT', 'REFERRAL'],
      display: 'Referral'
    },
    REJECTED: {
      codeSet: ['APPLICATION', 'REJECTED'],
      display: 'Rejected'
    },
    SUBMISSION_REVIEW: {
      codeSet: ['APPLICATION', 'INITIAL_SUBMISSION_REVIEW', 'SUBMISSION_REVIEW'],
      display: 'Submission Review'
    },
    SUBMITTED: {
      codeSet: ['APPLICATION', 'PRE_APPLICATION', 'SUBMITTED'],
      display: 'Submitted'
    },
    TECH_REVIEW_COMMENT: {
      codeSet: ['APPLICATION', 'TECH_REVIEW_COMMENT'],
      display: 'Technical Review and Comment'
    },
    TECH_REVIEW_COMPLETED: {
      codeSet: ['APPLICATION', 'TECH_REVIEW_COMMENT', 'TECH_REVIEW_COMPLETED'],
      display: 'Technical Review Completed'
    },
    TECHNICAL_REVIEW: {
      codeSet: ['APPLICATION', 'TECH_REVIEW_COMMENT', 'TECHNICAL_REVIEW'],
      display: 'Technical Review'
    },
    WITHDRAWN: {
      codeSet: ['APPLICATION', 'WITHDRAWN'],
      display: 'Withdrawn'
    }
  }
});
