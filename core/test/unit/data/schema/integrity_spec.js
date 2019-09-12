var should = require('should'),
    _ = require('lodash'),
    crypto = require('crypto'),
    schema = require('../../../../server/data/schema'),
    fixtures = require('../../../../server/data/schema/fixtures');

/**
 * @NOTE
 *
 * If this test fails for you, you have modified the database schema or fixtures.
 * When you make a change, please test that:
 *
 * 1. A new blog get's installed and the database looks correct and complete.
 * 2. A blog get's updated from a lower Ghost version and the database looks correct and complete.
 *
 * Typical cases:
 * You have to add a migration script if you've added/modified permissions.
 * You have to add a migration script if you've add a new table.
 */
describe('DB version integrity', function () {
    // Only these variables should need updating
    const currentSchemaHash = '03cc85e710d3b421c71066afc7c25b39';
    const currentFixturesHash = '4e08bb27bf16338b6eebad1f92a247d1';

    // If this test is failing, then it is likely a change has been made that requires a DB version bump,
    // and the values above will need updating as confirmation
    it('should not change without fixing this test', function () {
        var tablesNoValidation = _.cloneDeep(schema.tables),
            schemaHash,
            fixturesHash;

        _.each(tablesNoValidation, function (table) {
            return _.each(table, function (column, name) {
                table[name] = _.omit(column, 'validations');
            });
        });

        schemaHash = crypto.createHash('md5').update(JSON.stringify(tablesNoValidation), 'binary').digest('hex');
        fixturesHash = crypto.createHash('md5').update(JSON.stringify(fixtures), 'binary').digest('hex');

        schemaHash.should.eql(currentSchemaHash);
        fixturesHash.should.eql(currentFixturesHash);
    });
});
