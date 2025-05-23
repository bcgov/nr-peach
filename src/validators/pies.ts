/**
 * Configuration for PIES (Permitting Information Exchange Specification).
 */
export const pies = {
  root: 'https://raw.githubusercontent.com/bcgov/nr-pies/refs',
  schemaSuffix: '.schema.json',
  spec: {
    dir: 'docs/spec/element',
    data: {
      code: 'data/code',
      event: 'data/event',
      header: 'data/header',
      parcelIdentifier: 'data/parcel_id',
      process: 'data/process'
      // projectBundle: 'data/project_bundle'
    },
    resource: {
      processEvent: 'resource/process_event'
    },
    message: {
      processEventSet: 'message/process_event_set',
      recordLinkage: 'message/record_linkage'
    }
  },
  version: {
    latest: 'heads/main'
    // v0_1_0: 'v0.1.0'
  }
};

/**
 * Constructs the URI for a PIES schema based on the provided schema name and version.
 * @param schema - The name of the schema to retrieve.
 * @param version - The version of the schema. Defaults to the latest version defined in `pies.version.latest`.
 * @returns The fully constructed URI for the specified pie schema.
 */
export function getPiesSchemaUri(schema: string, version: string = pies.version.latest): string {
  return `${pies.root}/${version}/${pies.spec.dir}/${schema}${pies.schemaSuffix}`;
}
