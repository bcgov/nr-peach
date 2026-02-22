import { getDefinedOperations, mockDb } from './repository.helper.ts';
import { BaseRepository } from '../../../src/repositories/base.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '../../../src/types/index.js';

// Locally extend DB interface to test against an abstract 'schema.test_table' table
declare module '../../../src/types/index.d.ts' {
  interface DB {
    'schema.test_table': { id: number; foo: string; bar: string };
  }
}

const CONSTRAINTS_ONE = ['first_constraint'] as const;
const CONSTRAINTS_TWO = ['first_constraint', 'second_constraint'] as const;

class TestRepository extends BaseRepository<'schema.test_table'> {
  constructor(db: Kysely<DB> | Transaction<DB>) {
    super('schema.test_table', db);
  }
}

class OneRepository extends BaseRepository<'schema.test_table', (typeof CONSTRAINTS_ONE)[number]> {
  constructor(db: Kysely<DB> | Transaction<DB>) {
    super('schema.test_table', db, CONSTRAINTS_ONE);
  }
}

class TwoRepository extends BaseRepository<'schema.test_table', (typeof CONSTRAINTS_TWO)[number]> {
  constructor(db: Kysely<DB> | Transaction<DB>) {
    super('schema.test_table', db, CONSTRAINTS_TWO);
  }
}

