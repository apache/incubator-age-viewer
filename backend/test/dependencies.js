const app = require('../src/app');
const { queries } = require('./test-queries/queries');
const { connectionForm } = require('./testDB');
const pathCreate = require('path');
const request = require('supertest');
const expect = require('chai').expect;
const agent = request.agent(app);
request.Test.prototype.attachMultiple = function(files, key){
    files.forEach(([name, path])=>{
        this.attach(key, path, name);
    });
    return this;
}

const START_PATH = '/api/v1'

const getPathForFile = function(fname){
    const dataPath = 'test-data'
    return pathCreate.join(__dirname, dataPath, fname); 
}

module.exports = {
    app,
    queries,
    connectionForm,
    pathCreate,
    request,
    expect,
    agent,
    START_PATH,
    getPathForFile
}