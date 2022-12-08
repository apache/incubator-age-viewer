/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const CypherService = require("../services/cypherService");
const sessionService = require("../services/sessionService");
const GraphCreator = require("../models/DataParser");

class CypherController {
    async executeCypher(req, res) {
        let connectorService = sessionService.get(req.sessionID);
        if (connectorService.isConnected()) {
            let cypherService = new CypherService(
                connectorService.graphRepository
            );
            let data = await cypherService.executeCypher(req.body.cmd);
            res.status(200).json(data).end();
        } else {
            throw new Error("Not connected");
        }
    }

    async createGraph(req, res, next) {
        let db = sessionService.get(req.sessionID);
        if (db.isConnected()){
            let cypherService = new CypherService(
                db.graphRepository
            );
            console.log(req.files, req.body);
            let graph = new GraphCreator(req.files.nodes,req.files.edges, req.body.graphName);
            await graph.parseData();
            console.log(graph.query.nodes, graph.query.edges);
            await cypherService.executeCypher(graph.query.graph);
            await Promise.all(graph.query.nodes.map(async (q)=>{
                return await cypherService.executeCypher(q);
            }));
            await Promise.all(graph.query.edges.map(async (q)=>{
                return await cypherService.executeCypher(q);
            }));
            // await cypherService.createGraph();
            res.status(204).end();
        }
    }
}

module.exports = CypherController;
