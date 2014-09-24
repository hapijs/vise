// Load modules

var Lab = require('lab');
var Vise = require('..');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Lab.expect;


describe('Vise', function () {

    var validate = function (vise, content) {

        expect(vise.length).to.equal(content.length);

        expect(vise.charCodeAt(content.length)).to.equal(undefined);
        expect(vise.charCodeAt(content.length + 1)).to.equal(undefined);
        expect(vise.charCodeAt(content.length + 100)).to.equal(undefined);
        expect(vise.charCodeAt(-1)).to.equal(undefined);

        for (var i = 0, il = content.length; i < il; ++i) {
            expect(vise.charCodeAt(i)).to.equal(content.charCodeAt(i));
        }

        for (i = content.length - 1; i >= 0; --i) {
            expect(vise.charCodeAt(i)).to.equal(content.charCodeAt(i));
        }
    };

    it('combines strings', function (done) {

        var data = ['abcde', 'fgh', 'ijk'];
        var vise = new Vise(data);
        validate(vise, 'abcdefghijk');
        done();
    });

    it('combines buffers', function (done) {

        var data = [new Buffer('abcde'), new Buffer('fgh'), new Buffer('ijk')];
        var vise = new Vise(data);
        validate(vise, 'abcdefghijk');
        done();
    });

    it('combines buffers and strings', function (done) {

        var data = ['abcde', new Buffer('fgh'), 'ijk'];
        var vise = new Vise(data);
        validate(vise, 'abcdefghijk');
        done();
    });

    it('combines single string', function (done) {

        var data = 'abcde';
        var vise = new Vise(data);
        validate(vise, 'abcde');
        done();
    });

    it('combines single buffer', function (done) {

        var data = new Buffer('abcde');
        var vise = new Vise(data);
        expect(vise.length).to.equal(5);
        validate(vise, 'abcde');
        done();
    });

    it('allows empty input', function (done) {

        var vise = new Vise();
        expect(vise.length).to.equal(0);
        expect(vise.charCodeAt(0)).to.equal(undefined);
        done();
    });

    it('throws on invalid input', function (done) {

        expect(function () {

            new Vise(123);
        }).to.throw('Chunk must be string or buffer');

        done();
    });

    describe('length', function () {

        it('reflects total legnth', function (done) {

            var vise = new Vise(['abcdefghijklmn', 'opqrstuvwxyz']);
            expect(vise.length).to.equal(26);
            done();
        });
    });

    describe('push()', function () {

        it('adds a string', function (done) {

            var data = ['abcde', 'fgh'];
            var vise = new Vise(data);
            validate(vise, 'abcdefgh');

            vise.push('ijk');
            validate(vise, 'abcdefghijk');
            done();
        });

        it('adds to empty array', function (done) {

            var vise = new Vise();
            expect(vise.length).to.equal(0);
            expect(vise.charCodeAt(0)).to.equal(undefined);
            vise.push('abcde');
            validate(vise, 'abcde');
            done();
        });
    });

    describe('shift()', function (done) {

        it('removes chunks', function (done) {

            var data = ['abcde', 'fgh', 'ijk'];
            var vise = new Vise(data);
            validate(vise, 'abcdefghijk');

            expect(vise.shift(2)).to.deep.equal(['ab']);
            validate(vise, 'cdefghijk');

            expect(vise.shift(2)).to.deep.equal(['cd']);
            validate(vise, 'efghijk');

            expect(vise.shift(0)).to.deep.equal([]);
            validate(vise, 'efghijk');

            expect(vise.shift(1)).to.deep.equal(['e']);
            validate(vise, 'fghijk');

            expect(vise.shift(4)).to.deep.equal(['fgh', 'i']);
            validate(vise, 'jk');

            expect(vise.shift(4)).to.deep.equal(['jk']);
            validate(vise, '');

            done();
        });

        it('keeps track of chunks offset', function (done) {

            var vise = new Vise();

            vise.push('acb123de');
            vise.shift(3);
            vise.shift(3);
            vise.push('fg12');
            vise.push('3hij1');

            validate(vise, 'defg123hij1');
            done();
        });

        it('removes multiple chunks', function (done) {

            var data = ['abcde', 'fgh', 'ijk'];
            var vise = new Vise(data);
            validate(vise, 'abcdefghijk');

            vise.shift(10);
            validate(vise, 'k');

            done();
        });
    });

    describe('chunks()', function (done) {

        it('returns remaining chunks', function (done) {

            var data = ['abcde', 'fgh', 'ijk'];
            var vise = new Vise(data);
            expect(vise.chunks()).to.deep.equal(data);

            vise.shift(2);
            expect(vise.chunks()).to.deep.equal(['cde', 'fgh', 'ijk']);

            vise.shift(2);
            expect(vise.chunks()).to.deep.equal(['e', 'fgh', 'ijk']);

            vise.shift(0);
            expect(vise.chunks()).to.deep.equal(['e', 'fgh', 'ijk']);

            vise.shift(1);
            expect(vise.chunks()).to.deep.equal(['fgh', 'ijk']);

            vise.shift(4);
            expect(vise.chunks()).to.deep.equal(['jk']);

            vise.shift(4);
            expect(vise.chunks()).to.deep.equal([]);

            done();
        });
    });
});
