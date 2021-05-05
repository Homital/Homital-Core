/* eslint-disable no-undef */
/* eslint-disable require-jsdoc */

const expect = require('chai').expect;
const utils = require('../../app/utils/utils');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // load .env file into process.env

describe('#authenticateToken()', () => {
  context('no authentication header', () => {
    it('should sendStatus(401)', () => {
      const req = {headers: []};
      let nextCalled = false;
      let status = null;
      function next() {
        nextCalled = true;
      }
      const res = {sendStatus: (x) => {
        status=x;
      }};
      utils.authenticateToken(req, res, next);
      expect(req).to.not.have.property('user');
      expect(nextCalled).to.be.false;
      expect(status).to.equal(401);
    });
  });
  context('incorrect bearer token', () => {
    it('should sendStatus(404)', () => {
      const req = {headers: []};
      req.headers['authorization'] = 'Bearer 5201314';
      let nextCalled = false;
      let status = null;
      function next() {
        nextCalled = true;
      }
      const res = {sendStatus: (x) => {
        status=x;
      }};
      utils.authenticateToken(req, res, next);
      expect(req).to.not.have.property('user');
      expect(nextCalled).to.be.false;
      expect(status).to.equal(403);
    });
  });
  context('correct bearer token', () => {
    it('should set user', () => {
      const req = {headers: []};
      const token = jwt.sign(
          {username: 'hello'},
          process.env.ACCESS_TOKEN_SECRET,
          {expiresIn: '30m'},
      );
      req.headers['authorization'] = 'Bearer ' + token;
      let nextCalled = false;
      let status = null;
      function next() {
        nextCalled = true;
      }
      const res = {sendStatus: (x) => {
        status=x;
      }};
      utils.authenticateToken(req, res, next);
      expect(req).to.have.property('user');
      expect(req.user).to.have.property('username');
      expect(req.user.username).to.equal('hello');
      expect(nextCalled).to.be.true;
      expect(status).to.be.null;
    });
  });
});

describe('#validateEmail', () => {
  context('Correct email format', () => {
    it('should return true', () => {
      const emailList = [
        'asfe.ASD@GMAIL.com',
        'asda@aa.ad',
        '12345@qq.com',
        'adf@adad.qe.asd',
      ];
      for (const email of emailList) {
        expect(utils.validateEmail(email)).to.be.true;
      }
    });
  });
  context('Incorrect email format', () => {
    it('should return false', () => {
      const emailList = [
        'asfe.ASD@GMAIL',
        'asda@a.b',
        '12345.a.c',
        'adfadad',
        'adgrahgergs@',
        '@sadgargawserag',
        '你好世界@猴弥桃.康姆',
        'hahaha@猴弥桃.as',
      ];
      for (const email of emailList) {
        expect(utils.validateEmail(email)).to.be.false;
      }
    });
  });
});

const OTPList = [];

describe('#generateOTP()', () => {
  it('should return a 6-ditig number as a string', () => {
    for (let i = 0; i < 100; i++) {
      const otp = utils.generateOTP('123@homital.orz');
      expect(otp).to.be.a('string');
      expect(parseInt(otp)).to.be.at.least(0);
      expect(parseInt(otp)).to.be.at.most(999999);
      OTPList.push(otp);
    }
  });
});

describe('#testOTP()', () => {
  context('Valid OTP', () => {
    it('should return true', () => {
      for (const otp of OTPList) {
        expect(utils.testOTP('123@homital.orz', otp), otp + ' failed')
            .to.be.true;
      }
    });
  });
  context('Invalid OTP', () => {
    it('should return false', () => {
      for (let i = 0; i < 100; i++) {
        const otp = ((x) => x.length < 6 ? '0' * (6 - x.length) + x : x)(
            Math.floor(
                Math.random() * 1000000,
            ).toString());
        let invalid = false;
        for (const t of OTPList) {
          if (t.otp !== otp) {
            invalid = true;
          }
        }
        if (invalid) {
          expect(utils.testOTP('123@homital.orz', otp)).to.be.false;
        }
      }
    });
  });
});
