import { JobSource, NormalizedJob } from '../domain/job.types.js';

export interface JobCollector {
  readonly source: JobSource;
  collect(searchTerms: string[]): Promise<NormalizedJob[]>;
}

export const JOB_COLLECTORS = Symbol('JOB_COLLECTORS');