describe('BaseRepository', () => {
  const repository = new TestRepository(mockDb);
  const oneRepository = new OneRepository(mockDb);
  const twoRepository = new TwoRepository(mockDb);

  describe('create', () => {
    it('should build an insert query for the given entity', () => {
      const data = { id: 1, foo: 'Test', bar: 'Data' };
      const compiled = repository.create(data).compile();

      expect(getDefinedOperations(compiled.query)).toEqual(['kind', 'into', 'columns', 'values', 'returning']);
      expect(compiled.query.kind).toBe('InsertQueryNode');
      expect(compiled.sql).toBe(
        'insert into "schema"."test_table" ("id", "foo", "bar") values ($1, $2, $3) returning *'
      );
      expect(compiled.parameters).toEqual([data.id, data.foo, data.bar]);
    });
  });

  describe('createMany', () => {
    it('should build an insert query for the multiple entities', () => {
      const data = [
        { id: 1, foo: 'Test1', bar: 'Data1' },
        { id: 2, foo: 'Test2', bar: 'Data2' }
      ];
      const compiled = repository.createMany(data).compile();

      expect(getDefinedOperations(compiled.query)).toEqual(['kind', 'into', 'columns', 'values', 'returning']);
      expect(compiled.query.kind).toBe('InsertQueryNode');
      expect(compiled.sql).toBe(
        'insert into "schema"."test_table" ("id", "foo", "bar") values ($1, $2, $3), ($4, $5, $6) returning *'
      );
      expect(compiled.parameters).toEqual([data[0].id, data[0].foo, data[0].bar, data[1].id, data[1].foo, data[1].bar]);
    });
  });

  describe('delete', () => {
    it('should build a delete query for the specified id', () => {
      const id = 1;
      const compiled = repository.delete(id).compile();

      expect(getDefinedOperations(compiled.query)).toEqual(['kind', 'from', 'where']);
      expect(compiled.query.kind).toBe('DeleteQueryNode');
      expect(compiled.sql).toBe('delete from "schema"."test_table" where "id" = $1');
      expect(compiled.parameters).toEqual([id]);
    });
  });

  describe('deleteExcept', () => {
    it('should build a delete query excluding the multiple ids', () => {
      const data = [1, 2];
      const compiled = repository.deleteExcept(data).compile();

      expect(getDefinedOperations(compiled.query)).toEqual(['kind', 'from', 'where']);
      expect(compiled.query.kind).toBe('DeleteQueryNode');
      expect(compiled.sql).toBe('delete from "schema"."test_table" where "id" not in ($1, $2)');
      expect(compiled.parameters).toEqual(data);
    });

    it('should build a scoped delete query excluding the multiple ids', () => {
      const data = [1, 2];
      const compiled = repository.deleteExcept(data, { foo: 'Test' }).compile();

      expect(getDefinedOperations(compiled.query)).toEqual(['kind', 'from', 'where']);
      expect(compiled.query.kind).toBe('DeleteQueryNode');
      expect(compiled.sql).toBe('delete from "schema"."test_table" where "foo" = $1 and "id" not in ($2, $3)');
      expect(compiled.parameters).toEqual(['Test', ...data]);
    });

    it('should build a simple scoped delete query', () => {
      const data: readonly number[] = [];
      const compiled = repository.deleteExcept(data, { foo: 'Test' }).compile();

      expect(getDefinedOperations(compiled.query)).toEqual(['kind', 'from', 'where']);
      expect(compiled.query.kind).toBe('DeleteQueryNode');
      expect(compiled.sql).toBe('delete from "schema"."test_table" where "foo" = $1');
      expect(compiled.parameters).toEqual(['Test']);
    });
  });

  describe('deleteMany', () => {
    it('should build a delete query for the multiple ids', () => {
      const data = [1, 2];
      const compiled = repository.deleteMany(data).compile();

      expect(getDefinedOperations(compiled.query)).toEqual(['kind', 'from', 'where']);
      expect(compiled.query.kind).toBe('DeleteQueryNode');
      expect(compiled.sql).toBe('delete from "schema"."test_table" where "id" in ($1, $2)');
      expect(compiled.parameters).toEqual(data);
    });
  });

  describe('findById', () => {
    it('should build a select query by filtering', () => {
      const filter = { foo: 'Test' };
      const compiled = repository.findBy(filter).compile();

      expect(getDefinedOperations(compiled.query)).toEqual(['kind', 'from', 'selections', 'where']);
      expect(compiled.query.kind).toBe('SelectQueryNode');
      expect(compiled.sql).toBe('select * from "schema"."test_table" where "foo" = $1');
      expect(compiled.parameters).toEqual([filter.foo]);
    });

    it('should build a select query with multiple filters', () => {
      const filter = { foo: 'Test', bar: 'Data' };
      const compiled = repository.findBy(filter).compile();

      expect(getDefinedOperations(compiled.query)).toEqual(['kind', 'from', 'selections', 'where']);
      expect(compiled.query.kind).toBe('SelectQueryNode');
      expect(compiled.sql).toBe('select * from "schema"."test_table" where ("foo" = $1 and "bar" = $2)');
      expect(compiled.parameters).toEqual([filter.foo, filter.bar]);
    });
  });

  describe('read', () => {
    it('should build a select query for the specified id', () => {
      const id = 1;
      const compiled = repository.read(id).compile();

      expect(getDefinedOperations(compiled.query)).toEqual(['kind', 'from', 'selections', 'where']);
      expect(compiled.query.kind).toBe('SelectQueryNode');
      expect(compiled.sql).toBe('select * from "schema"."test_table" where "id" = $1');
      expect(compiled.parameters).toEqual([id]);
    });
  });

  describe('upsert', () => {
    it('should build an insert query with default id constraint for the given entity', () => {
      const data = { id: 1, foo: 'Test', bar: 'Data' };
      const compiled = repository.upsert(data).compile();

      expect(getDefinedOperations(compiled.query)).toEqual([
        'kind',
        'into',
        'columns',
        'values',
        'returning',
        'onConflict'
      ]);
      expect(compiled.query.kind).toBe('InsertQueryNode');
      expect(compiled.sql).toBe(
        'insert into "schema"."test_table" ("id", "foo", "bar") ' +
          'values ($1, $2, $3) ' +
          'on conflict ("id") do nothing returning *'
      );
      expect(compiled.parameters).toEqual([data.id, data.foo, data.bar]);
    });

    it('should build an insert query with a default named constraint for the given entity', () => {
      const data = { id: 1, foo: 'Test', bar: 'Data' };
      const compiled = oneRepository.upsert(data).compile();

      expect(getDefinedOperations(compiled.query)).toEqual([
        'kind',
        'into',
        'columns',
        'values',
        'returning',
        'onConflict'
      ]);
      expect(compiled.query.kind).toBe('InsertQueryNode');
      expect(compiled.sql).toBe(
        'insert into "schema"."test_table" ("id", "foo", "bar") ' +
          'values ($1, $2, $3) ' +
          'on conflict on constraint "first_constraint" do nothing returning *'
      );
      expect(compiled.parameters).toEqual([data.id, data.foo, data.bar]);
    });

    it('should build an insert query with a specified constraint for the given entity', () => {
      const data = { id: 1, foo: 'Test', bar: 'Data' };
      const compiled = twoRepository.upsert(data, 'second_constraint').compile();

      expect(getDefinedOperations(compiled.query)).toEqual([
        'kind',
        'into',
        'columns',
        'values',
        'returning',
        'onConflict'
      ]);
      expect(compiled.query.kind).toBe('InsertQueryNode');
      expect(compiled.sql).toBe(
        'insert into "schema"."test_table" ("id", "foo", "bar") ' +
          'values ($1, $2, $3) ' +
          'on conflict on constraint "second_constraint" do nothing returning *'
      );
      expect(compiled.parameters).toEqual([data.id, data.foo, data.bar]);
    });
  });

  describe('upsertMany', () => {
    it('should build an insert query with default id constraint for the multiple entities', () => {
      const data = [
        { id: 1, foo: 'Test1', bar: 'Data1' },
        { id: 2, foo: 'Test2', bar: 'Data2' }
      ];
      const compiled = repository.upsertMany(data).compile();

      expect(getDefinedOperations(compiled.query)).toEqual([
        'kind',
        'into',
        'columns',
        'values',
        'returning',
        'onConflict'
      ]);
      expect(compiled.query.kind).toBe('InsertQueryNode');
      expect(compiled.sql).toBe(
        'insert into "schema"."test_table" ("id", "foo", "bar") ' +
          'values ($1, $2, $3), ($4, $5, $6) ' +
          'on conflict ("id") do nothing returning *'
      );
      expect(compiled.parameters).toEqual([data[0].id, data[0].foo, data[0].bar, data[1].id, data[1].foo, data[1].bar]);
    });

    it('should build an insert query with a default named constraint for the multiple entities', () => {
      const data = [
        { id: 1, foo: 'Test1', bar: 'Data1' },
        { id: 2, foo: 'Test2', bar: 'Data2' }
      ];
      const compiled = oneRepository.upsertMany(data).compile();

      expect(getDefinedOperations(compiled.query)).toEqual([
        'kind',
        'into',
        'columns',
        'values',
        'returning',
        'onConflict'
      ]);
      expect(compiled.query.kind).toBe('InsertQueryNode');
      expect(compiled.sql).toBe(
        'insert into "schema"."test_table" ("id", "foo", "bar") ' +
          'values ($1, $2, $3), ($4, $5, $6) ' +
          'on conflict on constraint "first_constraint" do nothing returning *'
      );
      expect(compiled.parameters).toEqual([data[0].id, data[0].foo, data[0].bar, data[1].id, data[1].foo, data[1].bar]);
    });

    it('should build an insert query with a specified constraint for the multiple entities', () => {
      const data = [
        { id: 1, foo: 'Test1', bar: 'Data1' },
        { id: 2, foo: 'Test2', bar: 'Data2' }
      ];
      const compiled = twoRepository.upsertMany(data, 'second_constraint').compile();

      expect(getDefinedOperations(compiled.query)).toEqual([
        'kind',
        'into',
        'columns',
        'values',
        'returning',
        'onConflict'
      ]);
      expect(compiled.query.kind).toBe('InsertQueryNode');
      expect(compiled.sql).toBe(
        'insert into "schema"."test_table" ("id", "foo", "bar") ' +
          'values ($1, $2, $3), ($4, $5, $6) ' +
          'on conflict on constraint "second_constraint" do nothing returning *'
      );
      expect(compiled.parameters).toEqual([data[0].id, data[0].foo, data[0].bar, data[1].id, data[1].foo, data[1].bar]);
    });
  });
});
