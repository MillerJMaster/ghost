import {Inject} from '@nestjs/common';
import {SnippetsRepository} from '../../core/snippets/snippets.repository.interface';
import {Knex} from 'knex';
import {Snippet} from '../../core/snippets/snippet.entity';
import ObjectID from 'bson-objectid';
import {OrderOf, Page} from '../../common/repository';
import assert from 'assert';
import nql from '@tryghost/nql';

export class KnexSnippetsRepository implements SnippetsRepository {
    constructor(@Inject('knex') private readonly knex: Knex) {}

    readonly table = 'snippets';

    async save(entity: Snippet): Promise<void> {
        const rows = await this.knex(this.table)
            .where('id', entity.id.toHexString())
            .count('id', {as: 'count'});

        assert(rows.length === 1, 'Got multiple rows for count query');
        let exists: boolean;
        if (typeof rows[0].count === 'number') {
            exists = rows[0].count !== 0;
        } else {
            exists = parseInt(rows[0].count) !== 0;
        }

        const row = {
            id: entity.id,
            name: entity.name,
            lexical: entity.lexical,
            mobiledoc: entity.mobiledoc,
            created_at: entity.createdAt,
            updated_at: entity.updatedAt
        };

        if (exists) {
            await this.knex(this.table).update(row).where('id', entity.id.toHexString());
        } else {
            await this.knex(this.table).insert(row);
        }
    }

    async getOne(id: ObjectID): Promise<Snippet | null> {
        const rows = await this.knex(this.table)
            .where('id', id.toHexString())
            .select();
        if (rows.length === 0) {
            return null;
        }
        assert(rows.length === 1, 'Found two rows with the same id');

        const row = rows[0];

        try {
            const snippet = Snippet.create({
                id: row.id,
                name: row.name,
                lexical: row.lexical,
                mobiledoc: row.mobiledoc,
                createdAt: new Date(row.created_at),
                updatedAt: row.updated_at ? new Date(row.updated_at) : null
            });
            return snippet;
        } catch (err) {
            // TODO: Sentry logging
            return null;
        }
    }

    async getAll(
        order: OrderOf<[]>[],
        filter?: string | undefined
    ): Promise<Snippet[]> {
        const knexOrder = order.map((obj) => {
            return {
                column: obj.field,
                order: obj.direction
            };
        });
        const query = this.knex(this.table).orderBy(knexOrder);
        if (filter) {
            nql(filter).querySQL(query);
        }
        const rows = await query.select();
        const snippets = rows.reduce((memo, row) => {
            let entity;
            try {
                entity = Snippet.create({
                    id: row.id,
                    name: row.name,
                    lexical: row.lexical,
                    mobiledoc: row.mobiledoc,
                    createdAt: new Date(row.created_at),
                    updatedAt: row.updated_at ? new Date(row.updated_at) : null
                });
            } catch (err) {
                // TODO: Sentry logging
                entity = null;
            }
            if (!entity) {
                return memo;
            }
            return memo.concat(entity);
        }, []);
        return snippets;
    }

    async getSome(
        page: Page,
        order: OrderOf<[]>[],
        filter?: string | undefined
    ): Promise<Snippet[]> {
        const knexOrder = order.map((obj) => {
            return {
                column: obj.field,
                order: obj.direction
            };
        });
        const query = this.knex(this.table)
            .orderBy(knexOrder)
            .limit(page.count)
            .offset((page.page - 1) * page.count);
        if (filter) {
            nql(filter).querySQL(query);
        }
        const rows = await query.select();
        const snippets = rows.reduce((memo, row) => {
            let entity;
            try {
                entity = Snippet.create({
                    id: row.id,
                    name: row.name,
                    lexical: row.lexical,
                    mobiledoc: row.mobiledoc,
                    createdAt: new Date(row.created_at),
                    updatedAt: row.updated_at ? new Date(row.updated_at) : null
                });
            } catch (err) {
                // TODO: Sentry logging
                entity = null;
            }
            if (!entity) {
                return memo;
            }
            return memo.concat(entity);
        }, []);
        return snippets;
    }

    async getCount(filter?: string | undefined): Promise<number> {
        const query = this.knex(this.table);
        if (filter) {
            nql(filter).querySQL(query);
        }
        const rows = await query.count('id', {as: 'count'});
        assert(rows.length === 1, 'Got multiple rows for count query');
        const row = rows[0];
        const count = row.count;
        if (typeof count === 'number') {
            return count;
        }
        return parseInt(count, 10);
    }
}
