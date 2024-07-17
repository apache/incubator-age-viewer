const {
    queries,
    connectionForm,
    getPathForFile,
    expect,
    agent,
    START_PATH
} = require('./dependencies');

describe('metadata', ()=>{
    const path = `${START_PATH}/db/connect`
    // connect to database
    before((done)=>{

        agent
            .post(path)
            .send({...connectionForm})
            .end((err, res)=>{
                expect(err).to.be.null;
                expect(res).property('status').to.equal(200)
                done();
            });

    });
    // create graph
    beforeEach((done)=>{
        const urlPath = `${START_PATH}/cypher/init`
        const nodesFilePath = [['Make', getPathForFile('make.csv')],['Model', getPathForFile('model.csv')]]
        const edgesFilePath = [['has_model', getPathForFile('has_model.csv')]]
        const formData = {
            nodes:nodesFilePath,
            edges:edgesFilePath,
            graphName:connectionForm.database,
            dropGraph:'true'
        }
        agent
            .post(urlPath)
            .field('graphName', formData.graphName)
            .field('dropGraph', formData.dropGraph)
            .attachMultiple(nodesFilePath, 'nodes')
            .attachMultiple(edgesFilePath, 'edges')
            .end((err, res)=>{
                expect(err).to.be.null;
                expect(res.status).to.equal(204);
                
                done();
            });
    })
    // drop graph / clean up
    afterEach((done)=>{
        const urlPath = `${START_PATH}/cypher`
        const query = queries.drop_graph(connectionForm.database, true, (s)=>{
            return {cmd: s}
        })
        agent
            .post(urlPath)
            .send(query)
            .expect(200)
            .end(done)
    })

    it("get metadata", (done)=>{
        const urlPath = `${START_PATH}/db/meta`
        agent
            .post(urlPath)
            .send({"currentGraph":connectionForm.database})
            .end((err, res)=>{
                expect(err).to.be.null;
                expect(res.body).to.haveOwnProperty(connectionForm.database)
                const nodes = res.body[connectionForm.database].nodes
                const edges = res.body[connectionForm.database].edges
                expect(nodes).lengthOf(2)
                expect(edges).lengthOf(1)
                done();

            })
    })
    
});

